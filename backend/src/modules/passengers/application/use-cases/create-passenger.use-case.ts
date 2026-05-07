import { Inject, Injectable } from '@nestjs/common';
import { Passenger } from '../../domain/entities/passenger.entity';
import { PASSENGER_REPOSITORY, PassengerRepositoryPort } from '../../domain/repositories/passenger.repository.port';
import { ROUTE_REPOSITORY, RouteRepositoryPort } from '../../../routes/domain/repositories/route.repository.port';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';
import { ConflictError } from '../../../../shared/domain/errors/conflict.error';
import { CreatePassengerDto } from '../dtos/create-passenger.dto';

@Injectable()
export class CreatePassengerUseCase {
  constructor(
    @Inject(PASSENGER_REPOSITORY)
    private readonly passengerRepository: PassengerRepositoryPort,
    @Inject(ROUTE_REPOSITORY)
    private readonly routeRepository: RouteRepositoryPort,
  ) {}

  async execute(tenantId: string, dto: CreatePassengerDto): Promise<Passenger> {
    if (dto.routeId) {
      const route = await this.routeRepository.findById(dto.routeId, tenantId);
      if (!route) throw new NotFoundError('Route', dto.routeId);
      if (!route.isActive()) throw new ConflictError('Cannot assign passenger to an inactive route');

      const currentCount = await this.routeRepository.countPassengers(dto.routeId, tenantId);
      if (currentCount >= route.capacidadMaxima) {
        throw new ConflictError(`Route has reached maximum capacity of ${route.capacidadMaxima}`);
      }
    }

    const passenger = Passenger.create({
      nombre: dto.nombre,
      documento: dto.documento,
      telefono: dto.telefono,
      deviceIdDatatrack: dto.deviceIdDatatrack,
      deviceNameDatatrack: dto.deviceNameDatatrack,
      routeId: dto.routeId ?? null,
      estado: dto.estado,
      tenantId,
    });

    return this.passengerRepository.save(passenger);
  }
}
