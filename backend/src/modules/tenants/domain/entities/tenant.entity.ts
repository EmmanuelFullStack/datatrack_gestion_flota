import { BaseEntity } from '../../../../shared/domain/base.entity';

export enum TenantEstado {
  ACTIVO = 'ACTIVO',
  INACTIVO = 'INACTIVO',
}

export enum PlanSuscripcion {
  BASICO = 'BASICO',
  PROFESIONAL = 'PROFESIONAL',
  ENTERPRISE = 'ENTERPRISE',
}

export interface TenantProps {
  id: string;
  nombre: string;
  nit: string;
  ciudad: string;
  logoUrl?: string | null;
  estado: TenantEstado;
  planSuscripcion: PlanSuscripcion;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Tenant extends BaseEntity {
  readonly nombre: string;
  readonly nit: string;
  readonly ciudad: string;
  readonly logoUrl: string | null;
  readonly estado: TenantEstado;
  readonly planSuscripcion: PlanSuscripcion;

  private constructor(props: TenantProps) {
    super({ id: props.id, createdAt: props.createdAt, updatedAt: props.updatedAt });
    this.nombre = props.nombre;
    this.nit = props.nit;
    this.ciudad = props.ciudad;
    this.logoUrl = props.logoUrl ?? null;
    this.estado = props.estado;
    this.planSuscripcion = props.planSuscripcion;
  }

  static create(props: Omit<TenantProps, 'id' | 'estado' | 'planSuscripcion'> & Partial<Pick<TenantProps, 'id' | 'estado' | 'planSuscripcion'>>): Tenant {
    const { v4: uuidv4 } = require('uuid');
    return new Tenant({
      id: props.id ?? uuidv4(),
      nombre: props.nombre.trim(),
      nit: props.nit.trim(),
      ciudad: props.ciudad.trim(),
      logoUrl: props.logoUrl ?? null,
      estado: props.estado ?? TenantEstado.ACTIVO,
      planSuscripcion: props.planSuscripcion ?? PlanSuscripcion.BASICO,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    });
  }

  isActive(): boolean {
    return this.estado === TenantEstado.ACTIVO;
  }

  withUpdates(updates: Partial<Pick<TenantProps, 'nombre' | 'ciudad' | 'logoUrl' | 'planSuscripcion'>>): Tenant {
    return Tenant.create({
      id: this.id,
      nombre: updates.nombre ?? this.nombre,
      nit: this.nit,
      ciudad: updates.ciudad ?? this.ciudad,
      logoUrl: updates.logoUrl !== undefined ? updates.logoUrl : this.logoUrl,
      estado: this.estado,
      planSuscripcion: updates.planSuscripcion ?? this.planSuscripcion,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    });
  }

  toggleStatus(): Tenant {
    return Tenant.create({
      id: this.id,
      nombre: this.nombre,
      nit: this.nit,
      ciudad: this.ciudad,
      logoUrl: this.logoUrl,
      estado: this.estado === TenantEstado.ACTIVO ? TenantEstado.INACTIVO : TenantEstado.ACTIVO,
      planSuscripcion: this.planSuscripcion,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    });
  }
}
