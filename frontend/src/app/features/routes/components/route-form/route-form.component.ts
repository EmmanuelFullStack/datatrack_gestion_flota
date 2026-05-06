import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { HttpClient } from '@angular/common/http';

import { Subject, firstValueFrom, timeout, takeUntil } from 'rxjs';
import * as L from 'leaflet';
import { RoutesService } from '../../../../core/services/routes.service';
import { RouteStop } from '../../../../core/models/models';

interface GraphNode {
  id:        string;
  lat:       number;
  lng:       number;
  dist:      number;
  prev:      string | null;
  neighbors: { nodeId: string; weight: number }[];
}

interface OverpassElement {
  type: 'node' | 'way';
  id:   number;
  lat?: number;
  lon?: number;
  nodes?: number[];
}

interface OverpassResponse {
  elements: OverpassElement[];
}

interface RouteFormDialogData {
  id: string | null;
}

@Component({
  selector: 'app-route-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './route-form.component.html',
  styleUrls: ['./route-form.component.scss'],
})
export class RouteFormComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  private readonly fb           = inject(FormBuilder);
  private readonly routesService = inject(RoutesService);
  private readonly snackBar     = inject(MatSnackBar);
  private readonly http         = inject(HttpClient);
  private readonly dialogRef    = inject(MatDialogRef<RouteFormComponent>);
  public  readonly data         = inject<RouteFormDialogData>(MAT_DIALOG_DATA);

  @ViewChild('routeMap') mapContainer!: ElementRef<HTMLElement>;

  form: FormGroup;
  isEdit           = false;
  routeId:         string | null = null;
  loading          = false;
  saving           = false;
  calculatingRoute = false;
  routeFinalized   = false;

  private map:       L.Map | null = null;
  public  markers:   L.Marker[]   = [];
  private routeLine: L.Polyline | null = null;
  private pendingParadas: RouteStop[] = [];

  /** Simple in-memory cache for Overpass API responses */
  private readonly overpassCache = new Map<string, OverpassResponse>();

  readonly estadoOptions = ['ACTIVA', 'INACTIVA', 'EN_SERVICIO'];

  constructor() {
    this.form = this.fb.group({
      nombre:          ['', [Validators.required, Validators.maxLength(255)]],
      origen:          ['', [Validators.required]],
      destino:         ['', [Validators.required]],
      distanciaKm:     [null, [Validators.min(0)]],
      capacidadMaxima: [40, [Validators.required, Validators.min(1), Validators.max(200)]],
      estado:          ['ACTIVA'],
    });

    // Fix Leaflet default icon paths
    delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)['_getIconUrl'];
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: '/assets/leaflet/marker-icon-2x.png',
      iconUrl:       '/assets/leaflet/marker-icon.png',
      shadowUrl:     '/assets/leaflet/marker-shadow.png',
    });
  }

  ngOnInit(): void {
    this.routeId = this.data?.id ?? null;
    this.isEdit  = !!this.routeId;

    if (this.isEdit && this.routeId) {
      this.loading = true;
      this.routesService
        .getById(this.routeId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (r) => {
            this.form.patchValue(r);
            this.loading = false;
            if (r.paradas && r.paradas.length > 0) this.pendingParadas = r.paradas;
          },
          error: () => { this.loading = false; },
        });
    }
  }

  ngAfterViewInit(): void {
    // Use requestAnimationFrame so the dialog container has finished painting
    requestAnimationFrame(() => this.initMap());
  }

  private initMap(): void {
    if (this.map || !this.mapContainer?.nativeElement) return;

    this.map = L.map(this.mapContainer.nativeElement).setView([4.61, -74.08], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(this.map);

    this.map.on('click', (e: L.LeafletMouseEvent) => this.onMapClick(e.latlng));

    if (this.pendingParadas.length > 0) {
      this.loadParadasOnMap(this.pendingParadas);
      this.pendingParadas = [];
    }
  }

  private loadParadasOnMap(paradas: RouteStop[]): void {
    const sorted = [...paradas].sort((a, b) => a.orden - b.orden);
    sorted.forEach((p, i) => {
      const isFirst = i === 0;
      const isLast  = i === sorted.length - 1;
      const color   = isFirst ? '#4f46e5' : isLast ? '#ef4444' : '#10b981';
      const label   = isFirst ? 'O' : isLast ? 'D' : `${i}`;

      const marker = L.marker(L.latLng(p.lat, p.lon), {
        draggable: true,
        icon: this.createColoredIcon(color, label),
      })
        .addTo(this.map!)
        .bindTooltip(p.nombre, { permanent: true, direction: 'top' });

      marker.on('dragend', () => this.runMultiPointDijkstra());
      this.markers.push(marker);
    });

    if (this.markers.length >= 2) {
      this.routeFinalized = true;
      void this.runMultiPointDijkstra();
    }
  }

  private onMapClick(latlng: L.LatLng): void {
    if (this.routeFinalized) return;

    const isFirst = this.markers.length === 0;
    const color   = isFirst ? '#4f46e5' : '#10b981';
    const label   = isFirst ? 'O' : `${this.markers.length}`;
    const tooltip = isFirst ? 'Origen' : `Parada ${this.markers.length}`;

    const marker = L.marker(latlng, { draggable: true, icon: this.createColoredIcon(color, label) })
      .addTo(this.map!)
      .bindTooltip(tooltip, { permanent: true, direction: 'top' });

    marker.on('dragend', () => this.runMultiPointDijkstra());
    this.markers.push(marker);
    this.updateFormFields();

    if (this.markers.length >= 2) void this.runMultiPointDijkstra();
  }

  finalizeRoute(): void {
    if (this.markers.length < 2) {
      this.snackBar.open('Debes colocar al menos un origen y un destino.', 'OK', { duration: 3000 });
      return;
    }
    this.routeFinalized = true;
    const last = this.markers[this.markers.length - 1];
    last.setIcon(this.createColoredIcon('#ef4444', 'D'));
    last.setTooltipContent('Último Destino');
    this.snackBar.open('Ruta finalizada. Puedes guardar el formulario.', 'OK', { duration: 3000 });
  }

  private updateFormFields(): void {
    if (this.markers.length > 0) {
      const start = this.markers[0].getLatLng();
      this.form.patchValue({ origen: `Lat: ${start.lat.toFixed(4)}, Lon: ${start.lng.toFixed(4)}` });
      if (this.markers.length > 1) {
        const end = this.markers[this.markers.length - 1].getLatLng();
        this.form.patchValue({ destino: `Lat: ${end.lat.toFixed(4)}, Lon: ${end.lng.toFixed(4)}` });
      }
    }
  }

  resetMarkers(): void {
    this.markers.forEach((m) => m.remove());
    this.markers = [];
    this.routeFinalized = false;
    if (this.routeLine) { this.map?.removeLayer(this.routeLine); this.routeLine = null; }
    this.form.patchValue({ origen: '', destino: '', distanciaKm: null });
  }

  private async runMultiPointDijkstra(): Promise<void> {
    if (this.markers.length < 2) return;
    this.calculatingRoute = true;
    let totalDist = 0;
    const fullPath: L.LatLng[] = [];
    if (this.routeLine) { this.map?.removeLayer(this.routeLine); this.routeLine = null; }

    try {
      for (let i = 0; i < this.markers.length - 1; i++) {
        const start = this.markers[i].getLatLng();
        const end   = this.markers[i + 1].getLatLng();
        const seg   = await this.getSegmentPath(start, end);

        if (seg) {
          totalDist += seg.distance;
          fullPath.push(...(i === 0 ? seg.points : seg.points.slice(1)));
        } else {
          totalDist += this.haversineKm(start.lat, start.lng, end.lat, end.lng);
          fullPath.push(start, end);
        }
      }

      this.routeLine = L.polyline(fullPath, { color: '#4f46e5', weight: 5, opacity: 0.9, lineCap: 'round' }).addTo(this.map!);
      this.form.patchValue({ distanciaKm: parseFloat(totalDist.toFixed(2)) });
      this.map!.fitBounds(this.routeLine.getBounds(), { padding: [40, 40] });
    } catch {
      this.snackBar.open('Error al calcular ruta', 'Cerrar', { duration: 3000 });
    } finally {
      this.calculatingRoute = false;
    }
  }

  private async getSegmentPath(
    start: L.LatLng,
    end:   L.LatLng,
  ): Promise<{ points: L.LatLng[]; distance: number } | null> {
    const margin = 0.012;
    const bbox   = `${Math.min(start.lat, end.lat) - margin},${Math.min(start.lng, end.lng) - margin},${Math.max(start.lat, end.lat) + margin},${Math.max(start.lng, end.lng) + margin}`;
    const query  = `[out:json];way["highway"](${bbox});out body;>;out skel qt;`;
    const url    = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

    let data: OverpassResponse | null = this.overpassCache.get(url) ?? null;

    if (!data) {
      try {
        data = await firstValueFrom(
          this.http.get<OverpassResponse>(url).pipe(timeout(8000)),
        );
        if (data) this.overpassCache.set(url, data);
      } catch {
        return null;
      }
    }

    if (!data?.elements?.length) return null;

    const nodeData = new Map<string, { lat: number; lng: number }>();
    const graph    = new Map<string, GraphNode>();

    data.elements.forEach((el) => {
      if (el.type === 'node' && el.lat != null && el.lon != null) {
        nodeData.set(el.id.toString(), { lat: el.lat, lng: el.lon });
      }
    });

    data.elements.forEach((el) => {
      if (el.type !== 'way' || !el.nodes) return;
      for (let i = 0; i < el.nodes.length - 1; i++) {
        const uId = el.nodes[i].toString();
        const vId = el.nodes[i + 1].toString();
        const uC  = nodeData.get(uId);
        const vC  = nodeData.get(vId);
        if (!uC || !vC) continue;

        const w = this.haversineKm(uC.lat, uC.lng, vC.lat, vC.lng);
        if (!graph.has(uId)) graph.set(uId, { id: uId, lat: uC.lat, lng: uC.lng, dist: Infinity, prev: null, neighbors: [] });
        if (!graph.has(vId)) graph.set(vId, { id: vId, lat: vC.lat, lng: vC.lng, dist: Infinity, prev: null, neighbors: [] });
        graph.get(uId)!.neighbors.push({ nodeId: vId, weight: w });
        graph.get(vId)!.neighbors.push({ nodeId: uId, weight: w });
      }
    });

    const sId = this.findNearestNode(nodeData, start);
    const eId = this.findNearestNode(nodeData, end);
    if (!sId || !eId) return null;

    const pathIds = this.dijkstra(graph, sId, eId);
    if (!pathIds.length) return null;

    const points: L.LatLng[] = [start, ...pathIds.map((id) => L.latLng(nodeData.get(id)!.lat, nodeData.get(id)!.lng)), end];
    let dist = 0;
    for (let i = 0; i < points.length - 1; i++) {
      dist += this.haversineKm(points[i].lat, points[i].lng, points[i + 1].lat, points[i + 1].lng);
    }
    return { points, distance: dist };
  }

  private findNearestNode(nodeData: Map<string, { lat: number; lng: number }>, target: L.LatLng): string | null {
    let nearest: string | null = null;
    let minDist = Infinity;
    nodeData.forEach((c, id) => {
      const d = this.haversineKm(target.lat, target.lng, c.lat, c.lng);
      if (d < minDist) { minDist = d; nearest = id; }
    });
    return nearest;
  }

  /** Dijkstra with a min-heap approximation via sorted array */
  private dijkstra(graph: Map<string, GraphNode>, startId: string, endId: string): string[] {
    const start = graph.get(startId);
    if (!start) return [];

    start.dist = 0;
    const queue: { id: string; d: number }[] = [{ id: startId, d: 0 }];
    const visited = new Set<string>();

    while (queue.length > 0) {
      queue.sort((a, b) => a.d - b.d);
      const { id: uId } = queue.shift()!;
      if (uId === endId) break;
      if (visited.has(uId)) continue;
      visited.add(uId);

      const u = graph.get(uId)!;
      for (const edge of u.neighbors) {
        if (visited.has(edge.nodeId)) continue;
        const v   = graph.get(edge.nodeId)!;
        const alt = u.dist + edge.weight;
        if (alt < v.dist) { v.dist = alt; v.prev = uId; queue.push({ id: edge.nodeId, d: alt }); }
      }
    }

    const path: string[] = [];
    let current: string | null = endId;
    while (current) {
      path.unshift(current);
      current = graph.get(current)?.prev ?? null;
    }
    return path[0] === startId ? path : [];
  }

  private haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R    = 6371.0088;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a    = Math.sin(dLat / 2) ** 2 +
                 Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private createColoredIcon(color: string, text: string): L.DivIcon {
    return L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="background:${color};width:22px;height:22px;border-radius:50%;border:2px solid white;
                         box-shadow:0 0 5px rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;
                         color:white;font-size:10px;font-weight:bold;">${text}</div>`,
      iconSize:   [22, 22],
      iconAnchor: [11, 11],
    });
  }

  private buildParadas(): RouteStop[] {
    return this.markers.map((m, i) => {
      const { lat, lng } = m.getLatLng();
      const isFirst = i === 0;
      const isLast  = i === this.markers.length - 1;
      return { orden: i, nombre: isFirst ? 'Origen' : isLast ? 'Destino' : `Parada ${i}`, lat, lon: lng };
    });
  }

  onSubmit(): void {
    if (this.form.invalid || this.saving) return;
    if (!this.routeFinalized) {
      this.snackBar.open('Por favor, finaliza la ruta en el mapa antes de guardar.', 'Cerrar', { duration: 4000 });
      return;
    }
    this.saving = true;
    const payload = { ...this.form.value, paradas: this.buildParadas() };
    const request$ = this.isEdit && this.routeId
      ? this.routesService.update(this.routeId, payload)
      : this.routesService.create(payload);

    request$.pipe(takeUntil(this.destroy$)).subscribe({
      next:  () => { this.snackBar.open('Ruta guardada', 'OK', { duration: 3000 }); this.dialogRef.close(true); },
      error: () => { this.saving = false; },
    });
  }

  cancel(): void { this.dialogRef.close(false); }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.map) { this.map.remove(); this.map = null; }
  }
}
