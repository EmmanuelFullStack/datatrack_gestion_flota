import { ApiProperty } from '@nestjs/swagger';

export class GpsPositionResponseDto {
  @ApiProperty()
  lat: number;

  @ApiProperty()
  lon: number;

  @ApiProperty()
  speed: number;

  @ApiProperty()
  heading: number;

  @ApiProperty()
  satellites: number;

  @ApiProperty()
  timestamp: string;
}

export class DatatrackUnitResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty({ type: GpsPositionResponseDto, nullable: true })
  position: GpsPositionResponseDto | null;
}

export class AlarmPositionResponseDto {
  @ApiProperty({ required: false })
  passengerId?: string;

  @ApiProperty({ required: false })
  nombre?: string;

  @ApiProperty()
  deviceId: string;

  @ApiProperty()
  lat: number;

  @ApiProperty()
  lon: number;

  @ApiProperty()
  speed: number;

  @ApiProperty()
  timestamp: string;

  @ApiProperty()
  reason: string;
}
