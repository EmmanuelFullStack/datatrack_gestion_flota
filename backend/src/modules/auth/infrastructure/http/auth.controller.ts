import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { RegisterUseCase } from '../../application/use-cases/register.use-case';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { GetProfileUseCase } from '../../application/use-cases/get-profile.use-case';
import { AdminLoginUseCase } from '../../application/use-cases/admin-login.use-case';
import { SelectTenantUseCase } from '../../application/use-cases/select-tenant.use-case';
import { BootstrapSuperAdminUseCase } from '../../application/use-cases/bootstrap-super-admin.use-case';
import { RegisterDto } from '../../application/dtos/register.dto';
import { LoginDto } from '../../application/dtos/login.dto';
import { AdminLoginDto } from '../../application/dtos/admin-login.dto';
import { BootstrapSuperAdminDto } from '../../application/dtos/bootstrap-super-admin.dto';
import { AuthResponseDto } from '../../application/dtos/auth-response.dto';
import { JwtAuthGuard } from '../jwt/jwt-auth.guard';
import { RolesGuard } from '../jwt/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { Public } from '../decorators/public.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { JwtPayload } from '../jwt/jwt.strategy';
import { Role } from '../../domain/entities/user.entity';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly getProfileUseCase: GetProfileUseCase,
    private readonly adminLoginUseCase: AdminLoginUseCase,
    private readonly selectTenantUseCase: SelectTenantUseCase,
    private readonly bootstrapSuperAdminUseCase: BootstrapSuperAdminUseCase,
  ) {}

  @Post('register')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Register a new company and admin user' })
  @ApiResponse({ status: 201, description: 'Registered successfully', type: AuthResponseDto })
  @ApiResponse({ status: 409, description: 'NIT already registered' })
  async register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    return this.registerUseCase.execute(dto);
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Login with tenant NIT + credentials' })
  @ApiResponse({ status: 200, description: 'Login successful', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.loginUseCase.execute(dto);
  }

  @Post('admin/login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Super admin login — returns all tenants list' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials or not a super admin' })
  async adminLogin(@Body() dto: AdminLoginDto) {
    return this.adminLoginUseCase.execute(dto);
  }

  @Post('admin/select-tenant/:tenantId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Super admin selects a tenant to operate in' })
  @ApiResponse({ status: 200, description: 'Scoped token issued' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async selectTenant(@CurrentUser() user: JwtPayload, @Param('tenantId') tenantId: string) {
    return this.selectTenantUseCase.execute(user.sub, user.email, tenantId);
  }

  @Post('admin/bootstrap')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @ApiOperation({ summary: 'One-time super admin creation (requires SUPERADMIN_SECRET)' })
  @ApiResponse({ status: 201, description: 'Super admin created' })
  @ApiResponse({ status: 401, description: 'Invalid secret' })
  @ApiResponse({ status: 409, description: 'Super admin already exists' })
  async bootstrap(@Body() dto: BootstrapSuperAdminDto) {
    await this.bootstrapSuperAdminUseCase.execute(dto);
    return { message: 'Super admin created successfully' };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@CurrentUser() user: JwtPayload) {
    return this.getProfileUseCase.execute(user.sub, user.tenantId ?? '');
  }
}
