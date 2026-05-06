import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { USER_REPOSITORY, UserRepositoryPort } from '../../domain/repositories/user.repository.port';
import { PASSWORD_SERVICE, PasswordServicePort } from '../../domain/services/password.service.port';
import { Role, User } from '../../domain/entities/user.entity';
import { BootstrapSuperAdminDto } from '../dtos/bootstrap-super-admin.dto';
import { ConflictError } from '../../../../shared/domain/errors/conflict.error';
import { UnauthorizedError } from '../../../../shared/domain/errors/unauthorized.error';

@Injectable()
export class BootstrapSuperAdminUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepositoryPort,
    @Inject(PASSWORD_SERVICE) private readonly passwordService: PasswordServicePort,
    private readonly configService: ConfigService,
  ) {}

  async execute(dto: BootstrapSuperAdminDto): Promise<void> {
    const expected = this.configService.get<string>('SUPERADMIN_SECRET');
    if (!expected || dto.secret !== expected) throw new UnauthorizedError('Secret inválido');

    const exists = await this.userRepo.superAdminExists();
    if (exists) throw new ConflictError('Ya existe un super administrador');

    const passwordHash = await this.passwordService.hash(dto.password);
    const admin = User.create({
      nombre: dto.nombre,
      email:  dto.email,
      passwordHash,
      role:     Role.SUPER_ADMIN,
      tenantId: null,
    });

    await this.userRepo.save(admin);
  }
}
