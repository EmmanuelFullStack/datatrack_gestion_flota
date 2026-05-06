import { Inject, Injectable } from '@nestjs/common';
import { Tenant } from '../../domain/entities/tenant.entity';
import { TENANT_REPOSITORY, TenantRepositoryPort } from '../../domain/repositories/tenant.repository.port';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';
import { UpdateTenantDto } from '../dtos/update-tenant.dto';

@Injectable()
export class UpdateTenantUseCase {
  constructor(
    @Inject(TENANT_REPOSITORY)
    private readonly tenantRepository: TenantRepositoryPort,
  ) {}

  async execute(id: string, dto: UpdateTenantDto): Promise<Tenant> {
    const tenant = await this.tenantRepository.findById(id);
    if (!tenant) throw new NotFoundError('Tenant', id);

    const updated = tenant.withUpdates(dto);
    return this.tenantRepository.update(updated);
  }

  async toggleStatus(id: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findById(id);
    if (!tenant) throw new NotFoundError('Tenant', id);

    const updated = tenant.toggleStatus();
    return this.tenantRepository.update(updated);
  }
}
