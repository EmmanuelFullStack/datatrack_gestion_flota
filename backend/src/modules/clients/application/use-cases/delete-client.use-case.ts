import { Inject, Injectable } from '@nestjs/common';
import { CLIENT_REPOSITORY, ClientRepositoryPort } from '../../domain/repositories/client.repository.port';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';

@Injectable()
export class DeleteClientUseCase {
  constructor(@Inject(CLIENT_REPOSITORY) private readonly repo: ClientRepositoryPort) {}

  async execute(id: string, tenantId: string): Promise<void> {
    const c = await this.repo.findById(id, tenantId);
    if (!c) throw new NotFoundError('Client', id);
    await this.repo.delete(id, tenantId);
  }
}
