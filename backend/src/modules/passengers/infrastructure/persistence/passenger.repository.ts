import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere, LessThan, IsNull } from 'typeorm';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';
import { OrmPassenger } from './orm-passenger.entity';
import { Passenger, PassengerEstado } from '../../domain/entities/passenger.entity';
import { FindPassengersFilter, PassengerRepositoryPort } from '../../domain/repositories/passenger.repository.port';

@Injectable()
export class PassengerRepository implements PassengerRepositoryPort {
  constructor(
    @InjectRepository(OrmPassenger)
    private readonly repo: Repository<OrmPassenger>,
  ) {}

  private toDomain(orm: OrmPassenger): Passenger {
    return Passenger.create({
      id: orm.id,
      nombre: orm.nombre,
      documento: orm.documento,
      telefono: orm.telefono,
      estado: orm.estado,
      lat: orm.lat ? Number(orm.lat) : null,
      lon: orm.lon ? Number(orm.lon) : null,
      deviceIdDatatrack: orm.deviceIdDatatrack,
      ultimoGpsUpdate: orm.ultimoGpsUpdate,
      routeId: orm.routeId,
      tenantId: orm.tenantId,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  async findById(id: string, tenantId: string): Promise<Passenger | null> {
    const orm = await this.repo.findOne({ where: { id, tenantId } });
    return orm ? this.toDomain(orm) : null;
  }

  async findAll(tenantId: string, page: number, limit: number, filter?: FindPassengersFilter): Promise<{ items: Passenger[]; total: number }> {
    const safePage  = Math.max(1, page);
    const safeLimit = Math.min(Math.max(1, limit), 200);

    const where: FindOptionsWhere<OrmPassenger> = { tenantId };
    if (filter?.estado)  where.estado  = filter.estado;
    if (filter?.routeId) where.routeId = filter.routeId;
    if (filter?.search)  where.nombre  = Like(`%${filter.search}%`);

    const [orms, total] = await this.repo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
    });
    return { items: orms.map((o) => this.toDomain(o)), total };
  }

  async findByDeviceId(deviceId: string, tenantId: string): Promise<Passenger | null> {
    const orm = await this.repo.findOne({ where: { deviceIdDatatrack: deviceId, tenantId } });
    return orm ? this.toDomain(orm) : null;
  }

  async findInTransit(tenantId: string): Promise<Passenger[]> {
    const orms = await this.repo.find({
      where: [
        { tenantId, estado: PassengerEstado.EN_TRANSITO },
        { tenantId, estado: PassengerEstado.EMBARCADO },
      ],
    });
    return orms.map((o) => this.toDomain(o));
  }

  async findByRoute(routeId: string, tenantId: string): Promise<Passenger[]> {
    const orms = await this.repo.find({ where: { routeId, tenantId } });
    return orms.map((o) => this.toDomain(o));
  }

  async findAllWithDeviceIds(tenantId: string): Promise<Passenger[]> {
    const orms = await this.repo
      .createQueryBuilder('p')
      .where('p.tenant_id = :tenantId', { tenantId })
      .andWhere('p.device_id_datatrack IS NOT NULL')
      .getMany();
    return orms.map((o) => this.toDomain(o));
  }

  async save(passenger: Passenger): Promise<Passenger> {
    const orm = this.repo.create({
      id: passenger.id,
      nombre: passenger.nombre,
      documento: passenger.documento,
      telefono: passenger.telefono,
      estado: passenger.estado,
      lat: passenger.lat,
      lon: passenger.lon,
      deviceIdDatatrack: passenger.deviceIdDatatrack,
      ultimoGpsUpdate: passenger.ultimoGpsUpdate,
      routeId: passenger.routeId,
      tenantId: passenger.tenantId,
    });
    const saved = await this.repo.save(orm);
    return this.toDomain(saved);
  }

  async update(passenger: Passenger): Promise<Passenger> {
    await this.repo.update({ id: passenger.id, tenantId: passenger.tenantId }, {
      nombre: passenger.nombre,
      documento: passenger.documento,
      telefono: passenger.telefono,
      estado: passenger.estado,
      lat: passenger.lat,
      lon: passenger.lon,
      deviceIdDatatrack: passenger.deviceIdDatatrack,
      ultimoGpsUpdate: passenger.ultimoGpsUpdate,
      routeId: passenger.routeId,
    });
    const updated = await this.repo.findOneBy({ id: passenger.id, tenantId: passenger.tenantId });
    if (!updated) throw new NotFoundError('Passenger', passenger.id);
    return this.toDomain(updated);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await this.repo.delete({ id, tenantId });
  }

  async countByRoute(routeId: string, tenantId: string): Promise<number> {
    return this.repo.count({ where: { routeId, tenantId } });
  }

  async countByEstado(tenantId: string, estado: PassengerEstado): Promise<number> {
    return this.repo.count({ where: { tenantId, estado } });
  }

  async findLlegoOlderThan(minutes: number): Promise<Passenger[]> {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    const orms = await this.repo.find({
      where: { estado: PassengerEstado.LLEGO, ultimoGpsUpdate: LessThan(cutoff) },
    });
    return orms.map((o) => this.toDomain(o));
  }

  async findWithDeviceButNoRoute(tenantId: string): Promise<Passenger[]> {
    const orms = await this.repo
      .createQueryBuilder('p')
      .where('p.tenant_id = :tenantId', { tenantId })
      .andWhere('p.device_id_datatrack IS NOT NULL')
      .andWhere('p.route_id IS NULL')
      .getMany();
    return orms.map((o) => this.toDomain(o));
  }
}
