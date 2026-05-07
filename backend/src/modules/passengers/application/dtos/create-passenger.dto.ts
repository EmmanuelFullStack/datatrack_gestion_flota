import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { PassengerEstado } from '../../domain/entities/passenger.entity';

export class CreatePassengerDto {
  @ApiProperty({ example: 'Juan Pérez' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nombre: string;

  @ApiProperty({ example: '1023456789' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  documento: string;

  @ApiPropertyOptional({ example: '+573001234567' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefono?: string;

  @ApiPropertyOptional({ description: 'Datatrack device/unit ID for GPS tracking' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  deviceIdDatatrack?: string;

  @ApiPropertyOptional({ description: 'Datatrack unit name/plate for display' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  deviceNameDatatrack?: string;

  @ApiPropertyOptional({ description: 'Assign to a route on creation' })
  @IsOptional()
  @IsUUID()
  routeId?: string;

  @ApiPropertyOptional({ enum: PassengerEstado, default: PassengerEstado.PENDIENTE })
  @IsOptional()
  @IsEnum(PassengerEstado)
  estado?: PassengerEstado;
}
