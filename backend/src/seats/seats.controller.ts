import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SeatsService } from './seats.service';
import { CreateSeatDto, UpdateSeatDto } from './dto/seat.dto';

@ApiTags('seats')
@Controller('seats')
export class SeatsController {
  constructor(private readonly seatsService: SeatsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new seat in a venue' })
  create(@Body() createSeatDto: CreateSeatDto) {
    return this.seatsService.create(createSeatDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all seats (optionally filter by venueId)' })
  @ApiQuery({ name: 'venueId', required: false })
  findAll(@Query('venueId') venueId?: string) {
    return this.seatsService.findAll(venueId);
  }

  @Get('available/:venueId')
  @ApiOperation({ summary: 'Get all available seats for a venue' })
  findAvailable(@Param('venueId') venueId: string) {
    return this.seatsService.findAvailable(venueId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a seat by ID' })
  findOne(@Param('id') id: string) {
    return this.seatsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update seat status or order' })
  update(@Param('id') id: string, @Body() updateSeatDto: UpdateSeatDto) {
    return this.seatsService.update(id, updateSeatDto);
  }
}
