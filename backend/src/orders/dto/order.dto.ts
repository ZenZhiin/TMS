import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min, IsUUID, IsEmail } from 'class-validator';

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
}
