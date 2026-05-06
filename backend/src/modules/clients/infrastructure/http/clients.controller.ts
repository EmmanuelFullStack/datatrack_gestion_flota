import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateClientUseCase } from '../../application/use-cases/create-client.use-case';
import { FindClientsUseCase } from '../../application/use-cases/find-clients.use-case';
import { UpdateClientUseCase } from '../../application/use-cases/update-client.use-case';
import { DeleteClientUseCase } from '../../application/use-cases/delete-client.use-case';
import { CreateClientDto } from '../../application/dtos/create-client.dto';
import { UpdateClientDto } from '../../application/dtos/update-client.dto';
import { JwtAuthGuard } from '../../../auth/infrastructure/jwt/jwt-auth.guard';
import { CurrentUser } from '../../../auth/infrastructure/decorators/current-user.decorator';
import { JwtPayload } from '../../../auth/infrastructure/jwt/jwt.strategy';

@ApiTags('Clients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('clients')
export class ClientsController {
  constructor(
    private readonly createClient: CreateClientUseCase,
    private readonly findClients: FindClientsUseCase,
    private readonly updateClient: UpdateClientUseCase,
    private readonly deleteClient: DeleteClientUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new client' })
  async create(@CurrentUser() user: JwtPayload, @Body() dto: CreateClientDto) {
    return this.createClient.execute(user.tenantId!, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List clients for current tenant' })
  async findAll(@CurrentUser() user: JwtPayload, @Query('page') page = 1, @Query('limit') limit = 20, @Query('search') search?: string) {
    return this.findClients.findAll(user.tenantId!, Number(page), Number(limit), search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get client by ID' })
  async findById(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.findClients.findById(id, user.tenantId!);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update client' })
  async update(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateClientDto) {
    return this.updateClient.execute(id, user.tenantId!, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete client' })
  async delete(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    await this.deleteClient.execute(id, user.tenantId!);
  }
}
