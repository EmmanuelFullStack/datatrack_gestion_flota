import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PassengerEstado } from '../../domain/entities/passenger.entity';
import { OrmTenant } from '../../../tenants/infrastructure/persistence/orm-tenant.entity';
import { OrmRoute } from '../../../routes/infrastructure/persistence/orm-route.entity';

@Entity('passengers')
export class OrmPassenger {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  nombre: string;

  @Column({ length: 50 })
  documento: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  telefono: string | null;

  @Index()
  @Column({ type: 'enum', enum: PassengerEstado, default: PassengerEstado.PENDIENTE })
  estado: PassengerEstado;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  lat: number | null;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  lon: number | null;

  @Index()
  @Column({ type: 'varchar', name: 'device_id_datatrack', length: 100, nullable: true })
  deviceIdDatatrack: string | null;

  @Column({ type: 'timestamptz', name: 'ultimo_gps_update', nullable: true })
  ultimoGpsUpdate: Date | null;

  @Index()
  @Column({ name: 'route_id', nullable: true })
  routeId: string | null;

  @ManyToOne(() => OrmRoute, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'route_id' })
  route: OrmRoute | null;

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
