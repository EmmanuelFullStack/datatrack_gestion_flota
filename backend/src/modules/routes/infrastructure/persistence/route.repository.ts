import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { OrmRoute } from './orm-route.entity';
import { Route, RouteEstado } from '../../domain/entities/route.entity';
import { FindRoutesFilter, RouteRepositoryPort } from '../../domain/repositories/route.repository.port';

@Injectable()
export class RouteRepository implements RouteRepositoryPort {
  constructor(
    @InjectRepository(OrmRoute)
    private readonly repo: Repository<OrmRoute>,
  ) {}

  private toDomain(orm: OrmRoute): Route {
    return Route.create({
      id: orm.id,
      nombre: orm.nombre,
      origen: orm.origen,
      destino: orm.destino,
      distanciaKm: orm.distanciaKm,
      horario: orm.horario,
      paradas: orm.paradas,
      capacidadMaxima: orm.capacidadMaxima,
      estado: orm.estado,
      tenantId: orm.tenantId,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  async findById(id: string, tenantId: string): Promise<Route | null> {
    const orm = await this.repo.findOne({ where: { id, tenantId } });
    return orm ? this.toDomain(orm) : null;
  }

  async findAll(tenantId: string, page: number, limit: number, filter?: FindRoutesFilter): Promise<{ items: Route[]; total: number }> {
    const where: FindOptionsWhere<OrmRoute> = { tenantId };
    if (filter?.estado) where.estado = filter.estado;
    if (filter?.search) where.nombre = Like(`%${filter.search}%`);

    const [orms, total] = await this.repo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items: orms.map((o) => this.toDomain(o)), total };
  }

  async findActiveRoutes(tenantId: string): Promise<Route[]> {
    const orms = await this.repo.find({
      where: [
        { tenantId, estado: RouteEstado.ACTIVA },
        { tenantId, estado: RouteEstado.EN_SERVICIO },
      ],
    });
    return orms.map((o) => this.toDomain(o));
  }

  async save(route: Route): Promise<Route> {
    const orm = this.repo.create({
      id: route.id,
      nombre: route.nombre,
      origen: route.origen,
      destino: route.destino,
      distanciaKm: route.distanciaKm,
      horario: route.horario,
      paradas: route.paradas,
      capacidadMaxima: route.capacidadMaxima,
      estado: route.estado,
      tenantId: route.tenantId,
    });
    const saved = await this.repo.save(orm);
    return this.toDomain(saved);
  }

  async update(route: Route): Promise<Route> {
    await this.repo.update({ id: route.id, tenantId: route.tenantId }, {
      nombre: route.nombre,
      origen: route.origen,
      destino: route.destino,
      distanciaKm: route.distanciaKm,
      horario: route.horario,
      paradas: route.paradas,
      capacidadMaxima: route.capacidadMaxima,
      estado: route.estado,
    });
    const updated = await this.repo.findOneByOrFail({ id: route.id, tenantId: route.tenantId });
    return this.toDomain(updated);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await this.repo.delete({ id, tenantId });
  }

  async countPassengers(routeId: string, tenantId: string): Promise<number> {
    // Uses raw query to join with passengers table
    const result = await this.repo.query(
      `SELECT COUNT(*) as count FROM passengers WHERE route_id = $1 AND tenant_id = $2`,
      [routeId, tenantId],
    );
    return parseInt(result[0]?.count ?? '0', 10);
  }
}
