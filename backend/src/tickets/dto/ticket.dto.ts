import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsInt, Min, IsUUID, IsOptional } from 'class-validator';

export class CreateTicketDto {
  @ApiProperty({ example: 'VIP' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ example: 299.99 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 100 })
  @IsInt()
  @Min(1)
  initialQuantity: number;

  @ApiProperty({ example: 'uuid-of-event' })
  @IsUUID()
  eventId: string;
}

export class UpdateTicketDto {
  @ApiProperty({ example: 'VIP', required: false })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiProperty({ example: 349.99, required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  price?: number;

  @ApiProperty({ example: 150, required: false })
  @IsInt()
  @IsOptional()
  @Min(1)
  initialQuantity?: number;

  @ApiProperty({ example: 150, required: false })
  @IsInt()
  @IsOptional()
  @Min(0)
  remainingQuantity?: number;
}
