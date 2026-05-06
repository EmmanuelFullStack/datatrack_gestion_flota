import { Inject, Injectable } from '@nestjs/common';
import { Tenant } from '../../domain/entities/tenant.entity';
import { TENANT_REPOSITORY, TenantRepositoryPort } from '../../domain/repositories/tenant.repository.port';
import { ConflictError } from '../../../../shared/domain/errors/conflict.error';
import { CreateTenantDto } from '../dtos/create-tenant.dto';

@Injectable()
export class CreateTenantUseCase {
  constructor(
    @Inject(TENANT_REPOSITORY)
    private readonly tenantRepository: TenantRepositoryPort,
  ) {}

  async execute(dto: CreateTenantDto): Promise<Tenant> {
    const existing = await this.tenantRepository.findByNit(dto.nit);
    if (existing) {
      throw new ConflictError(`A tenant with NIT '${dto.nit}' already exists`);
    }

    const tenant = Tenant.create({
      nombre: dto.nombre,
      nit: dto.nit,
      ciudad: dto.ciudad,
      logoUrl: dto.logoUrl,
      planSuscripcion: dto.planSuscripcion,
    });

    return this.tenantRepository.save(tenant);
  }
}
