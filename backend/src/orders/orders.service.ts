import { Injectable, NotFoundException, BadRequestException, Inject, ForbiddenException } from '@nestjs/common';
import { Seat } from '@prisma/client';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/order.dto';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('expiration') private expirationQueue: Queue,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) { }

  async create(createOrderDto: CreateOrderDto, ip?: string) {
    const { ticketId, quantity, customerEmail, seatIds } = createOrderDto;
    const EXPIRATION_WINDOW = 10 * 60 * 1000; // 10 minutes
    const expiresAt = new Date(Date.now() + EXPIRATION_WINDOW);

    // --- PHASE 1: REDIS INVENTORY CHECK (Hot-Key Protection) ---
    const cacheKey = `inventory:ticket:${ticketId}`;
    const cachedStock: number | undefined = await this.cacheManager.get(cacheKey);

    if (cachedStock !== undefined && cachedStock !== null) {
      if (cachedStock < quantity) {
        throw new BadRequestException('Tickets are sold out (Cached).');
      }
      // Optimistically decrement in cache
      await this.cacheManager.set(cacheKey, cachedStock - quantity, 0);
    }

    const orderResult = await this.prisma.$transaction(async (tx) => {
      // 1. Pre-check: Get ticket and check availability
      const ticket = await tx.ticket.findUnique({
        where: { id: ticketId },
        include: { event: true },
      });

      if (!ticket) {
        throw new NotFoundException(`Ticket with ID ${ticketId} not found`);
      }

      // --- PHASE 2: CLOCK SKEW & SALE START PROTECTION ---
      const now = new Date();
      const diff = ticket.event.startTime.getTime() - now.getTime();

      if (diff > 0) {
        if (diff <= 2000) {
          await new Promise((resolve) => setTimeout(resolve, diff));
        } else {
          throw new ForbiddenException(
            `Sale has not started yet. Starts at: ${ticket.event.startTime.toISOString()}`,
          );
        }
      }

      if (ticket.remainingQuantity < quantity) {
        throw new BadRequestException(
          `Not enough tickets available. Requested: ${quantity}, Available: ${ticket.remainingQuantity}`,
        );
      }

      // --- PHASE 3: SEAT ALLOCATION & SOCIAL DISTANCING (Anti-Orphan) ---
      let finalizedSeatIds = seatIds || [];
      if (finalizedSeatIds.length === 0) {
        finalizedSeatIds = await this.autoAllocateSeats(tx, ticket.eventId, quantity);
      } else {
        // Validate user-selected seats
        const seats = await tx.eventSeat.findMany({
          where: {
            id: { in: finalizedSeatIds },
            eventId: ticket.eventId,
            status: 'AVAILABLE',
          },
        });

        if (seats.length !== quantity) {
          throw new BadRequestException('One or more selected seats are unavailable or do not exist');
        }
      }

      // 2. ATOMIC UPDATE: Decrease quantity
      await tx.ticket.update({
        where: {
          id: ticketId,
          remainingQuantity: { gte: quantity },
        },
        data: {
          remainingQuantity: {
            decrement: quantity,
          },
        },
      });

      // 3. Create Order
      const totalPrice = Number(ticket.price) * quantity;
      const order = await tx.order.create({
        data: {
          ticketId,
          quantity,
          customerEmail,
          totalPrice,
          status: 'PENDING',
          expiresAt,
          eventSeats: {
            connect: finalizedSeatIds.map((id) => ({ id })),
          },
        },
        include: { eventSeats: true },
      });

      // 4. Mark Seats as RESERVED (pending payment)
      await tx.eventSeat.updateMany({
        where: { id: { in: finalizedSeatIds } },
        data: {
          status: 'RESERVED',
          orderId: order.id
        },
      });

      return order;
    });

    // 5. Schedule Expiration Job (out of transaction)
    await this.expirationQueue.add(
      'expire-order',
      { orderId: orderResult.id },
      { delay: 10 * 60 * 1000 },
    );

    // 6. Update Scalper Protection Counter
    if (ip) {
      const scalperKey = `scalper_check:${ip}:${ticketId}`;
      const currentCount: number = (await this.cacheManager.get(scalperKey)) || 0;
      await this.cacheManager.set(scalperKey, currentCount + quantity, 3600 * 1000); // 1 hour window
    }

    return orderResult;
  }

  private async autoAllocateSeats(tx: any, eventId: string, quantity: number): Promise<string[]> {
    const availableSeats = await tx.eventSeat.findMany({
      where: { eventId, status: 'AVAILABLE' },
      include: { seat: true },
      orderBy: [{ seat: { row: 'asc' } }, { seat: { number: 'asc' } }],
    });

    if (availableSeats.length < quantity) {
      throw new BadRequestException('Not enough seats available for this event.');
    }

    // Group seats by row
    const seatsByRow: Record<string, any[]> = {};
    for (const eventSeat of availableSeats) {
      if (!seatsByRow[eventSeat.seat.row]) seatsByRow[eventSeat.seat.row] = [];
      seatsByRow[eventSeat.seat.row].push(eventSeat);
    }

    for (const row in seatsByRow) {
      const rowSeats = seatsByRow[row];
      if (rowSeats.length < quantity) continue;

      // Find contiguous block
      for (let i = 0; i <= rowSeats.length - quantity; i++) {
        const candidateBlock = rowSeats.slice(i, i + quantity);
        let isContiguous = true;

        for (let j = 0; j < quantity - 1; j++) {
          const currentNum = parseInt(candidateBlock[j].seat.number);
          const nextNum = parseInt(candidateBlock[j + 1].seat.number);
          if (nextNum !== currentNum + 1) {
            isContiguous = false;
            break;
          }
        }

        if (isContiguous) {
          // --- ANTI-ORPHAN CHECK (Feature 6) ---
          // Ensure we don't leave exactly ONE seat empty on either side
          const leftNeighborIdx = i - 1;
          const rightNeighborIdx = i + quantity;

          // Check Left Orphan
          if (leftNeighborIdx === 0) {
            // If we are taking seats starting from index 1, index 0 is left alone.
            continue;
          }

          // Check Right Orphan
          if (rightNeighborIdx === rowSeats.length - 1) {
            // If we leave exactly one seat at the end of the row
            continue;
          }

          return candidateBlock.map((s: any) => s.id);
        }
      }
    }

    // Fallback: If no contiguous block found, just take any available seats (Fragmented)
    return availableSeats.slice(0, quantity).map((s: any) => s.id);
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
