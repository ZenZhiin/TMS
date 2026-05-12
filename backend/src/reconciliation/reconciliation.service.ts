import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReconciliationService {
  private readonly logger = new Logger(ReconciliationService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) { }

  /**
   * Runs every hour to ensure data consistency between Orders, Tickets, and Redis Cache.
   * This is the "Safety Net" for distributed transactions and partial failures.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async reconcileInventory() {
    this.logger.log('Starting Inventory Reconciliation Process...');

    try {
      const tickets = await this.prisma.ticket.findMany();

      for (const ticket of tickets) {
        // 1. Calculate Expected Remaining Quantity based on valid orders
        // Only count COMPLETED and PENDING orders (PENDING are temporary reservations)
        const totalSold = await this.prisma.order.aggregate({
          where: {
            ticketId: ticket.id,
            status: { in: ['COMPLETED', 'PENDING'] },
          },
          _sum: {
            quantity: true,
          },
        });

        const soldCount = totalSold._sum.quantity || 0;
        const expectedRemaining = ticket.initialQuantity - soldCount;

        // 2. Check for Database Discrepancy
        if (ticket.remainingQuantity !== expectedRemaining) {
          this.logger.warn(
            `Mismatch found for Ticket ${ticket.id} in DB! Current: ${ticket.remainingQuantity}, Expected: ${expectedRemaining}. Fixing...`,
          );

          await this.prisma.ticket.update({
            where: { id: ticket.id },
            data: { remainingQuantity: expectedRemaining },
          });
        }

        // 3. Check for Redis Cache Discrepancy
        const cacheKey = `inventory:ticket:${ticket.id}`;
        const cachedStock: number | undefined = await this.cacheManager.get(cacheKey);

        if (cachedStock !== undefined && cachedStock !== null && cachedStock !== expectedRemaining) {
          this.logger.warn(
            `Mismatch found for Ticket ${ticket.id} in Redis! Cached: ${cachedStock}, Expected: ${expectedRemaining}. Fixing...`,
          );
          await this.cacheManager.set(cacheKey, expectedRemaining, 0);
        }
      }

      this.logger.log('Inventory Reconciliation completed successfully.');
    } catch (error) {
      this.logger.error(`Inventory Reconciliation failed: ${error.message}`);
    }
  }
}
