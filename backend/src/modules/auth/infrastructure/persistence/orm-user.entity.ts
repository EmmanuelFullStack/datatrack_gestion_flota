import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { Role } from '../../domain/entities/user.entity';
import { OrmTenant } from '../../../tenants/infrastructure/persistence/orm-tenant.entity';

@Entity('users')
@Unique(['email', 'tenantId'])
export class OrmUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  nombre: string;

  @Column({ length: 255 })
  email: string;

  @Column({ name: 'password_hash', length: 255 })
  passwordHash: string;

  @Column({ type: 'enum', enum: Role, default: Role.TENANT_USER })
  role: Role;

  @Column({ default: true })
  activo: boolean;

  @Index()
  @Column({ name: 'tenant_id', nullable: true, default: null })
  tenantId: string | null;

  @ManyToOne(() => OrmTenant, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'tenant_id' })
  tenant: OrmTenant | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
