import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min, IsUUID, IsEmail, IsOptional } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({ example: 'uuid-of-ticket' })
  @IsUUID()
  ticketId: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 'customer@example.com' })
  @IsEmail()
  customerEmail: string;

  @ApiProperty({ example: ['uuid-of-seat-1', 'uuid-of-seat-2'], required: false })
  @IsOptional()
  @IsUUID(undefined, { each: true })
  seatIds?: string[];
}
