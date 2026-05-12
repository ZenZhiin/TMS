import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSeatDto, UpdateSeatDto } from './dto/seat.dto';

@Injectable()
export class SeatsService {
  constructor(private prisma: PrismaService) {}

  async create(createSeatDto: CreateSeatDto) {
    return this.prisma.seat.create({
      data: createSeatDto,
    });
  }

  async findAll(venueId?: string) {
    return this.prisma.seat.findMany({
      where: venueId ? { venueId } : {},
      include: { venue: true, order: true },
    });
  }

  async findOne(id: string) {
    const seat = await this.prisma.seat.findUnique({
      where: { id },
      include: { venue: true, order: true },
    });
    if (!seat) {
      throw new NotFoundException(`Seat with ID ${id} not found`);
    }
    return seat;
  }

  async update(id: string, updateSeatDto: UpdateSeatDto) {
    await this.findOne(id);
    return this.prisma.seat.update({
      where: { id },
      data: updateSeatDto,
    });
  }

  async findAvailable(venueId: string) {
    return this.prisma.seat.findMany({
      where: {
        venueId,
        status: 'AVAILABLE',
      },
    });
  }
}
