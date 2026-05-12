import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto, UpdateEventDto } from './dto/event.dto';

@Injectable()
export class EventsService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('refund') private readonly refundQueue: Queue,
  ) {}

  async create(createEventDto: CreateEventDto) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Create the Event
      const event = await tx.event.create({
        data: {
          name: createEventDto.name,
          description: createEventDto.description,
          startTime: new Date(createEventDto.startTime),
          venueId: createEventDto.venueId,
        },
      });

      // 2. Initialize EventSeats from Venue Seats
      const venueSeats = await tx.seat.findMany({
        where: { venueId: createEventDto.venueId },
      });

      if (venueSeats.length > 0) {
        await tx.eventSeat.createMany({
          data: venueSeats.map((s) => ({
            eventId: event.id,
            seatId: s.id,
            status: 'AVAILABLE',
          })),
        });
      }

      return event;
    });
  }

  async findAll() {
    return this.prisma.event.findMany({
      include: { venue: true },
    });
  }

  async findOne(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: { venue: true, tickets: true },
    });
    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }
    return event;
  }

  async update(id: string, updateEventDto: UpdateEventDto) {
    await this.findOne(id);
    return this.prisma.event.update({
      where: { id },
      data: {
        ...updateEventDto,
        startTime: updateEventDto.startTime ? new Date(updateEventDto.startTime) : undefined,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.event.delete({
      where: { id },
    });
  }

  async cancel(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: { tickets: { include: { orders: true } } },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    // 1. Mark Event as CANCELLED in DB
    await this.prisma.event.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    // 2. Collect all orders for this event
    const orders = event.tickets.flatMap((t) => t.orders);

    // 3. Queue each order for refund processing
    for (const order of orders) {
      await this.refundQueue.add('process-refund', { orderId: order.id }, {
        attempts: 5,
        backoff: { type: 'exponential', delay: 2000 },
      });
    }

    return {
      message: `Event ${id} cancelled. ${orders.length} orders have been queued for refund.`,
    };
  }
}
