import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/order.dto';
import { WaitingRoomGuard } from '../common/guards/waiting-room.guard';
import { IdempotencyInterceptor } from '../common/interceptors/idempotency.interceptor';

@ApiTags('orders')
@Controller('orders')
@UseGuards(WaitingRoomGuard)
@UseInterceptors(IdempotencyInterceptor)
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    @InjectQueue('purchase') private readonly purchaseQueue: Queue,
  ) { }

  @Post()
  @ApiOperation({ summary: 'Purchase tickets (Synchronous - for normal load)' })
  @ApiResponse({ status: 201, description: 'The order has been successfully created.' })
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }

  @Post('async-purchase')
  @ApiOperation({ summary: 'Purchase tickets (Asynchronous - for high load)' })
  @ApiResponse({ status: 202, description: 'The order has been queued for processing.' })
  async createAsync(@Body() createOrderDto: CreateOrderDto) {
    const job = await this.purchaseQueue.add('purchase-job', createOrderDto, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    });
    return {
      message: 'Your order is being processed. Please check back shortly.',
      jobId: job.id,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all orders' })
  findAll() {
    return this.ordersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an order by ID' })
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }
}
