import { Inject, Injectable } from '@nestjs/common';
import { Route, RouteEstado } from '../../domain/entities/route.entity';
import { ROUTE_REPOSITORY, RouteRepositoryPort } from '../../domain/repositories/route.repository.port';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';

@Injectable()
export class FindRoutesUseCase {
  constructor(
    @Inject(ROUTE_REPOSITORY)
    private readonly routeRepository: RouteRepositoryPort,
  ) {}

  async findById(id: string, tenantId: string): Promise<Route> {
    const route = await this.routeRepository.findById(id, tenantId);
    if (!route) throw new NotFoundError('Route', id);
    return route;
  }

  async findAll(
    tenantId: string,
    page = 1,
    limit = 20,
    filter?: { estado?: RouteEstado; search?: string },
  ): Promise<{ items: Route[]; total: number; page: number; limit: number }> {
    const { items, total } = await this.routeRepository.findAll(tenantId, page, limit, filter);
    return { items, total, page, limit };
  }

  async findActiveRoutes(tenantId: string): Promise<Route[]> {
    return this.routeRepository.findActiveRoutes(tenantId);
  }

  async countPassengers(routeId: string, tenantId: string): Promise<number> {
    return this.routeRepository.countPassengers(routeId, tenantId);
  }
}
