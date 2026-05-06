import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RouteEstado, RouteSchedule, RouteStop } from '../../domain/entities/route.entity';
import { OrmTenant } from '../../../tenants/infrastructure/persistence/orm-tenant.entity';

@Entity('routes')
export class OrmRoute {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  nombre: string;

  @Column({ length: 255 })
  origen: string;

  @Column({ length: 255 })
  destino: string;

  @Column({ name: 'distancia_km', type: 'decimal', precision: 10, scale: 2, nullable: true })
  distanciaKm: number | null;

  @Column({ type: 'jsonb', nullable: true })
  horario: RouteSchedule | null;

  @Column({ type: 'jsonb', nullable: true })
  paradas: RouteStop[] | null;

  @Column({ name: 'capacidad_maxima', type: 'int', default: 40 })
  capacidadMaxima: number;

  @Index()
  @Column({ type: 'enum', enum: RouteEstado, default: RouteEstado.ACTIVA })
  estado: RouteEstado;

  @Index()
  @Column({ name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => OrmTenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: OrmTenant;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
