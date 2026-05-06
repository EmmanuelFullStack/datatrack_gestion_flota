import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrmTenant } from './infrastructure/persistence/orm-tenant.entity';
import { TenantRepository } from './infrastructure/persistence/tenant.repository';
import { TENANT_REPOSITORY } from './domain/repositories/tenant.repository.port';
import { CreateTenantUseCase } from './application/use-cases/create-tenant.use-case';
import { FindTenantUseCase } from './application/use-cases/find-tenant.use-case';
import { UpdateTenantUseCase } from './application/use-cases/update-tenant.use-case';
import { TenantsController } from './infrastructure/http/tenants.controller';

@Module({
  imports: [TypeOrmModule.forFeature([OrmTenant])],
  controllers: [TenantsController],
  providers: [
    { provide: TENANT_REPOSITORY, useClass: TenantRepository },
    CreateTenantUseCase,
    FindTenantUseCase,
    UpdateTenantUseCase,
  ],
  exports: [FindTenantUseCase, TENANT_REPOSITORY],
})
export class TenantsModule {}
