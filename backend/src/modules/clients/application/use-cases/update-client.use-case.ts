import { Inject, Injectable } from '@nestjs/common';
import { Client } from '../../domain/entities/client.entity';
import { CLIENT_REPOSITORY, ClientRepositoryPort } from '../../domain/repositories/client.repository.port';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';
import { UpdateClientDto } from '../dtos/update-client.dto';

@Injectable()
export class UpdateClientUseCase {
  constructor(@Inject(CLIENT_REPOSITORY) private readonly repo: ClientRepositoryPort) {}

  async execute(id: string, tenantId: string, dto: UpdateClientDto): Promise<Client> {
    const client = await this.repo.findById(id, tenantId);
    if (!client) throw new NotFoundError('Client', id);
    const updated = client.withUpdates(dto);
    return this.repo.update(updated);
  }
}
