import { Injectable, NotFoundException, BadRequestException, Inject, ForbiddenException } from '@nestjs/common';
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
          // If within 2 seconds, "hold" the request until the sale starts
          // This handles minor clock skew and provides better UX
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
          status: 'PENDING',
          expiresAt,
          seats: seatIds ? {
            connect: seatIds.map(id => ({ id }))
          } : undefined,
        },
        include: { seats: true },
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
