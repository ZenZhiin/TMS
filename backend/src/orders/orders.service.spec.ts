import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';

const mockPrisma = {
  $transaction: jest.fn(),
  ticket: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  order: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
  seat: {
    findMany: jest.fn(),
    updateMany: jest.fn(),
  },
};

describe('OrdersService', () => {
  let service: OrdersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw BadRequestException if not enough tickets', async () => {
      const dto = { ticketId: 't1', quantity: 10, customerEmail: 'c@e.com' };
      
      mockPrisma.$transaction.mockImplementation(async (cb) => {
        return cb(mockPrisma);
      });

      mockPrisma.ticket.findUnique.mockResolvedValue({ id: 't1', remainingQuantity: 5 });

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('should create an order successfully', async () => {
      const dto = { ticketId: 't1', quantity: 2, customerEmail: 'c@e.com' };
      
      mockPrisma.$transaction.mockImplementation(async (cb) => {
        return cb(mockPrisma);
      });

      mockPrisma.ticket.findUnique.mockResolvedValue({ id: 't1', remainingQuantity: 10, price: 100 });
      mockPrisma.ticket.update.mockResolvedValue({ id: 't1', remainingQuantity: 8 });
      mockPrisma.order.create.mockResolvedValue({ id: 'o1', ...dto, totalPrice: 200 });

      const result = await service.create(dto);
      expect(result.id).toEqual('o1');
      expect(mockPrisma.order.create).toHaveBeenCalled();
    });
  });
});
