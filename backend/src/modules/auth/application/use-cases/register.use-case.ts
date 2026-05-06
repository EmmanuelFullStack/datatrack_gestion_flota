import { Inject, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User, Role } from '../../domain/entities/user.entity';
import { USER_REPOSITORY, UserRepositoryPort } from '../../domain/repositories/user.repository.port';
import { PASSWORD_SERVICE, PasswordServicePort } from '../../domain/services/password.service.port';
import { TENANT_REPOSITORY, TenantRepositoryPort } from '../../../tenants/domain/repositories/tenant.repository.port';
import { OrmTenant } from '../../../tenants/infrastructure/persistence/orm-tenant.entity';
import { OrmUser } from '../../infrastructure/persistence/orm-user.entity';
import { Tenant } from '../../../tenants/domain/entities/tenant.entity';
import { ConflictError } from '../../../../shared/domain/errors/conflict.error';
import { RegisterDto } from '../dtos/register.dto';
import { AuthResponseDto } from '../dtos/auth-response.dto';

@Injectable()
export class RegisterUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
    @Inject(TENANT_REPOSITORY)
    private readonly tenantRepository: TenantRepositoryPort,
    @Inject(PASSWORD_SERVICE)
    private readonly passwordService: PasswordServicePort,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async execute(dto: RegisterDto): Promise<AuthResponseDto> {
    const existingTenant = await this.tenantRepository.findByNit(dto.empresaNit);
    if (existingTenant) {
      throw new ConflictError(`A company with NIT '${dto.empresaNit}' is already registered`);
    }

    const passwordHash = await this.passwordService.hash(dto.password);

    // Wrap tenant + user creation in a single atomic transaction
    const { savedTenant, savedUser } = await this.dataSource.transaction(async (manager) => {
      const tenantDomain = Tenant.create({
        nombre: dto.empresaNombre,
        nit: dto.empresaNit,
        ciudad: dto.empresaCiudad,
        logoUrl: dto.empresaLogoUrl,
        planSuscripcion: dto.planSuscripcion,
      });

      const tenantOrm = manager.create(OrmTenant, {
        id: tenantDomain.id,
        nombre: tenantDomain.nombre,
        nit: tenantDomain.nit,
        ciudad: tenantDomain.ciudad,
        logoUrl: tenantDomain.logoUrl ?? null,
        planSuscripcion: tenantDomain.planSuscripcion,
        estado: tenantDomain.estado,
      });
      const savedTenantOrm = await manager.save(OrmTenant, tenantOrm);

      const userDomain = User.create({
        nombre: dto.nombre,
        email: dto.email,
        passwordHash,
        role: Role.TENANT_ADMIN,
        tenantId: savedTenantOrm.id,
      });

      const userOrm = manager.create(OrmUser, {
        id: userDomain.id,
        nombre: userDomain.nombre,
        email: userDomain.email,
        passwordHash: userDomain.passwordHash,
        role: userDomain.role,
        activo: userDomain.activo,
        tenantId: savedTenantOrm.id,
      });
      const savedUserOrm = await manager.save(OrmUser, userOrm);

      return {
        savedTenant: savedTenantOrm,
        savedUser: savedUserOrm,
      };
    });

    const expiresIn = this.configService.get<string>('jwt.expiresIn') ?? '24h';
    const accessToken = this.jwtService.sign(
      { sub: savedUser.id, tenantId: savedTenant.id, role: savedUser.role, email: savedUser.email },
      { expiresIn },
    );

    return {
      accessToken,
      expiresIn,
      user: {
        id: savedUser.id,
        nombre: savedUser.nombre,
        email: savedUser.email,
        role: savedUser.role,
        tenantId: savedTenant.id,
        tenantNombre: savedTenant.nombre,
        tenantLogo: savedTenant.logoUrl,
      },
    };
  }
}
