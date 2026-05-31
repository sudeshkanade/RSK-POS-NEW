import { Test, TestingModule } from '@nestjs/testing';
import { SyncService } from './sync.service';
import { PrismaService } from '../prisma.service';

describe('SyncService', () => {
  let service: SyncService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncService,
        {
          provide: PrismaService,
          useValue: {
            order: {
              findUnique: jest.fn(),
              upsert: jest.fn(),
              findMany: jest.fn(),
            },
            table: { findMany: jest.fn() },
            category: { findMany: jest.fn() },
            orderItem: { upsert: jest.fn() },
          },
        },
      ],
    }).compile();

    service = module.get<SyncService>(SyncService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handlePull', () => {
    it('should query orders with tenantId filter', async () => {
      const mockDate = '2023-01-01T00:00:00Z';
      const mockTenantId = 'tenant-123';
      
      await service.handlePull(mockDate, mockTenantId);

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            restaurantId: mockTenantId
          })
        })
      );
    });
  });
});
