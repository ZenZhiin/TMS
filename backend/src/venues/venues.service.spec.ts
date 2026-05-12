import { Test, TestingModule } from '@nestjs/testing';
import { VenuesService } from './venues.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  venue: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe('VenuesService', () => {
  let service: VenuesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VenuesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<VenuesService>(VenuesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a venue', async () => {
      const dto = { name: 'Venue 1', address: 'Addr 1', capacity: 100 };
      mockPrisma.venue.create.mockResolvedValue({ id: '1', ...dto });

      const result = await service.create(dto);
      expect(result).toEqual({ id: '1', ...dto });
      expect(mockPrisma.venue.create).toHaveBeenCalledWith({ data: dto });
    });
  });

  describe('findAll', () => {
    it('should return all venues', async () => {
      mockPrisma.venue.findMany.mockResolvedValue([{ id: '1', name: 'V1' }]);
      const result = await service.findAll();
      expect(result).toEqual([{ id: '1', name: 'V1' }]);
    });
  });
});
