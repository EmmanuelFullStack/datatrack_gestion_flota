import { Inject, Injectable } from '@nestjs/common';
import { DatatrackHttpAdapter } from '../../infrastructure/adapters/datatrack-http.adapter';
import { PASSENGER_REPOSITORY, PassengerRepositoryPort } from '../../../passengers/domain/repositories/passenger.repository.port';
import { ROUTE_REPOSITORY, RouteRepositoryPort } from '../../../routes/domain/repositories/route.repository.port';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';

@Injectable()
export class CreateLocatorUseCase {
  constructor(
    private readonly datatrackAdapter: DatatrackHttpAdapter,
    @Inject(PASSENGER_REPOSITORY)
    private readonly passengerRepository: PassengerRepositoryPort,
    @Inject(ROUTE_REPOSITORY)
    private readonly routeRepository: RouteRepositoryPort,
  ) {}

  async executeForRoute(routeId: string, tenantId: string): Promise<{ locatorUrl: string }> {
    const route = await this.routeRepository.findById(routeId, tenantId);
    if (!route) throw new NotFoundError('Route', routeId);

    const passengers = await this.passengerRepository.findByRoute(routeId, tenantId);
    const deviceIds = passengers
      .filter((p) => p.deviceIdDatatrack)
      .map((p) => parseInt(p.deviceIdDatatrack!, 10))
      .filter((id) => !isNaN(id));

    if (deviceIds.length === 0) {
      return { locatorUrl: '' };
    }

    const sid = await this.datatrackAdapter.getSid();
    const locatorUrl = await this.datatrackAdapter.createLocator(sid, deviceIds, route.nombre);
    return { locatorUrl };
  }
}
