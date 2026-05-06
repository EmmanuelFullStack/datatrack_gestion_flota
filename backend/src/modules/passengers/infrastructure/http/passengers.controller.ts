import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreatePassengerUseCase } from '../../application/use-cases/create-passenger.use-case';
import { FindPassengersUseCase } from '../../application/use-cases/find-passengers.use-case';
import { UpdatePassengerUseCase } from '../../application/use-cases/update-passenger.use-case';
import { DeletePassengerUseCase } from '../../application/use-cases/delete-passenger.use-case';
import { AssignToRouteUseCase } from '../../application/use-cases/assign-to-route.use-case';
import { CreatePassengerDto } from '../../application/dtos/create-passenger.dto';
import { UpdatePassengerDto } from '../../application/dtos/update-passenger.dto';
import { JwtAuthGuard } from '../../../auth/infrastructure/jwt/jwt-auth.guard';
import { CurrentUser } from '../../../auth/infrastructure/decorators/current-user.decorator';
import { JwtPayload } from '../../../auth/infrastructure/jwt/jwt.strategy';
import { PassengerEstado } from '../../domain/entities/passenger.entity';

@ApiTags('Passengers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('passengers')
export class PassengersController {
  constructor(
    private readonly createPassenger: CreatePassengerUseCase,
    private readonly findPassengers: FindPassengersUseCase,
    private readonly updatePassenger: UpdatePassengerUseCase,
    private readonly deletePassenger: DeletePassengerUseCase,
    private readonly assignToRoute: AssignToRouteUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new passenger' })
  async create(@CurrentUser() user: JwtPayload, @Body() dto: CreatePassengerDto) {
    return this.createPassenger.execute(user.tenantId!, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List passengers for current tenant' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'estado', required: false, enum: PassengerEstado })
  @ApiQuery({ name: 'routeId', required: false })
  @ApiQuery({ name: 'search', required: false })
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('estado') estado?: PassengerEstado,
    @Query('routeId') routeId?: string,
    @Query('search') search?: string,
  ) {
    return this.findPassengers.findAll(user.tenantId!, Number(page), Number(limit), { estado, routeId, search });
  }

  @Get('in-transit')
  @ApiOperation({ summary: 'Get all passengers currently in transit or boarded' })
  async findInTransit(@CurrentUser() user: JwtPayload) {
    return this.findPassengers.findInTransit(user.tenantId!);
  }

  @Get('dashboard-stats')
  @ApiOperation({ summary: 'Get passenger count statistics per status' })
  async getDashboardStats(@CurrentUser() user: JwtPayload) {
    return this.findPassengers.getDashboardStats(user.tenantId!);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get passenger by ID' })
  @ApiResponse({ status: 404, description: 'Passenger not found' })
  async findById(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.findPassengers.findById(id, user.tenantId!);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a passenger' })
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePassengerDto,
  ) {
    return this.updatePassenger.execute(id, user.tenantId!, dto);
  }

  @Patch(':id/assign/:routeId')
  @ApiOperation({ summary: 'Assign passenger to a route' })
  @ApiResponse({ status: 409, description: 'Route at full capacity or inactive' })
  async assign(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('routeId', ParseUUIDPipe) routeId: string,
  ) {
    return this.assignToRoute.assign(id, routeId, user.tenantId!);
  }

  @Patch(':id/unassign')
  @ApiOperation({ summary: 'Unassign passenger from their current route' })
  async unassign(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.assignToRoute.unassign(id, user.tenantId!);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a passenger' })
  async delete(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    await this.deletePassenger.execute(id, user.tenantId!);
  }
}
