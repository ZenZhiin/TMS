import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsDateString, IsUUID, IsOptional } from 'class-validator';

export class CreateEventDto {
  @ApiProperty({ example: 'Coldplay Concert 2026' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'A night of music and lights', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: '2026-05-12T20:00:00Z' })
  @IsDateString()
  startTime: string;

  @ApiProperty({ example: 'uuid-of-venue' })
  @IsUUID()
  venueId: string;
}

export class UpdateEventDto {
  @ApiProperty({ example: 'Coldplay Concert 2026', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'Updated description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: '2026-05-12T21:00:00Z', required: false })
  @IsDateString()
  @IsOptional()
  startTime?: string;

  @ApiProperty({ example: 'uuid-of-venue', required: false })
  @IsUUID()
  @IsOptional()
  venueId?: string;
}
