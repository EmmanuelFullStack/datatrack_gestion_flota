import { Inject, Injectable, Logger } from '@nestjs/common';
import { DatatrackHttpAdapter } from '../../infrastructure/adapters/datatrack-http.adapter';
import { PASSENGER_REPOSITORY, PassengerRepositoryPort } from '../../../passengers/domain/repositories/passenger.repository.port';
import { TENANT_REPOSITORY, TenantRepositoryPort } from '../../../tenants/domain/repositories/tenant.repository.port';
import { ROUTE_REPOSITORY, RouteRepositoryPort } from '../../../routes/domain/repositories/route.repository.port';
import { TenantEstado } from '../../../tenants/domain/entities/tenant.entity';
import { Passenger, PassengerEstado } from '../../../passengers/domain/entities/passenger.entity';
import { Route } from '../../../routes/domain/entities/route.entity';
import { GpsUpdateEvent } from '../../infrastructure/gateways/gps.gateway';
import { haversineMeters } from '../../../../shared/domain/geo.utils';
import { DatatrackUnit } from '../../domain/value-objects/datatrack-unit.vo';

/** Proximity radius in meters to consider a passenger at origin/destination */
const PROXIMITY_M = 50;
/** Minimum speed (km/h) to transition EMBARCADO → EN_TRANSITO */
const MIN_SPEED_KMH = 2;
/** Speed (km/h) that triggers LLEGO → PENDIENTE (passenger departed again) */
const DEPARTURE_SPEED_KMH = 5;

export interface GpsSyncResult {
  tenantId: string;
  updated: number;
  failed: number;
  events: GpsUpdateEvent[];
}

function isValidCoordinate(lat: number, lon: number): boolean {
  return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

@Injectable()
export class SyncPassengerGpsUseCase {
  private readonly logger = new Logger(SyncPassengerGpsUseCase.name);

  constructor(
    private readonly datatrackAdapter: DatatrackHttpAdapter,
    @Inject(PASSENGER_REPOSITORY)
    private readonly passengerRepository: PassengerRepositoryPort,
    @Inject(TENANT_REPOSITORY)
    private readonly tenantRepository: TenantRepositoryPort,
    @Inject(ROUTE_REPOSITORY)
    private readonly routeRepository: RouteRepositoryPort,
  ) {}

  async executeForAllTenants(): Promise<GpsSyncResult[]> {
    const { items: tenants } = await this.tenantRepository.findAll(1, 1000);
    const activeTenants = tenants.filter((t) => t.estado === TenantEstado.ACTIVO);

    let units: DatatrackUnit[] = [];
    try {
      const sid = await this.datatrackAdapter.getSid();
      units = await this.datatrackAdapter.getAllUnits(sid);
      await this.datatrackAdapter.keepAlive(sid);
    } catch (err) {
      this.logger.error('Failed to fetch Datatrack units', (err as Error).message);
      return [];
    }

    const unitMap = new Map(
      units.filter((u) => u.hasValidPosition()).map((u) => [String(u.id), u]),
    );

    // Use allSettled so one failing tenant never blocks the rest
    const results = await Promise.allSettled(
      activeTenants.map((t) => this.syncForTenant(t.id, unitMap)),
    );

    return results.map((r, i) => {
      if (r.status === 'fulfilled') return r.value;
      this.logger.error(`GPS sync failed for tenant ${activeTenants[i].id}`, (r.reason as Error).message);
      return { tenantId: activeTenants[i].id, updated: 0, failed: 0, events: [] };
    });
  }

  async executeForTenant(tenantId: string): Promise<GpsSyncResult> {
    let units: DatatrackUnit[] = [];
    try {
      const sid = await this.datatrackAdapter.getSid();
      units = await this.datatrackAdapter.getAllUnits(sid);
    } catch (err) {
      this.logger.error(`GPS sync failed for tenant ${tenantId}`, (err as Error).message);
      return { tenantId, updated: 0, failed: 0, events: [] };
    }

    const unitMap = new Map(
      units.filter((u) => u.hasValidPosition()).map((u) => [String(u.id), u]),
    );

    return this.syncForTenant(tenantId, unitMap);
  }

  private async syncForTenant(tenantId: string, unitMap: Map<string, DatatrackUnit>): Promise<GpsSyncResult> {
    const passengers = await this.passengerRepository.findAllWithDeviceIds(tenantId);
    const routeCache = await this.buildRouteCache(passengers, tenantId);

    let updated = 0;
    let failed = 0;
    const events: GpsUpdateEvent[] = [];

    for (const passenger of passengers) {
      if (!passenger.deviceIdDatatrack) continue;

      const unit = unitMap.get(passenger.deviceIdDatatrack);
      if (!unit?.position) continue;

      try {
        const lat    = Number(unit.position.lat);
        const lon    = Number(unit.position.lon);
        const speed  = Number(unit.position.speed);
        const heading = Number(unit.position.heading);

        if (!isValidCoordinate(lat, lon) || !isFinite(speed) || speed < 0) {
          this.logger.warn(`Invalid GPS data for passenger ${passenger.id}: lat=${lat} lon=${lon} speed=${speed}`);
          continue;
        }

        const route = passenger.routeId ? routeCache.get(passenger.routeId) : null;
        const newEstado = this.resolveEstado(passenger, lat, lon, speed, route ?? null);

        let updated_ = passenger.withGpsUpdate(lat, lon);
        if (newEstado) updated_ = updated_.withUpdates({ estado: newEstado });
        // Auto-populate device name from Datatrack unit if not already saved
        if (!passenger.deviceNameDatatrack && unit.name) {
          updated_ = updated_.withUpdates({ deviceNameDatatrack: unit.name });
        }

        await this.passengerRepository.update(updated_);
        updated++;

        events.push({
          passengerId: passenger.id,
          deviceName: unit.name,
          lat,
          lon,
          speed,
          heading,
          estado: newEstado ?? passenger.estado,
          timestamp: unit.position.timestamp.toISOString(),
          tenantId,
        });
      } catch (err) {
        failed++;
        this.logger.warn(`Failed GPS update for passenger ${passenger.id}: ${(err as Error).message}`);
      }
    }

    if (updated > 0 || failed > 0) {
      this.logger.log(`Tenant ${tenantId}: GPS sync — ${updated} updated, ${failed} failed`);
    }

    return { tenantId, updated, failed, events };
  }

  /**
   * Determines the new estado based on GPS position and route stops.
   * Returns null if no transition should occur.
   */
  private resolveEstado(
    passenger: Passenger,
    lat: number,
    lon: number,
    speed: number,
    route: Route | null,
  ): PassengerEstado | null {
    const current = passenger.estado;

    if (!route?.paradas || route.paradas.length < 2) {
      if (current === PassengerEstado.EMBARCADO && speed > MIN_SPEED_KMH) {
        return PassengerEstado.EN_TRANSITO;
      }
      return null;
    }

    const sorted = [...route.paradas].sort((a, b) => a.orden - b.orden);
    const origin      = sorted[0];
    const destination = sorted[sorted.length - 1];

    const distOrigin = haversineMeters(lat, lon, origin.lat, origin.lon);
    const distDest   = haversineMeters(lat, lon, destination.lat, destination.lon);

    switch (current) {
      case PassengerEstado.PENDIENTE:
        if (distOrigin <= PROXIMITY_M) return PassengerEstado.EMBARCADO;
        break;

      case PassengerEstado.EMBARCADO:
        if (distDest <= PROXIMITY_M)    return PassengerEstado.LLEGO;
        if (speed > MIN_SPEED_KMH)      return PassengerEstado.EN_TRANSITO;
        break;

      case PassengerEstado.EN_TRANSITO:
        if (distDest <= PROXIMITY_M)    return PassengerEstado.LLEGO;
        break;

      case PassengerEstado.LLEGO:
        if (speed > DEPARTURE_SPEED_KMH) return PassengerEstado.PENDIENTE;
        break;
    }

    return null;
  }

  /** Prefetches unique routes for the given passengers (avoids N+1). */
  private async buildRouteCache(passengers: Passenger[], tenantId: string): Promise<Map<string, Route>> {
    const routeIds = [...new Set(passengers.map((p) => p.routeId).filter(Boolean))] as string[];
    const cache    = new Map<string, Route>();

    const results = await Promise.allSettled(
      routeIds.map((id) => this.routeRepository.findById(id, tenantId)),
    );

    results.forEach((result, i) => {
      if (result.status === 'fulfilled' && result.value) {
        cache.set(routeIds[i], result.value);
      } else if (result.status === 'rejected') {
        this.logger.warn(`Could not load route ${routeIds[i]}: ${(result.reason as Error).message}`);
      }
    });

    return cache;
  }

  /** Resets passengers stuck in LLEGO for more than `minutes` to PENDIENTE. */
  async resetLlegoToPendiente(minutes: number): Promise<number> {
    const stale = await this.passengerRepository.findLlegoOlderThan(minutes);

    const results = await Promise.allSettled(
      stale.map((p) => this.passengerRepository.update(p.withUpdates({ estado: PassengerEstado.PENDIENTE }))),
    );

    const failed = results.filter((r) => r.status === 'rejected').length;
    const reset  = stale.length - failed;

    if (reset > 0) {
      this.logger.log(`Reset ${reset} passengers from LLEGO → PENDIENTE (>${minutes}min)`);
    }
    if (failed > 0) {
      this.logger.warn(`Failed to reset ${failed} LLEGO passengers`);
    }

    return reset;
  }
}
