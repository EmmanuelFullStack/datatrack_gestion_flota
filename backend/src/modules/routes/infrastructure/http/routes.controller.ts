import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateRouteUseCase } from '../../application/use-cases/create-route.use-case';
import { FindRoutesUseCase } from '../../application/use-cases/find-routes.use-case';
import { UpdateRouteUseCase } from '../../application/use-cases/update-route.use-case';
import { DeleteRouteUseCase } from '../../application/use-cases/delete-route.use-case';
import { CreateRouteDto } from '../../application/dtos/create-route.dto';
import { UpdateRouteDto } from '../../application/dtos/update-route.dto';
import { JwtAuthGuard } from '../../../auth/infrastructure/jwt/jwt-auth.guard';
import { CurrentUser } from '../../../auth/infrastructure/decorators/current-user.decorator';
import { JwtPayload } from '../../../auth/infrastructure/jwt/jwt.strategy';
import { RouteEstado } from '../../domain/entities/route.entity';

@ApiTags('Routes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('routes')
export class RoutesController {
  constructor(
    private readonly createRoute: CreateRouteUseCase,
    private readonly findRoutes: FindRoutesUseCase,
    private readonly updateRoute: UpdateRouteUseCase,
    private readonly deleteRoute: DeleteRouteUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new route' })
  @ApiResponse({ status: 201, description: 'Route created' })
  async create(@CurrentUser() user: JwtPayload, @Body() dto: CreateRouteDto) {
    return this.createRoute.execute(user.tenantId!, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List routes for current tenant' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'estado', required: false, enum: RouteEstado })
  @ApiQuery({ name: 'search', required: false, type: String })
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('estado') estado?: RouteEstado,
    @Query('search') search?: string,
  ) {
    return this.findRoutes.findAll(user.tenantId!, Number(page), Number(limit), { estado, search });
  }

  @Get('active')
  @ApiOperation({ summary: 'Get all active routes' })
  async findActive(@CurrentUser() user: JwtPayload) {
    return this.findRoutes.findActiveRoutes(user.tenantId!);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get route by ID' })
  @ApiResponse({ status: 404, description: 'Route not found' })
  async findById(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.findRoutes.findById(id, user.tenantId!);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a route' })
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRouteDto,
  ) {
    return this.updateRoute.execute(id, user.tenantId!, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a route (must have no passengers)' })
  @ApiResponse({ status: 409, description: 'Route has assigned passengers' })
  async delete(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    await this.deleteRoute.execute(id, user.tenantId!);
  }
}
