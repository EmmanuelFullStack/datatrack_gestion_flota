import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator';
import { Role } from '../../domain/entities/user.entity';
import { PlanSuscripcion } from '../../../tenants/domain/entities/tenant.entity';

export class RegisterDto {
  // User info
  @ApiProperty({ example: 'Carlos Gómez' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nombre: string;

  @ApiProperty({ example: 'admin@empresa.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password: string;

  // Tenant info (creates new tenant + first admin)
  @ApiProperty({ example: 'Transportes Bogotá S.A.S' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  empresaNombre: string;

  @ApiProperty({ example: '900123456-1' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  empresaNit: string;

  @ApiProperty({ example: 'Bogotá' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  empresaCiudad: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  empresaLogoUrl?: string;

  @ApiPropertyOptional({ enum: PlanSuscripcion, default: PlanSuscripcion.BASICO })
  @IsOptional()
  @IsEnum(PlanSuscripcion)
  planSuscripcion?: PlanSuscripcion;
}
