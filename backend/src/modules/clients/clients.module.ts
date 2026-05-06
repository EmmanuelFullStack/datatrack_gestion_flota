import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrmClient } from './infrastructure/persistence/orm-client.entity';
import { ClientRepository } from './infrastructure/persistence/client.repository';
import { CLIENT_REPOSITORY } from './domain/repositories/client.repository.port';
import { CreateClientUseCase } from './application/use-cases/create-client.use-case';
import { FindClientsUseCase } from './application/use-cases/find-clients.use-case';
import { UpdateClientUseCase } from './application/use-cases/update-client.use-case';
import { DeleteClientUseCase } from './application/use-cases/delete-client.use-case';
import { ClientsController } from './infrastructure/http/clients.controller';

@Module({
  imports: [TypeOrmModule.forFeature([OrmClient])],
  controllers: [ClientsController],
  providers: [
    { provide: CLIENT_REPOSITORY, useClass: ClientRepository },
    CreateClientUseCase,
    FindClientsUseCase,
    UpdateClientUseCase,
    DeleteClientUseCase,
  ],
  exports: [FindClientsUseCase],
})
export class ClientsModule {}
