import { Route, RouteEstado } from '../entities/route.entity';

export const ROUTE_REPOSITORY = Symbol('RouteRepository');

export interface FindRoutesFilter {
  estado?: RouteEstado;
  search?: string;
}

export interface RouteRepositoryPort {
  findById(id: string, tenantId: string): Promise<Route | null>;
  findAll(tenantId: string, page: number, limit: number, filter?: FindRoutesFilter): Promise<{ items: Route[]; total: number }>;
  findActiveRoutes(tenantId: string): Promise<Route[]>;
  save(route: Route): Promise<Route>;
  update(route: Route): Promise<Route>;
  delete(id: string, tenantId: string): Promise<void>;
  countPassengers(routeId: string, tenantId: string): Promise<number>;
}
