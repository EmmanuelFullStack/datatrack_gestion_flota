import { Inject, Injectable } from '@nestjs/common';
import { Route } from '../../domain/entities/route.entity';
import { ROUTE_REPOSITORY, RouteRepositoryPort } from '../../domain/repositories/route.repository.port';
import { CreateRouteDto } from '../dtos/create-route.dto';

@Injectable()
export class CreateRouteUseCase {
  constructor(
    @Inject(ROUTE_REPOSITORY)
    private readonly routeRepository: RouteRepositoryPort,
  ) {}

  async execute(tenantId: string, dto: CreateRouteDto): Promise<Route> {
    const route = Route.create({
      nombre: dto.nombre,
      origen: dto.origen,
      destino: dto.destino,
      distanciaKm: dto.distanciaKm,
      horario: dto.horario,
      paradas: dto.paradas ?? null,
      capacidadMaxima: dto.capacidadMaxima,
      estado: dto.estado,
      tenantId,
    });
    return this.routeRepository.save(route);
  }
}
