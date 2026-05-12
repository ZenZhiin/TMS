import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, Min } from 'class-validator';

export class CreateVenueDto {
  @ApiProperty({ example: 'Stadium Bukit Jalil' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Kuala Lumpur, Malaysia' })
  @IsString()
  address: string;

  @ApiProperty({ example: 80000 })
  @IsInt()
  @Min(1)
  capacity: number;
}

export class UpdateVenueDto {
  @ApiProperty({ example: 'Stadium Bukit Jalil', required: false })
  @IsString()
  name?: string;

  @ApiProperty({ example: 'Kuala Lumpur, Malaysia', required: false })
  @IsString()
  address?: string;

  @ApiProperty({ example: 85000, required: false })
  @IsInt()
  @Min(1)
  capacity?: number;
}
