import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsUUID, IsOptional } from 'class-validator';
import { SeatStatus } from '@prisma/client';

export class CreateSeatDto {
  @ApiProperty({ example: 'A' })
  @IsString()
  @IsNotEmpty()
  row: string;

  @ApiProperty({ example: '12' })
  @IsString()
  @IsNotEmpty()
  number: string;

  @ApiProperty({ example: 'uuid-of-venue' })
  @IsUUID()
  venueId: string;
}

export class UpdateSeatDto {
  @ApiProperty({ enum: SeatStatus, required: false })
  @IsEnum(SeatStatus)
  @IsOptional()
  status?: SeatStatus;

  @ApiProperty({ example: 'uuid-of-order', required: false })
  @IsUUID()
  @IsOptional()
  orderId?: string;
}
