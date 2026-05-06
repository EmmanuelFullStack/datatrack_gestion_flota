import { Inject, Injectable } from '@nestjs/common';
import { Passenger, PassengerEstado } from '../../domain/entities/passenger.entity';
import { PASSENGER_REPOSITORY, PassengerRepositoryPort } from '../../domain/repositories/passenger.repository.port';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';

@Injectable()
export class FindPassengersUseCase {
  constructor(
    @Inject(PASSENGER_REPOSITORY)
    private readonly passengerRepository: PassengerRepositoryPort,
  ) {}

  async findById(id: string, tenantId: string): Promise<Passenger> {
    const p = await this.passengerRepository.findById(id, tenantId);
    if (!p) throw new NotFoundError('Passenger', id);
    return p;
  }

  async findAll(
    tenantId: string,
    page = 1,
    limit = 20,
    filter?: { estado?: PassengerEstado; routeId?: string; search?: string },
  ): Promise<{ items: Passenger[]; total: number; page: number; limit: number }> {
    const { items, total } = await this.passengerRepository.findAll(tenantId, page, limit, filter);
    return { items, total, page, limit };
  }

  async findInTransit(tenantId: string): Promise<Passenger[]> {
    return this.passengerRepository.findInTransit(tenantId);
  }

  async findByRoute(routeId: string, tenantId: string): Promise<Passenger[]> {
    return this.passengerRepository.findByRoute(routeId, tenantId);
  }

  async getDashboardStats(tenantId: string): Promise<{ inTransit: number; boarded: number; arrived: number; pending: number }> {
    const [inTransit, boarded, arrived, pending] = await Promise.all([
      this.passengerRepository.countByEstado(tenantId, PassengerEstado.EN_TRANSITO),
      this.passengerRepository.countByEstado(tenantId, PassengerEstado.EMBARCADO),
      this.passengerRepository.countByEstado(tenantId, PassengerEstado.LLEGO),
      this.passengerRepository.countByEstado(tenantId, PassengerEstado.PENDIENTE),
    ]);
    return { inTransit, boarded, arrived, pending };
  }
}
