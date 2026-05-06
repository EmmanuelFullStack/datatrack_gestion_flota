import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl, Matches, MaxLength } from 'class-validator';
import { PlanSuscripcion } from '../../domain/entities/tenant.entity';

export class CreateTenantDto {
  @ApiProperty({ description: 'Nombre de la empresa de transporte', example: 'Transportes Bogotá S.A.S' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nombre: string;

  @ApiProperty({ description: 'NIT de la empresa (sin dígito de verificación)', example: '900123456-1' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  nit: string;

  @ApiProperty({ description: 'Ciudad principal de operación', example: 'Bogotá' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  ciudad: string;

  @ApiPropertyOptional({ description: 'URL del logo de la empresa' })
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  logoUrl?: string;

  @ApiPropertyOptional({ enum: PlanSuscripcion, default: PlanSuscripcion.BASICO })
  @IsOptional()
  @IsEnum(PlanSuscripcion)
  planSuscripcion?: PlanSuscripcion;
}
