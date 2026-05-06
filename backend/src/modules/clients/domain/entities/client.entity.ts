import { BaseEntity } from '../../../../shared/domain/base.entity';

export interface ClientProps {
  id: string;
  nombre: string;
  documento: string;
  telefono?: string | null;
  email?: string | null;
  activo: boolean;
  tenantId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Client extends BaseEntity {
  readonly nombre: string;
  readonly documento: string;
  readonly telefono: string | null;
  readonly email: string | null;
  readonly activo: boolean;
  readonly tenantId: string;

  private constructor(props: ClientProps) {
    super({ id: props.id, createdAt: props.createdAt, updatedAt: props.updatedAt });
    this.nombre = props.nombre;
    this.documento = props.documento;
    this.telefono = props.telefono ?? null;
    this.email = props.email ?? null;
    this.activo = props.activo;
    this.tenantId = props.tenantId;
  }

  static create(props: Omit<ClientProps, 'id' | 'activo'> & Partial<Pick<ClientProps, 'id' | 'activo'>>): Client {
    const { v4: uuidv4 } = require('uuid');
    return new Client({
      id: props.id ?? uuidv4(),
      nombre: props.nombre,
      documento: props.documento,
      telefono: props.telefono ?? null,
      email: props.email ?? null,
      activo: props.activo ?? true,
      tenantId: props.tenantId,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    });
  }

  withUpdates(updates: Partial<Omit<ClientProps, 'id' | 'tenantId' | 'documento' | 'createdAt'>>): Client {
    return Client.create({
      id: this.id,
      nombre: updates.nombre ?? this.nombre,
      documento: this.documento,
      telefono: updates.telefono !== undefined ? updates.telefono : this.telefono,
      email: updates.email !== undefined ? updates.email : this.email,
      activo: updates.activo ?? this.activo,
      tenantId: this.tenantId,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    });
  }
}
