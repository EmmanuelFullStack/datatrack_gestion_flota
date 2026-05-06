import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DatatrackHttpAdapter } from './infrastructure/adapters/datatrack-http.adapter';
import { DATATRACK_PORT } from './domain/ports/datatrack.port';
import { GpsGateway } from './infrastructure/gateways/gps.gateway';
import { GpsSyncScheduler } from './infrastructure/schedulers/gps-sync.scheduler';
import { SyncPassengerGpsUseCase } from './application/use-cases/sync-passenger-gps.use-case';
import { GetUnitPositionsUseCase } from './application/use-cases/get-unit-positions.use-case';
import { CreateLocatorUseCase } from './application/use-cases/create-locator.use-case';
import { GetAlarmsUseCase } from './application/use-cases/get-alarms.use-case';
import { DatatrackController } from './infrastructure/http/datatrack.controller';
import { PassengersModule } from '../passengers/passengers.module';
import { RoutesModule } from '../routes/routes.module';
import { TenantsModule } from '../tenants/tenants.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PassengersModule,
    RoutesModule,
    TenantsModule,
    AuthModule,
  ],
  controllers: [DatatrackController],
  providers: [
    DatatrackHttpAdapter,
    { provide: DATATRACK_PORT, useExisting: DatatrackHttpAdapter },
    GpsGateway,
    GpsSyncScheduler,
    SyncPassengerGpsUseCase,
    GetUnitPositionsUseCase,
    CreateLocatorUseCase,
    GetAlarmsUseCase,
  ],
  exports: [DatatrackHttpAdapter],
})
export class DatatrackModule {}
