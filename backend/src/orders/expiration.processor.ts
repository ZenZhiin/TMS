import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { Logger } from '@nestjs/common';

@Processor('expiration')
export class ExpirationProcessor extends WorkerHost {
  private readonly logger = new Logger(ExpirationProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    super();
  }

  async process(job: Job<{ orderId: string }>): Promise<void> {
    const { orderId } = job.data;
    this.logger.log(`Checking expiration for order ${orderId}`);

    await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { seats: true },
      });

      if (!order || order.status !== 'PENDING') {
        this.logger.log(`Order ${orderId} is no longer pending or doesn't exist. Skipping expiration.`);
        return;
      }

      this.logger.warn(`Order ${orderId} has expired. Reverting stock and seats.`);

      // 1. Mark order as CANCELLED
      await tx.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED' },
      });

      // 2. Restore Ticket Stock
      await tx.ticket.update({
        where: { id: order.ticketId },
        data: {
          remainingQuantity: {
            increment: order.quantity,
          },
        },
      });

      // 3. Free up Seats
      if (order.seats.length > 0) {
        await tx.seat.updateMany({
          where: { orderId },
          data: {
            status: 'AVAILABLE',
            orderId: null
          },
        });
      }

      // 4. Restore Redis Inventory Counter
      const cacheKey = `inventory:ticket:${order.ticketId}`;
      const cachedStock: number | undefined = await this.cacheManager.get(cacheKey);
      if (cachedStock !== undefined && cachedStock !== null) {
        await this.cacheManager.set(cacheKey, cachedStock + order.quantity, 0);
      }
    });
  }
}
