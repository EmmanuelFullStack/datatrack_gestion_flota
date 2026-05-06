import { Inject, Injectable } from '@nestjs/common';
import { Tenant } from '../../domain/entities/tenant.entity';
import { TENANT_REPOSITORY, TenantRepositoryPort } from '../../domain/repositories/tenant.repository.port';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';

@Injectable()
export class FindTenantUseCase {
  constructor(
    @Inject(TENANT_REPOSITORY)
    private readonly tenantRepository: TenantRepositoryPort,
  ) {}

  async findById(id: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findById(id);
    if (!tenant) throw new NotFoundError('Tenant', id);
    return tenant;
  }

  async findAll(page = 1, limit = 20): Promise<{ items: Tenant[]; total: number; page: number; limit: number }> {
    const { items, total } = await this.tenantRepository.findAll(page, limit);
    return { items, total, page, limit };
  }
}
