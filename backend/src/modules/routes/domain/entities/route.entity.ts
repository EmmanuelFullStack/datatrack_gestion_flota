import { BaseEntity } from '../../../../shared/domain/base.entity';

export enum RouteEstado {
  ACTIVA = 'ACTIVA',
  INACTIVA = 'INACTIVA',
  EN_SERVICIO = 'EN_SERVICIO',
}

export interface RouteSchedule {
  diasSemana: string[];
  horaSalida: string;
  horaLlegada: string;
}

export interface RouteStop {
  orden: number;
  nombre: string;
  lat: number;
  lon: number;
}

export interface RouteProps {
  id: string;
  nombre: string;
  origen: string;
  destino: string;
  distanciaKm?: number | null;
  horario?: RouteSchedule | null;
  paradas?: RouteStop[] | null;
  capacidadMaxima: number;
  estado: RouteEstado;
  tenantId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Route extends BaseEntity {
  readonly nombre: string;
  readonly origen: string;
  readonly destino: string;
  readonly distanciaKm: number | null;
  readonly horario: RouteSchedule | null;
  readonly paradas: RouteStop[] | null;
  readonly capacidadMaxima: number;
  readonly estado: RouteEstado;
  readonly tenantId: string;

  private constructor(props: RouteProps) {
    super({ id: props.id, createdAt: props.createdAt, updatedAt: props.updatedAt });
    this.nombre = props.nombre;
    this.origen = props.origen;
    this.destino = props.destino;
    this.distanciaKm = props.distanciaKm ?? null;
    this.horario = props.horario ?? null;
    this.paradas = props.paradas ?? null;
    this.capacidadMaxima = props.capacidadMaxima;
    this.estado = props.estado;
    this.tenantId = props.tenantId;
  }

  static create(props: Omit<RouteProps, 'id' | 'estado'> & Partial<Pick<RouteProps, 'id' | 'estado'>>): Route {
    const { v4: uuidv4 } = require('uuid');
    return new Route({
      id: props.id ?? uuidv4(),
      nombre: props.nombre,
      origen: props.origen,
      destino: props.destino,
      distanciaKm: props.distanciaKm ?? null,
      horario: props.horario ?? null,
      paradas: props.paradas ?? null,
      capacidadMaxima: props.capacidadMaxima,
      estado: props.estado ?? RouteEstado.ACTIVA,
      tenantId: props.tenantId,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    });
  }

  isActive(): boolean {
    return this.estado === RouteEstado.ACTIVA || this.estado === RouteEstado.EN_SERVICIO;
  }

  withUpdates(updates: Partial<Omit<RouteProps, 'id' | 'tenantId' | 'createdAt'>>): Route {
    return Route.create({
      id: this.id,
      nombre: updates.nombre ?? this.nombre,
      origen: updates.origen ?? this.origen,
      destino: updates.destino ?? this.destino,
      distanciaKm: updates.distanciaKm !== undefined ? updates.distanciaKm : this.distanciaKm,
      horario: updates.horario !== undefined ? updates.horario : this.horario,
      paradas: updates.paradas !== undefined ? updates.paradas : this.paradas,
      capacidadMaxima: updates.capacidadMaxima ?? this.capacidadMaxima,
      estado: updates.estado ?? this.estado,
      tenantId: this.tenantId,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    });
  }
}
