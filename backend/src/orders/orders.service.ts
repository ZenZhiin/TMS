import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/order.dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(createOrderDto: CreateOrderDto) {
    const { ticketId, quantity, customerEmail } = createOrderDto;

    return this.prisma.$transaction(async (tx) => {
      // 1. Get ticket and check availability
      const ticket = await tx.ticket.findUnique({
        where: { id: ticketId },
      });

      if (!ticket) {
        throw new NotFoundException(`Ticket with ID ${ticketId} not found`);
      }

      if (ticket.remainingQuantity < quantity) {
        throw new BadRequestException(
          `Not enough tickets available. Requested: ${quantity}, Available: ${ticket.remainingQuantity}`,
        );
      }

      // 2. Update ticket remaining quantity
      const updatedTicket = await tx.ticket.update({
        where: { id: ticketId },
        data: {
          remainingQuantity: {
            decrement: quantity,
          },
        },
      });

      // 3. Create the order
      const totalPrice = Number(ticket.price) * quantity;
      
      const order = await tx.order.create({
        data: {
          ticketId,
          quantity,
          customerEmail,
          totalPrice,
          status: 'COMPLETED', // Auto-complete for now in this simplified flow
        },
      });

      return {
        ...order,
        ticket: updatedTicket,
      };
    });
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
