import { Inject, Injectable } from '@nestjs/common';
import { Passenger, PassengerEstado } from '../../domain/entities/passenger.entity';
import { PASSENGER_REPOSITORY, PassengerRepositoryPort } from '../../domain/repositories/passenger.repository.port';
import { ROUTE_REPOSITORY, RouteRepositoryPort } from '../../../routes/domain/repositories/route.repository.port';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';
import { ConflictError } from '../../../../shared/domain/errors/conflict.error';

@Injectable()
export class AssignToRouteUseCase {
  constructor(
    @Inject(PASSENGER_REPOSITORY)
    private readonly passengerRepository: PassengerRepositoryPort,
    @Inject(ROUTE_REPOSITORY)
    private readonly routeRepository: RouteRepositoryPort,
  ) {}

  async assign(passengerId: string, routeId: string, tenantId: string): Promise<Passenger> {
    const [passenger, route] = await Promise.all([
      this.passengerRepository.findById(passengerId, tenantId),
      this.routeRepository.findById(routeId, tenantId),
    ]);

    if (!passenger) throw new NotFoundError('Passenger', passengerId);
    if (!route) throw new NotFoundError('Route', routeId);
    if (!route.isActive()) throw new ConflictError('Cannot assign passenger to an inactive route');

    const currentCount = await this.routeRepository.countPassengers(routeId, tenantId);
    if (currentCount >= route.capacidadMaxima) {
      throw new ConflictError(`Route '${route.nombre}' has reached maximum capacity of ${route.capacidadMaxima}`);
    }

    const updated = passenger.withRoute(routeId).withUpdates({ estado: PassengerEstado.EMBARCADO });
    return this.passengerRepository.update(updated);
  }

  async unassign(passengerId: string, tenantId: string): Promise<Passenger> {
    const passenger = await this.passengerRepository.findById(passengerId, tenantId);
    if (!passenger) throw new NotFoundError('Passenger', passengerId);

    const updated = passenger.withRoute(null).withUpdates({ estado: PassengerEstado.LLEGO });
    return this.passengerRepository.update(updated);
  }
}
