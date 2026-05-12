import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { VenuesModule } from './venues/venues.module';
import { EventsModule } from './events/events.module';
import { TicketsModule } from './tickets/tickets.module';
import { OrdersModule } from './orders/orders.module';
import { SeatsModule } from './seats/seats.module';

@Module({
  imports: [PrismaModule, VenuesModule, EventsModule, TicketsModule, OrdersModule, SeatsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
