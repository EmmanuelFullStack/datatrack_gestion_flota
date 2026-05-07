import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { PassengerEstado } from '../../domain/entities/passenger.entity';

export class UpdatePassengerDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  nombre?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  documento?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefono?: string;

  @ApiPropertyOptional({ enum: PassengerEstado })
  @IsOptional()
  @IsEnum(PassengerEstado)
  estado?: PassengerEstado;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  deviceIdDatatrack?: string;

  @ApiPropertyOptional({ description: 'Datatrack unit name/plate for display' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  deviceNameDatatrack?: string;
}
