import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { USER_REPOSITORY, UserRepositoryPort } from '../../domain/repositories/user.repository.port';
import { PASSWORD_SERVICE, PasswordServicePort } from '../../domain/services/password.service.port';
import { TENANT_REPOSITORY, TenantRepositoryPort } from '../../../tenants/domain/repositories/tenant.repository.port';
import { Role, User } from '../../domain/entities/user.entity';
import { UnauthorizedError } from '../../../../shared/domain/errors/unauthorized.error';

export interface AdminLoginDto { email: string; password: string; }

@Injectable()
export class AdminLoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepositoryPort,
    @Inject(PASSWORD_SERVICE) private readonly passwordService: PasswordServicePort,
    @Inject(TENANT_REPOSITORY) private readonly tenantRepo: TenantRepositoryPort,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async execute(dto: AdminLoginDto) {
    const envEmail = this.configService.get<string>('SUPERADMIN_EMAIL');
    const envPass = this.configService.get<string>('SUPERADMIN_PASSWORD');

    let user: User | null = null;

    // Check if credentials match .env
    if (envEmail && envPass && dto.email === envEmail && dto.password === envPass) {
      // Find or create the super admin in DB to have a valid ID
      user = await this.userRepo.findByEmailGlobal(dto.email);
      if (!user) {
        const passwordHash = await this.passwordService.hash(dto.password);
        user = User.create({
          nombre: 'Super Admin (System)',
          email: dto.email,
          passwordHash,
          role: Role.SUPER_ADMIN,
          tenantId: null,
        });
        user = await this.userRepo.save(user);
      }
    } else {
      // Normal flow: check DB
      user = await this.userRepo.findByEmailGlobal(dto.email);
      if (!user || user.role !== Role.SUPER_ADMIN) throw new UnauthorizedError('Credenciales inválidas');
      
      const valid = await this.passwordService.compare(dto.password, user.passwordHash);
      if (!valid) throw new UnauthorizedError('Credenciales inválidas');
    }

    if (!user.isActive()) throw new UnauthorizedError('Cuenta desactivada');

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: null,
    });

    const { items: tenants } = await this.tenantRepo.findAll(1, 1000);

    return {
      accessToken: token,
      expiresIn: '24h',
      user: { id: user.id, nombre: user.nombre, email: user.email, role: user.role, tenantId: null, tenantLogo: null },
      tenants: tenants.map(t => ({ id: t.id, nombre: t.nombre, nit: t.nit, ciudad: t.ciudad, estado: t.estado })),
    };
  }
}
