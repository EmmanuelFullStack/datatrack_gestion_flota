import { Tenant } from '../entities/tenant.entity';

export const TENANT_REPOSITORY = Symbol('TenantRepository');

export interface TenantRepositoryPort {
  findById(id: string): Promise<Tenant | null>;
  findByNit(nit: string): Promise<Tenant | null>;
  findAll(page: number, limit: number): Promise<{ items: Tenant[]; total: number }>;
  save(tenant: Tenant): Promise<Tenant>;
  update(tenant: Tenant): Promise<Tenant>;
}
