import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrdersProcessor } from './orders.processor';
import { ExpirationProcessor } from './expiration.processor';
import { RefundProcessor } from './refund.processor';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'purchase' },
      { name: 'expiration' },
      { name: 'refund' },
    ),
  ],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersProcessor, ExpirationProcessor, RefundProcessor],
})
export class OrdersModule { }
