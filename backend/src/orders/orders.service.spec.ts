import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
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

const mockQueue = {
  add: jest.fn(),
};

const mockCache = {
  get: jest.fn(),
  set: jest.fn(),
};

describe('OrdersService', () => {
  let service: OrdersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: getQueueToken('expiration'), useValue: mockQueue },
        { provide: CACHE_MANAGER, useValue: mockCache },
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

      mockPrisma.ticket.findUnique.mockResolvedValue({ 
        id: 't1', 
        remainingQuantity: 5,
        event: { startTime: new Date() }
      });

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('should create an order successfully', async () => {
      const dto = { ticketId: 't1', quantity: 2, customerEmail: 'c@e.com' };
      
      mockPrisma.$transaction.mockImplementation(async (cb) => {
        return cb(mockPrisma);
      });

      mockPrisma.ticket.findUnique.mockResolvedValue({ 
        id: 't1', 
        remainingQuantity: 10, 
        price: 100,
        event: { startTime: new Date() }
      });
      mockPrisma.ticket.update.mockResolvedValue({ id: 't1', remainingQuantity: 8 });
      mockPrisma.order.create.mockResolvedValue({ id: 'o1', ...dto, totalPrice: 200 });
      mockPrisma.seat.findMany.mockResolvedValue([
        { id: 's1', row: 'A', number: '1', status: 'AVAILABLE' },
        { id: 's2', row: 'A', number: '2', status: 'AVAILABLE' },
        { id: 's3', row: 'A', number: '3', status: 'AVAILABLE' },
      ]);
      mockPrisma.seat.updateMany.mockResolvedValue({ count: 2 });

      const result = await service.create(dto);
      expect(result.id).toEqual('o1');
      expect(mockPrisma.order.create).toHaveBeenCalled();
    });
  });
});
