import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrmTenant } from './orm-tenant.entity';
import { Tenant } from '../../domain/entities/tenant.entity';
import { TenantRepositoryPort } from '../../domain/repositories/tenant.repository.port';

@Injectable()
export class TenantRepository implements TenantRepositoryPort {
  constructor(
    @InjectRepository(OrmTenant)
    private readonly repo: Repository<OrmTenant>,
  ) {}

  private toDomain(orm: OrmTenant): Tenant {
    return Tenant.create({
      id: orm.id,
      nombre: orm.nombre,
      nit: orm.nit,
      ciudad: orm.ciudad,
      logoUrl: orm.logoUrl,
      estado: orm.estado,
      planSuscripcion: orm.planSuscripcion,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  private toOrm(tenant: Tenant): Partial<OrmTenant> {
    return {
      id: tenant.id,
      nombre: tenant.nombre,
      nit: tenant.nit,
      ciudad: tenant.ciudad,
      logoUrl: tenant.logoUrl,
      estado: tenant.estado,
      planSuscripcion: tenant.planSuscripcion,
    };
  }

  async findById(id: string): Promise<Tenant | null> {
    const orm = await this.repo.findOneBy({ id });
    return orm ? this.toDomain(orm) : null;
  }

  async findByNit(nit: string): Promise<Tenant | null> {
    const orm = await this.repo.findOneBy({ nit });
    return orm ? this.toDomain(orm) : null;
  }

  async findAll(page: number, limit: number): Promise<{ items: Tenant[]; total: number }> {
    const [orms, total] = await this.repo.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items: orms.map((o) => this.toDomain(o)), total };
  }

  async save(tenant: Tenant): Promise<Tenant> {
    const orm = this.repo.create(this.toOrm(tenant));
    const saved = await this.repo.save(orm);
    return this.toDomain(saved);
  }

  async update(tenant: Tenant): Promise<Tenant> {
    await this.repo.update(tenant.id, {
      nombre: tenant.nombre,
      ciudad: tenant.ciudad,
      logoUrl: tenant.logoUrl,
      estado: tenant.estado,
      planSuscripcion: tenant.planSuscripcion,
    });
    const updated = await this.repo.findOneByOrFail({ id: tenant.id });
    return this.toDomain(updated);
  }
}
