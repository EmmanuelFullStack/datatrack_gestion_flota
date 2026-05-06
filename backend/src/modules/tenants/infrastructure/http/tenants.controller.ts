import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../../auth/infrastructure/decorators/current-user.decorator';
import { JwtPayload } from '../../../auth/infrastructure/jwt/jwt.strategy';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateTenantUseCase } from '../../application/use-cases/create-tenant.use-case';
import { FindTenantUseCase } from '../../application/use-cases/find-tenant.use-case';
import { UpdateTenantUseCase } from '../../application/use-cases/update-tenant.use-case';
import { CreateTenantDto } from '../../application/dtos/create-tenant.dto';
import { UpdateTenantDto } from '../../application/dtos/update-tenant.dto';
import { JwtAuthGuard } from '../../../auth/infrastructure/jwt/jwt-auth.guard';
import { RolesGuard } from '../../../auth/infrastructure/jwt/roles.guard';
import { Roles } from '../../../auth/infrastructure/decorators/roles.decorator';
import { Role } from '../../../auth/domain/entities/user.entity';

@ApiTags('Tenants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tenants')
export class TenantsController {
  constructor(
    private readonly createTenant: CreateTenantUseCase,
    private readonly findTenant: FindTenantUseCase,
    private readonly updateTenant: UpdateTenantUseCase,
  ) {}

  @Post()
  @Roles(Role.SUPER_ADMIN) // Only super admins can create new tenants usually
  @ApiOperation({ summary: 'Register a new transport company (tenant)' })
  @ApiResponse({ status: 201, description: 'Tenant created successfully' })
  @ApiResponse({ status: 409, description: 'NIT already exists' })
  async create(@Body() dto: CreateTenantDto): Promise<any> {
    return this.createTenant.execute(dto);
  }

  @Get()
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'List all tenants (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @Query('page', ParseIntPipe) page = 1,
    @Query('limit', ParseIntPipe) limit = 20,
  ): Promise<{ items: any[]; total: number }> {
    return this.findTenant.findAll(page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tenant by ID' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async findById(@Param('id', ParseUUIDPipe) id: string): Promise<any> {
    return this.findTenant.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update tenant information' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTenantDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<any> {
    // Security: Non-super admins can only edit their own tenant
    if (user.role !== Role.SUPER_ADMIN && user.tenantId !== id) {
      throw new ForbiddenException('No tienes permiso para editar esta empresa');
    }

    // Security: Only super admin can change the plan
    if (user.role !== Role.SUPER_ADMIN && dto.planSuscripcion) {
      delete dto.planSuscripcion;
    }

    return this.updateTenant.execute(id, dto);
  }

  @Patch(':id/toggle-status')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Toggle tenant active/inactive status' })
  async toggleStatus(@Param('id', ParseUUIDPipe) id: string): Promise<any> {
    return this.updateTenant.toggleStatus(id);
  }
}
