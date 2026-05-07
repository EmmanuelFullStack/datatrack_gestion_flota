import { BaseEntity } from '../../../../shared/domain/base.entity';

export enum PassengerEstado {
  PENDIENTE = 'PENDIENTE',
  EMBARCADO = 'EMBARCADO',
  EN_TRANSITO = 'EN_TRANSITO',
  LLEGO = 'LLEGO',
}

export interface PassengerProps {
  id: string;
  nombre: string;
  documento: string;
  telefono?: string | null;
  estado: PassengerEstado;
  lat?: number | null;
  lon?: number | null;
  deviceIdDatatrack?: string | null;
  deviceNameDatatrack?: string | null;
  ultimoGpsUpdate?: Date | null;
  routeId?: string | null;
  tenantId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Passenger extends BaseEntity {
  readonly nombre: string;
  readonly documento: string;
  readonly telefono: string | null;
  readonly estado: PassengerEstado;
  readonly lat: number | null;
  readonly lon: number | null;
  readonly deviceIdDatatrack: string | null;
  readonly deviceNameDatatrack: string | null;
  readonly ultimoGpsUpdate: Date | null;
  readonly routeId: string | null;
  readonly tenantId: string;

  private constructor(props: PassengerProps) {
    super({ id: props.id, createdAt: props.createdAt, updatedAt: props.updatedAt });
    this.nombre = props.nombre;
    this.documento = props.documento;
    this.telefono = props.telefono ?? null;
    this.estado = props.estado;
    this.lat = props.lat ?? null;
    this.lon = props.lon ?? null;
    this.deviceIdDatatrack = props.deviceIdDatatrack ?? null;
    this.deviceNameDatatrack = props.deviceNameDatatrack ?? null;
    this.ultimoGpsUpdate = props.ultimoGpsUpdate ?? null;
    this.routeId = props.routeId ?? null;
    this.tenantId = props.tenantId;
  }

  static create(props: Omit<PassengerProps, 'id' | 'estado'> & Partial<Pick<PassengerProps, 'id' | 'estado'>>): Passenger {
    const { v4: uuidv4 } = require('uuid');
    return new Passenger({
      id: props.id ?? uuidv4(),
      nombre: props.nombre,
      documento: props.documento,
      telefono: props.telefono ?? null,
      estado: props.estado ?? PassengerEstado.PENDIENTE,
      lat: props.lat ?? null,
      lon: props.lon ?? null,
      deviceIdDatatrack: props.deviceIdDatatrack ?? null,
      ultimoGpsUpdate: props.ultimoGpsUpdate ?? null,
      routeId: props.routeId ?? null,
      tenantId: props.tenantId,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    });
  }

  isInTransit(): boolean {
    return this.estado === PassengerEstado.EN_TRANSITO || this.estado === PassengerEstado.EMBARCADO;
  }

  withGpsUpdate(lat: number, lon: number): Passenger {
    return Passenger.create({
      ...this.toProps(),
      lat,
      lon,
      ultimoGpsUpdate: new Date(),
      updatedAt: new Date(),
    });
  }

  withRoute(routeId: string | null): Passenger {
    return Passenger.create({
      ...this.toProps(),
      routeId,
      updatedAt: new Date(),
    });
  }

  withUpdates(updates: Partial<Omit<PassengerProps, 'id' | 'tenantId' | 'createdAt'>>): Passenger {
    return Passenger.create({
      ...this.toProps(),
      ...updates,
      id: this.id,
      tenantId: this.tenantId,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    });
  }

  private toProps(): PassengerProps {
    return {
      id: this.id,
      nombre: this.nombre,
      documento: this.documento,
      telefono: this.telefono,
      estado: this.estado,
      lat: this.lat,
      lon: this.lon,
      deviceIdDatatrack: this.deviceIdDatatrack,
      deviceNameDatatrack: this.deviceNameDatatrack,
      ultimoGpsUpdate: this.ultimoGpsUpdate,
      routeId: this.routeId,
      tenantId: this.tenantId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
