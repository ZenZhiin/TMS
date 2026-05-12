import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/order.dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) { }

  async create(createOrderDto: CreateOrderDto) {
    const { ticketId, quantity, customerEmail, seatIds } = createOrderDto;

    return this.prisma.$transaction(async (tx) => {
      // 1. Pre-check: Get ticket and check availability
      const ticket = await tx.ticket.findUnique({
        where: { id: ticketId },
        include: { event: true },
      });

      if (!ticket) {
        throw new NotFoundException(`Ticket with ID ${ticketId} not found`);
      }

      if (ticket.remainingQuantity < quantity) {
        throw new BadRequestException(
          `Not enough tickets available. Requested: ${quantity}, Available: ${ticket.remainingQuantity}`,
        );
      }

      // 2. Handle Seat Reservations if provided
      if (seatIds && seatIds.length > 0) {
        if (seatIds.length !== quantity) {
          throw new BadRequestException(
            `Seat selection count (${seatIds.length}) must match order quantity (${quantity})`,
          );
        }

        const seats = await tx.seat.findMany({
          where: {
            id: { in: seatIds },
            venueId: ticket.event.venueId,
            status: 'AVAILABLE', // Ensure we only find available seats
          },
        });

        if (seats.length !== seatIds.length) {
          throw new BadRequestException('One or more selected seats are unavailable or do not exist');
        }

        // Mark seats as sold
        await tx.seat.updateMany({
          where: { id: { in: seatIds } },
          data: { status: 'SOLD' },
        });
      }

      // 3. ATOMIC UPDATE: Decrease quantity only if still sufficient
      // This is critical for ACID compliance in high-concurrency environments
      let updatedTicket;
      try {
        updatedTicket = await tx.ticket.update({
          where: { 
            id: ticketId,
            remainingQuantity: { gte: quantity }, // Atomic check at the DB level
          },
          data: {
            remainingQuantity: {
              decrement: quantity,
            },
          },
        });
      } catch (error) {
        // If the 'where' condition fails (remainingQuantity < quantity), Prisma throws an error
        throw new BadRequestException(
          'Tickets were sold out by another user. Please try again.',
        );
      }

      // 4. Create the order
      const totalPrice = Number(ticket.price) * quantity;

      const order = await tx.order.create({
        data: {
          ticketId,
          quantity,
          customerEmail,
          totalPrice,
          status: 'COMPLETED',
          seats: seatIds ? {
            connect: seatIds.map(id => ({ id }))
          } : undefined,
        },
        include: { seats: true },
      });

      return {
        ...order,
        ticket: updatedTicket,
      };
    });
  }

  async findAll() {
    return this.prisma.order.findMany({
      include: { ticket: { include: { event: true } } },
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { ticket: { include: { event: true } } },
    });
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
    return order;
  }
}
