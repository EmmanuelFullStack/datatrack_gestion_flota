import { Inject, Injectable } from '@nestjs/common';
import { Client } from '../../domain/entities/client.entity';
import { CLIENT_REPOSITORY, ClientRepositoryPort } from '../../domain/repositories/client.repository.port';
import { CreateClientDto } from '../dtos/create-client.dto';

@Injectable()
export class CreateClientUseCase {
  constructor(@Inject(CLIENT_REPOSITORY) private readonly repo: ClientRepositoryPort) {}

  async execute(tenantId: string, dto: CreateClientDto): Promise<Client> {
    const client = Client.create({ ...dto, tenantId });
    return this.repo.save(client);
  }
}
