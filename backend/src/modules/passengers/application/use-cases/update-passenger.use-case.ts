import { Inject, Injectable } from '@nestjs/common';
import { Passenger } from '../../domain/entities/passenger.entity';
import { PASSENGER_REPOSITORY, PassengerRepositoryPort } from '../../domain/repositories/passenger.repository.port';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';
import { UpdatePassengerDto } from '../dtos/update-passenger.dto';

@Injectable()
export class UpdatePassengerUseCase {
  constructor(
    @Inject(PASSENGER_REPOSITORY)
    private readonly passengerRepository: PassengerRepositoryPort,
  ) {}

  async execute(id: string, tenantId: string, dto: UpdatePassengerDto): Promise<Passenger> {
    const passenger = await this.passengerRepository.findById(id, tenantId);
    if (!passenger) throw new NotFoundError('Passenger', id);
    const updated = passenger.withUpdates(dto);
    return this.passengerRepository.update(updated);
  }
}
