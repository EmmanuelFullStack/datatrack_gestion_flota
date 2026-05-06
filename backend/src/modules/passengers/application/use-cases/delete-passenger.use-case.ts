import { Inject, Injectable } from '@nestjs/common';
import { PASSENGER_REPOSITORY, PassengerRepositoryPort } from '../../domain/repositories/passenger.repository.port';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';

@Injectable()
export class DeletePassengerUseCase {
  constructor(
    @Inject(PASSENGER_REPOSITORY)
    private readonly passengerRepository: PassengerRepositoryPort,
  ) {}

  async execute(id: string, tenantId: string): Promise<void> {
    const p = await this.passengerRepository.findById(id, tenantId);
    if (!p) throw new NotFoundError('Passenger', id);
    await this.passengerRepository.delete(id, tenantId);
  }
}
