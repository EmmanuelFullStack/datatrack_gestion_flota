import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { OrmUser } from './infrastructure/persistence/orm-user.entity';
import { UserRepository } from './infrastructure/persistence/user.repository';
import { USER_REPOSITORY } from './domain/repositories/user.repository.port';
import { PASSWORD_SERVICE } from './domain/services/password.service.port';
import { BcryptPasswordService } from './infrastructure/services/bcrypt-password.service';
import { JwtStrategy } from './infrastructure/jwt/jwt.strategy';
import { JwtAuthGuard } from './infrastructure/jwt/jwt-auth.guard';
import { RolesGuard } from './infrastructure/jwt/roles.guard';
import { AuthController } from './infrastructure/http/auth.controller';
import { RegisterUseCase } from './application/use-cases/register.use-case';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { GetProfileUseCase } from './application/use-cases/get-profile.use-case';
import { AdminLoginUseCase } from './application/use-cases/admin-login.use-case';
import { SelectTenantUseCase } from './application/use-cases/select-tenant.use-case';
import { BootstrapSuperAdminUseCase } from './application/use-cases/bootstrap-super-admin.use-case';
import { TenantsModule } from '../tenants/tenants.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([OrmUser]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwt.secret'),
        signOptions: { expiresIn: config.get<string>('jwt.expiresIn') },
      }),
    }),
    TenantsModule,
  ],
  controllers: [AuthController],
  providers: [
    { provide: USER_REPOSITORY, useClass: UserRepository },
    { provide: PASSWORD_SERVICE, useClass: BcryptPasswordService },
    JwtStrategy,
    JwtAuthGuard,
    RolesGuard,
    RegisterUseCase,
    LoginUseCase,
    GetProfileUseCase,
    AdminLoginUseCase,
    SelectTenantUseCase,
    BootstrapSuperAdminUseCase,
  ],
  exports: [JwtModule, JwtAuthGuard, RolesGuard, USER_REPOSITORY],
})
export class AuthModule {}
