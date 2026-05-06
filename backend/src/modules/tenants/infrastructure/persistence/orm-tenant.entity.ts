import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TenantEstado, PlanSuscripcion } from '../../domain/entities/tenant.entity';

@Entity('tenants')
export class OrmTenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  nombre: string;

  @Column({ length: 50, unique: true })
  nit: string;

  @Column({ length: 100 })
  ciudad: string;

  @Column({ name: 'logo_url', type: 'varchar', length: 500, nullable: true, default: null,
  })
  logoUrl: string | null;

  @Column({ type: 'enum', enum: TenantEstado, default: TenantEstado.ACTIVO })
  estado: TenantEstado;

  @Column({ name: 'plan_suscripcion', type: 'enum', enum: PlanSuscripcion, default: PlanSuscripcion.BASICO })
  planSuscripcion: PlanSuscripcion;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
