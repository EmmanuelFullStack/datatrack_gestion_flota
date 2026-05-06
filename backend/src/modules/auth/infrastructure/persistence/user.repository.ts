import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { OrmUser } from './orm-user.entity';
import { Role, User } from '../../domain/entities/user.entity';
import { UserRepositoryPort } from '../../domain/repositories/user.repository.port';

@Injectable()
export class UserRepository implements UserRepositoryPort {
  constructor(
    @InjectRepository(OrmUser)
    private readonly repo: Repository<OrmUser>,
  ) {}

  private toDomain(orm: OrmUser): User {
    return User.create({
      id: orm.id,
      nombre: orm.nombre,
      email: orm.email,
      passwordHash: orm.passwordHash,
      role: orm.role,
      activo: orm.activo,
      tenantId: orm.tenantId,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  async findById(id: string, tenantId: string | null): Promise<User | null> {
    const where = tenantId === null
      ? { id, tenantId: IsNull() }
      : { id, tenantId };
    const orm = await this.repo.findOne({ where });
    return orm ? this.toDomain(orm) : null;
  }

  async findByEmail(email: string, tenantId: string): Promise<User | null> {
    const orm = await this.repo.findOne({ where: { email: email.toLowerCase(), tenantId } });
    return orm ? this.toDomain(orm) : null;
  }

  async findByEmailGlobal(email: string): Promise<User | null> {
    const orm = await this.repo.findOne({ where: { email: email.toLowerCase(), tenantId: IsNull() } });
    return orm ? this.toDomain(orm) : null;
  }

  async findAllByTenant(tenantId: string, page: number, limit: number): Promise<{ items: User[]; total: number }> {
    const safePage  = Math.max(1, page);
    const safeLimit = Math.min(Math.max(1, limit), 200);
    const [orms, total] = await this.repo.findAndCount({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
    });
    return { items: orms.map((o) => this.toDomain(o)), total };
  }

  async save(user: User): Promise<User> {
    const orm = this.repo.create({
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      passwordHash: user.passwordHash,
      role: user.role,
      activo: user.activo,
      tenantId: user.tenantId,
    });
    const saved = await this.repo.save(orm);
    return this.toDomain(saved);
  }

  async update(user: User): Promise<User> {
    await this.repo.update({ id: user.id }, { nombre: user.nombre, activo: user.activo });
    const updated = await this.repo.findOneByOrFail({ id: user.id });
    return this.toDomain(updated);
  }

  async superAdminExists(): Promise<boolean> {
    return this.repo.exists({ where: { role: Role.SUPER_ADMIN } });
  }
}
