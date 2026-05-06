import { BaseEntity } from '../../../../shared/domain/base.entity';

export enum Role {
  SUPER_ADMIN  = 'SUPER_ADMIN',
  TENANT_ADMIN = 'TENANT_ADMIN',
  TENANT_USER  = 'TENANT_USER',
}

export interface UserProps {
  id: string;
  nombre: string;
  email: string;
  passwordHash: string;
  role: Role;
  activo: boolean;
  tenantId: string | null;   // null for SUPER_ADMIN
  createdAt?: Date;
  updatedAt?: Date;
}

export class User extends BaseEntity {
  readonly nombre: string;
  readonly email: string;
  readonly passwordHash: string;
  readonly role: Role;
  readonly activo: boolean;
  readonly tenantId: string | null;

  private constructor(props: UserProps) {
    super({ id: props.id, createdAt: props.createdAt, updatedAt: props.updatedAt });
    this.nombre    = props.nombre;
    this.email     = props.email;
    this.passwordHash = props.passwordHash;
    this.role      = props.role;
    this.activo    = props.activo;
    this.tenantId  = props.tenantId;
  }

  static create(props: Omit<UserProps, 'id' | 'activo' | 'role'> & Partial<Pick<UserProps, 'id' | 'activo' | 'role'>>): User {
    const { v4: uuidv4 } = require('uuid');
    return new User({
      id: props.id ?? uuidv4(),
      nombre: props.nombre.trim(),
      email: props.email.toLowerCase().trim(),
      passwordHash: props.passwordHash,
      role: props.role ?? Role.TENANT_USER,
      activo: props.activo ?? true,
      tenantId: props.tenantId,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    });
  }

  isActive(): boolean   { return this.activo; }
  isAdmin(): boolean    { return this.role === Role.TENANT_ADMIN || this.role === Role.SUPER_ADMIN; }
  isSuperAdmin(): boolean { return this.role === Role.SUPER_ADMIN; }

  belongsToTenant(tenantId: string): boolean {
    return this.isSuperAdmin() || this.tenantId === tenantId;
  }
}
