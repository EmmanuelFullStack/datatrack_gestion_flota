import { Inject, Injectable } from '@nestjs/common';
import { DatatrackHttpAdapter } from '../../infrastructure/adapters/datatrack-http.adapter';
import { PASSENGER_REPOSITORY, PassengerRepositoryPort } from '../../../passengers/domain/repositories/passenger.repository.port';
import { ROUTE_REPOSITORY, RouteRepositoryPort } from '../../../routes/domain/repositories/route.repository.port';
import { haversineMeters } from '../../../../shared/domain/geo.utils';
import { PassengerEstado } from '../../../passengers/domain/entities/passenger.entity';

export interface AlarmPosition {
  passengerId?: string;
  nombre?: string;
  deviceId: string;
  lat: number;
  lon: number;
  speed: number;
  timestamp: string;
  reason: string;
}

const DEVIATION_THRESHOLD_M = 1500; // 1.5km deviation limit

@Injectable()
export class GetAlarmsUseCase {
  constructor(
    private readonly datatrackAdapter: DatatrackHttpAdapter,
    @Inject(PASSENGER_REPOSITORY)
    private readonly passengerRepository: PassengerRepositoryPort,
    @Inject(ROUTE_REPOSITORY)
    private readonly routeRepository: RouteRepositoryPort,
  ) {}

  async execute(tenantId: string): Promise<AlarmPosition[]> {
    const sid = await this.datatrackAdapter.getSid();
    const units = await this.datatrackAdapter.getAllUnits(sid);
    const unitMap = new Map(units.map(u => [String(u.id), u]));

    const alarms: AlarmPosition[] = [];

    // 1. Alarms: Active devices without assigned route
    const passengersNoRoute = await this.passengerRepository.findWithDeviceButNoRoute(tenantId);
    for (const p of passengersNoRoute) {
      const unit = unitMap.get(p.deviceIdDatatrack!);
      if (unit?.position) {
        alarms.push(this.mapToAlarm(p, unit, 'Sin ruta asignada'));
      }
    }

    // 2. Alarms: Active passengers WITH route but far from stops (Deviation)
    // We check all passengers that have a route assigned and are sending GPS
    const passengersWithRoute = await this.passengerRepository.findAllWithDeviceIds(tenantId);
    const withRoute = passengersWithRoute.filter(p => !!p.routeId);
    
    // Cache routes to avoid multiple DB hits
    const routeIds = [...new Set(withRoute.map(p => p.routeId).filter(Boolean))] as string[];
    const routeMap = new Map();
    for (const rid of routeIds) {
      const r = await this.routeRepository.findById(rid, tenantId);
      if (r) routeMap.set(rid, r);
    }

    for (const p of withRoute) {
      const unit = unitMap.get(p.deviceIdDatatrack!);
      if (!unit || !unit.position) continue;

      const position = unit.position;
      const route = routeMap.get(p.routeId);
      if (!route?.paradas || route.paradas.length === 0) continue;

      // Calculate distance to nearest stop
      const minDist = Math.min(...route.paradas.map((s: any) => 
        haversineMeters(position.lat, position.lon, s.lat, s.lon)
      ));

      if (minDist > DEVIATION_THRESHOLD_M) {
        alarms.push(this.mapToAlarm(p, unit, `Fuera de ruta (${(minDist/1000).toFixed(1)}km desviación)`));
      }
    }

    return alarms;
  }

  private mapToAlarm(p: any, unit: any, reason: string): AlarmPosition {
    return {
      passengerId: p.id,
      nombre: p.nombre,
      deviceId: p.deviceIdDatatrack || 'N/A',
      lat: unit.position.lat,
      lon: unit.position.lon,
      speed: unit.position.speed,
      timestamp: unit.position.timestamp.toISOString(),
      reason,
    };
  }
}
