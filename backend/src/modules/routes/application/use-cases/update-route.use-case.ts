import { Inject, Injectable } from '@nestjs/common';
import { Route } from '../../domain/entities/route.entity';
import { ROUTE_REPOSITORY, RouteRepositoryPort } from '../../domain/repositories/route.repository.port';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';
import { UpdateRouteDto } from '../dtos/update-route.dto';

@Injectable()
export class UpdateRouteUseCase {
  constructor(
    @Inject(ROUTE_REPOSITORY)
    private readonly routeRepository: RouteRepositoryPort,
  ) {}

  async execute(id: string, tenantId: string, dto: UpdateRouteDto): Promise<Route> {
    const route = await this.routeRepository.findById(id, tenantId);
    if (!route) throw new NotFoundError('Route', id);
    const updated = route.withUpdates(dto);
    return this.routeRepository.update(updated);
  }
}
