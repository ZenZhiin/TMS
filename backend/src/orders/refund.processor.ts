import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { Logger } from '@nestjs/common';

@Processor('refund', {
  concurrency: 10, // Process 10 refunds at a time to stay within Payment Gateway limits
})
export class RefundProcessor extends WorkerHost {
  private readonly logger = new Logger(RefundProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<{ orderId: string }>): Promise<void> {
    const { orderId } = job.data;
    
    try {
      this.logger.log(`Processing refund for order ${orderId}...`);

      // Simulate a delay to represent a Payment Gateway API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      await this.prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({
          where: { id: orderId },
        });

        if (!order || order.status === 'CANCELLED') {
          return;
        }

        // 1. Update Order Status
        await tx.order.update({
          where: { id: orderId },
          data: { status: 'CANCELLED' },
        });

        // 2. We don't restore stock here because the event is CANCELLED.
        // But we could free up seats if needed.
        await tx.eventSeat.updateMany({
          where: { orderId },
          data: { status: 'AVAILABLE', orderId: null },
        });
      });

      this.logger.log(`Refund successfully processed for order ${orderId}`);
    } catch (error) {
      this.logger.error(`Failed to process refund for order ${orderId}: ${error.message}`);
      throw error; // Let BullMQ retry
    }
  }
}
