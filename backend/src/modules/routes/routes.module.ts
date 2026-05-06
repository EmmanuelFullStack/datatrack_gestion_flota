import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrmRoute } from './infrastructure/persistence/orm-route.entity';
import { RouteRepository } from './infrastructure/persistence/route.repository';
import { ROUTE_REPOSITORY } from './domain/repositories/route.repository.port';
import { CreateRouteUseCase } from './application/use-cases/create-route.use-case';
import { FindRoutesUseCase } from './application/use-cases/find-routes.use-case';
import { UpdateRouteUseCase } from './application/use-cases/update-route.use-case';
import { DeleteRouteUseCase } from './application/use-cases/delete-route.use-case';
import { RoutesController } from './infrastructure/http/routes.controller';

@Module({
  imports: [TypeOrmModule.forFeature([OrmRoute])],
  controllers: [RoutesController],
  providers: [
    { provide: ROUTE_REPOSITORY, useClass: RouteRepository },
    CreateRouteUseCase,
    FindRoutesUseCase,
    UpdateRouteUseCase,
    DeleteRouteUseCase,
  ],
  exports: [FindRoutesUseCase, ROUTE_REPOSITORY],
})
export class RoutesModule {}
