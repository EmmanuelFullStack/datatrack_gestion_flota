import { Inject, Injectable } from '@nestjs/common';
import { Client } from '../../domain/entities/client.entity';
import { CLIENT_REPOSITORY, ClientRepositoryPort } from '../../domain/repositories/client.repository.port';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';

@Injectable()
export class FindClientsUseCase {
  constructor(@Inject(CLIENT_REPOSITORY) private readonly repo: ClientRepositoryPort) {}

  async findById(id: string, tenantId: string): Promise<Client> {
    const c = await this.repo.findById(id, tenantId);
    if (!c) throw new NotFoundError('Client', id);
    return c;
  }

  async findAll(tenantId: string, page = 1, limit = 20, search?: string) {
    const { items, total } = await this.repo.findAll(tenantId, page, limit, search);
    return { items, total, page, limit };
  }

  async count(tenantId: string): Promise<number> {
    return this.repo.count(tenantId);
  }
}
