import { Test, TestingModule } from '@nestjs/testing';
import { VenuesController } from './venues.controller';
import { VenuesService } from './venues.service';

const mockVenuesService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('VenuesController', () => {
  let controller: VenuesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VenuesController],
      providers: [
        { provide: VenuesService, useValue: mockVenuesService },
      ],
    }).compile();

    controller = module.get<VenuesController>(VenuesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call service.create', async () => {
      const dto = { name: 'V1', address: 'A1', capacity: 10 };
      await controller.create(dto);
      expect(mockVenuesService.create).toHaveBeenCalledWith(dto);
    });
  });
});
