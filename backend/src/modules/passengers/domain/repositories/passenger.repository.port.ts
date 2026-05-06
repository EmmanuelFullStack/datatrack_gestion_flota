import { Passenger, PassengerEstado } from '../entities/passenger.entity';

export const PASSENGER_REPOSITORY = Symbol('PassengerRepository');

export interface FindPassengersFilter {
  estado?: PassengerEstado;
  routeId?: string;
  search?: string;
}

export interface PassengerRepositoryPort {
  findById(id: string, tenantId: string): Promise<Passenger | null>;
  findAll(tenantId: string, page: number, limit: number, filter?: FindPassengersFilter): Promise<{ items: Passenger[]; total: number }>;
  findByDeviceId(deviceId: string, tenantId: string): Promise<Passenger | null>;
  findInTransit(tenantId: string): Promise<Passenger[]>;
  findByRoute(routeId: string, tenantId: string): Promise<Passenger[]>;
  findAllWithDeviceIds(tenantId: string): Promise<Passenger[]>;
  save(passenger: Passenger): Promise<Passenger>;
  update(passenger: Passenger): Promise<Passenger>;
  delete(id: string, tenantId: string): Promise<void>;
  countByRoute(routeId: string, tenantId: string): Promise<number>;
  countByEstado(tenantId: string, estado: PassengerEstado): Promise<number>;
  findLlegoOlderThan(minutes: number): Promise<Passenger[]>;
  findWithDeviceButNoRoute(tenantId: string): Promise<Passenger[]>;
}
