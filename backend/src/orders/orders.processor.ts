import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/order.dto';
import { Logger } from '@nestjs/common';

@Processor('purchase')
export class OrdersProcessor extends WorkerHost {
  private readonly logger = new Logger(OrdersProcessor.name);

  constructor(private readonly ordersService: OrdersService) {
    super();
  }

  async process(job: Job<CreateOrderDto & { ip?: string }, any, string>): Promise<any> {
    this.logger.log(`Processing purchase job ${job.id} for ${job.data.customerEmail}`);
    try {
      const { ip, ...dto } = job.data;
      const result = await this.ordersService.create(dto, ip);
      this.logger.log(`Purchase job ${job.id} completed successfully`);
      return result;
    } catch (error) {
      this.logger.error(`Purchase job ${job.id} failed: ${error.message}`);
      throw error;
    }
  }
}
