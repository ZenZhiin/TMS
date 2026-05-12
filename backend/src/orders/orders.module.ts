import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrdersProcessor } from './orders.processor';
import { ExpirationProcessor } from './expiration.processor';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'purchase' },
      { name: 'expiration' },
    ),
  ],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersProcessor, ExpirationProcessor],
})
export class OrdersModule {}
