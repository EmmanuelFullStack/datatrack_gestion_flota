import { Inject, Injectable } from '@nestjs/common';
import { ROUTE_REPOSITORY, RouteRepositoryPort } from '../../domain/repositories/route.repository.port';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';
import { ConflictError } from '../../../../shared/domain/errors/conflict.error';

@Injectable()
export class DeleteRouteUseCase {
  constructor(
    @Inject(ROUTE_REPOSITORY)
    private readonly routeRepository: RouteRepositoryPort,
  ) {}

  async execute(id: string, tenantId: string): Promise<void> {
    const route = await this.routeRepository.findById(id, tenantId);
    if (!route) throw new NotFoundError('Route', id);

    const passengerCount = await this.routeRepository.countPassengers(id, tenantId);
    if (passengerCount > 0) {
      throw new ConflictError(`Cannot delete route with ${passengerCount} assigned passengers. Reassign them first.`);
    }

    await this.routeRepository.delete(id, tenantId);
  }
}
