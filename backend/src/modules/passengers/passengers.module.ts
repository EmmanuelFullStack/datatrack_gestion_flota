import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrmPassenger } from './infrastructure/persistence/orm-passenger.entity';
import { PassengerRepository } from './infrastructure/persistence/passenger.repository';
import { PASSENGER_REPOSITORY } from './domain/repositories/passenger.repository.port';
import { CreatePassengerUseCase } from './application/use-cases/create-passenger.use-case';
import { FindPassengersUseCase } from './application/use-cases/find-passengers.use-case';
import { UpdatePassengerUseCase } from './application/use-cases/update-passenger.use-case';
import { DeletePassengerUseCase } from './application/use-cases/delete-passenger.use-case';
import { AssignToRouteUseCase } from './application/use-cases/assign-to-route.use-case';
import { PassengersController } from './infrastructure/http/passengers.controller';
import { RoutesModule } from '../routes/routes.module';

@Module({
  imports: [TypeOrmModule.forFeature([OrmPassenger]), RoutesModule],
  controllers: [PassengersController],
  providers: [
    { provide: PASSENGER_REPOSITORY, useClass: PassengerRepository },
    CreatePassengerUseCase,
    FindPassengersUseCase,
    UpdatePassengerUseCase,
    DeletePassengerUseCase,
    AssignToRouteUseCase,
  ],
  exports: [FindPassengersUseCase, PASSENGER_REPOSITORY],
})
export class PassengersModule {}
