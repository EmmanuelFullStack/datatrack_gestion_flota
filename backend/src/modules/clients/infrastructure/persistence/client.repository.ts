import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { OrmClient } from './orm-client.entity';
import { Client } from '../../domain/entities/client.entity';
import { ClientRepositoryPort } from '../../domain/repositories/client.repository.port';

@Injectable()
export class ClientRepository implements ClientRepositoryPort {
  constructor(@InjectRepository(OrmClient) private readonly repo: Repository<OrmClient>) {}

  private toDomain(orm: OrmClient): Client {
    return Client.create({
      id: orm.id,
      nombre: orm.nombre,
      documento: orm.documento,
      telefono: orm.telefono,
      email: orm.email,
      activo: orm.activo,
      tenantId: orm.tenantId,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  async findById(id: string, tenantId: string): Promise<Client | null> {
    const orm = await this.repo.findOne({ where: { id, tenantId } });
    return orm ? this.toDomain(orm) : null;
  }

  async findAll(tenantId: string, page: number, limit: number, search?: string): Promise<{ items: Client[]; total: number }> {
    const where: any = { tenantId };
    if (search) where.nombre = Like(`%${search}%`);

    const [orms, total] = await this.repo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items: orms.map((o) => this.toDomain(o)), total };
  }

  async save(client: Client): Promise<Client> {
    const orm = this.repo.create({
      id: client.id, nombre: client.nombre, documento: client.documento,
      telefono: client.telefono, email: client.email, activo: client.activo, tenantId: client.tenantId,
    });
    const saved = await this.repo.save(orm);
    return this.toDomain(saved);
  }

  async update(client: Client): Promise<Client> {
    await this.repo.update({ id: client.id, tenantId: client.tenantId }, {
      nombre: client.nombre, telefono: client.telefono, email: client.email, activo: client.activo,
    });
    const updated = await this.repo.findOneByOrFail({ id: client.id, tenantId: client.tenantId });
    return this.toDomain(updated);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await this.repo.delete({ id, tenantId });
  }

  async count(tenantId: string): Promise<number> {
    return this.repo.count({ where: { tenantId } });
  }
}
