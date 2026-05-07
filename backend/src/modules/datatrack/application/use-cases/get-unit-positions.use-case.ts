import { Inject, Injectable } from '@nestjs/common';
import { DatatrackHttpAdapter } from '../../infrastructure/adapters/datatrack-http.adapter';
import { DatatrackUnit } from '../../domain/value-objects/datatrack-unit.vo';
import { PASSENGER_REPOSITORY, PassengerRepositoryPort } from '../../../passengers/domain/repositories/passenger.repository.port';

@Injectable()
export class GetUnitPositionsUseCase {
  constructor(
    private readonly datatrackAdapter: DatatrackHttpAdapter,
    @Inject(PASSENGER_REPOSITORY)
    private readonly passengerRepository: PassengerRepositoryPort,
  ) {}

  async execute(): Promise<DatatrackUnit[]> {
    const sid = await this.datatrackAdapter.getSid();
    return this.datatrackAdapter.getAllUnits(sid);
  }

  /**
   * Returns units not already assigned to another passenger.
   * @param tenantId    Current tenant
   * @param excludePassengerId  Passenger being edited (its device stays available)
   */
  async executeAvailable(tenantId: string, excludePassengerId?: string): Promise<DatatrackUnit[]> {
    const sid   = await this.datatrackAdapter.getSid();
    const units = await this.datatrackAdapter.getAllUnits(sid);

    // Collect device IDs already assigned in this tenant
    const { items: passengers } = await this.passengerRepository.findAll(tenantId, 1, 500);
    const assignedIds = new Set(
      passengers
        .filter((p) => p.deviceIdDatatrack && p.id !== excludePassengerId)
        .map((p) => p.deviceIdDatatrack as string),
    );

    return units.filter((u) => !assignedIds.has(String(u.id)));
  }
}
