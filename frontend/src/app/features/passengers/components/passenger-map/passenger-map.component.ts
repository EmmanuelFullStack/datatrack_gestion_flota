import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ElementRef,
  ViewChild,
  NgZone,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { Subject, takeUntil, interval } from 'rxjs';
import * as L from 'leaflet';
import { PassengersService } from '../../../../core/services/passengers.service';
import { WebsocketService } from '../../../../core/services/websocket.service';
import { Passenger, GpsUpdateEvent } from '../../../../core/models/models';

interface PassengerMarker {
  passenger: Passenger;
  marker: L.Marker;
}

const STATUS_COLORS: Record<string, string> = {
  EN_TRANSITO: '#1a237e',
  EMBARCADO:   '#ffc107',
  LLEGO:       '#4caf50',
  PENDIENTE:   '#9e9e9e',
};

// Fix Leaflet default icon paths
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)['_getIconUrl'];
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/assets/leaflet/marker-icon-2x.png',
  iconUrl:       '/assets/leaflet/marker-icon.png',
  shadowUrl:     '/assets/leaflet/marker-shadow.png',
});

@Component({
  selector: 'app-passenger-map',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './passenger-map.component.html',
  styleUrls: ['./passenger-map.component.scss'],
})
export class PassengerMapComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef<HTMLElement>;

  private readonly destroy$         = new Subject<void>();
  private readonly passengersService = inject(PassengersService);
  private readonly wsService        = inject(WebsocketService);
  private readonly ngZone           = inject(NgZone);
  private readonly activatedRoute   = inject(ActivatedRoute);

  private map: L.Map | null = null;
  private markerMap = new Map<string, PassengerMarker>();

  allPassengers:    Passenger[] = [];
  passengersShown:  Passenger[] = [];
  loading      = true;
  lastUpdate:  Date | null = null;
  wsConnected  = false;
  sidebarOpen  = false;

  readonly estadoOptions = [
    { value: 'PENDIENTE',   label: 'Pendiente',   color: '#9e9e9e' },
    { value: 'EMBARCADO',   label: 'Embarcado',   color: '#ffc107' },
    { value: 'EN_TRANSITO', label: 'En Tránsito', color: '#1a237e' },
    { value: 'LLEGO',       label: 'Llegó',       color: '#4caf50' },
  ];

  activeFilters = new Set<string>(['PENDIENTE', 'EMBARCADO', 'EN_TRANSITO', 'LLEGO']);
  searchQuery   = '';

  private readonly DEFAULT_CENTER: L.LatLngTuple = [4.7110, -74.0721];
  private readonly DEFAULT_ZOOM = 6;

  ngOnInit(): void {
    this.loadPassengers();

    // Track real socket connection state
    this.wsService.connected
      .pipe(takeUntil(this.destroy$))
      .subscribe((connected) => {
        this.ngZone.run(() => { this.wsConnected = connected; });
      });

    this.wsService.gpsUpdates
      .pipe(takeUntil(this.destroy$))
      .subscribe((events: GpsUpdateEvent[]) => {
        this.ngZone.run(() => {
          this.lastUpdate = new Date();
          events.forEach((e) => this.processGpsUpdate(e));
          this.applyFilters();
        });
      });

    // Fallback HTTP polling when WebSocket is not connected
    interval(30_000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => { if (!this.wsConnected) this.loadPassengers(); });
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  private initMap(): void {
    if (this.map || !this.mapContainer?.nativeElement) return;

    this.map = L.map(this.mapContainer.nativeElement, {
      center: this.DEFAULT_CENTER,
      zoom:   this.DEFAULT_ZOOM,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(this.map);

    if (this.passengersShown.length > 0) this.syncMarkers();
  }

  toggleFilter(estado: string): void {
    if (this.activeFilters.has(estado)) {
      this.activeFilters.delete(estado);
    } else {
      this.activeFilters.add(estado);
    }
    this.applyFilters();
  }

  applyFilters(): void {
    const query = this.searchQuery.toLowerCase();
    this.passengersShown = this.allPassengers.filter((p) => {
      const matchesEstado  = this.activeFilters.has(p.estado);
      const matchesSearch  = p.nombre.toLowerCase().includes(query) || p.documento.includes(query);
      return matchesEstado && matchesSearch;
    });
    if (this.map) this.syncMarkers();
  }

  private loadPassengers(): void {
    this.passengersService
      .getAll({ limit: 500 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.allPassengers = res.items.filter((p) => p.deviceIdDatatrack);
          this.applyFilters();
          this.loading = false;
          this.checkInitialFocus();
        },
        error: () => { this.loading = false; },
      });
  }

  private checkInitialFocus(): void {
    const focusId = this.activatedRoute.snapshot.queryParams['focus'] as string | undefined;
    if (!focusId) return;

    const p = this.allPassengers.find((x) => x.id === focusId);
    if (p) {
      // Map may not be initialized yet — wait for next frame
      requestAnimationFrame(() => this.focusPassenger(p));
    }
  }

  private syncMarkers(): void {
    if (!this.map) return;

    const currentIds = new Set(this.passengersShown.map((p) => p.id));

    this.markerMap.forEach((_, id) => {
      if (!currentIds.has(id)) {
        this.markerMap.get(id)?.marker.remove();
        this.markerMap.delete(id);
      }
    });

    this.passengersShown.forEach((p) => {
      if (!p.lat || !p.lon) return;

      const existing = this.markerMap.get(p.id);
      if (!existing) {
        const marker = this.createMarker(p);
        this.markerMap.set(p.id, { passenger: p, marker });
      } else {
        const posChanged    = existing.passenger.lat !== p.lat || existing.passenger.lon !== p.lon;
        const statusChanged = existing.passenger.estado !== p.estado;
        if (posChanged || statusChanged) {
          existing.marker.setLatLng([p.lat, p.lon]);
          existing.marker.setPopupContent(this.buildPopupContent(p));
          existing.passenger = p;
        }
      }
    });
  }

  private processGpsUpdate(event: GpsUpdateEvent): void {
    const idx = this.allPassengers.findIndex((p) => p.id === event.passengerId);
    if (idx === -1) return;

    this.allPassengers[idx] = {
      ...this.allPassengers[idx],
      lat:            event.lat,
      lon:            event.lon,
      estado:         event.estado as Passenger['estado'],
      ultimoGpsUpdate: event.timestamp,
    };
  }

  focusPassenger(passenger: Passenger): void {
    if (!passenger.lat || !passenger.lon || !this.map) return;
    this.map.flyTo([passenger.lat, passenger.lon], 17, { duration: 1.2 });
    this.markerMap.get(passenger.id)?.marker.openPopup();
  }

  fitAllMarkers(): void {
    const bounds: L.LatLng[] = [];
    this.markerMap.forEach(({ passenger }) => {
      if (passenger.lat && passenger.lon) bounds.push(L.latLng(passenger.lat, passenger.lon));
    });
    if (bounds.length > 0 && this.map) {
      this.map.fitBounds(L.latLngBounds(bounds), { padding: [50, 50], maxZoom: 14 });
    }
  }

  refreshMap(): void {
    this.wsConnected = false;
    this.loadPassengers();
  }

  get markerCount(): number {
    return this.markerMap.size;
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  private createMarker(passenger: Passenger): L.Marker {
    const color = STATUS_COLORS[passenger.estado] ?? '#9e9e9e';
    const icon  = L.divIcon({
      html: `<div class="custom-marker" style="background:${color};">
               <span class="marker-initial">${passenger.nombre.charAt(0).toUpperCase()}</span>
             </div>`,
      className:   'passenger-marker-container',
      iconSize:    [36, 36],
      iconAnchor:  [18, 18],
      popupAnchor: [0, -20],
    });

    const marker = L.marker([passenger.lat!, passenger.lon!], { icon });
    marker.bindPopup(this.buildPopupContent(passenger), { maxWidth: 250 });
    marker.addTo(this.map!);
    return marker;
  }

  private buildPopupContent(p: Passenger): string {
    const lat     = p.lat?.toFixed(6)  ?? 'N/A';
    const lon     = p.lon?.toFixed(6)  ?? 'N/A';
    const updated = p.ultimoGpsUpdate ? new Date(p.ultimoGpsUpdate).toLocaleString('es-CO') : 'N/A';
    const color   = STATUS_COLORS[p.estado] ?? '#9e9e9e';

    return `<div class="popup-content">
      <h4 style="margin:0 0 8px;color:#1a237e">${p.nombre}</h4>
      <p style="margin:2px 0;font-size:13px"><b>Documento:</b> ${p.documento}</p>
      <p style="margin:2px 0;font-size:13px"><b>Teléfono:</b> ${p.telefono ?? '—'}</p>
      <p style="margin:4px 0;font-size:13px">
        <b>Estado:</b> <span style="color:${color};font-weight:600">${p.estado}</span>
      </p>
      <p style="margin:2px 0;font-size:11px;color:#757575"><b>Lat:</b> ${lat} | <b>Lon:</b> ${lon}</p>
      <p style="margin:2px 0;font-size:11px;color:#757575"><b>Actualizado:</b> ${updated}</p>
    </div>`;
  }
}
