import { Test, TestingModule } from '@nestjs/testing';
import { FundraiserService } from './fundraiser.service';
import { PrismaService } from '../prisma/prisma.service';
import { Fundraiser, Prisma } from '@prisma/client';

describe('FundraiserService', () => {
  let service: FundraiserService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    fundraiser: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FundraiserService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<FundraiserService>(FundraiserService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createFundraiser', () => {
    it('should create a fundraiser successfully', async () => {
      const fundraiserData: Prisma.FundraiserCreateInput = {
        title: 'Help Build Schools',
        description: 'Building schools in rural areas',
        goalAmount: 100000,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        ngo: { connect: { id: 'ngo-1' } },
      };

      const mockFundraiser = {
        id: 'fundraiser-1',
        ...fundraiserData,
        raisedAmount: 0,
        isActive: true,
        ngo: { id: 'ngo-1', name: 'Test NGO' },
        donations: [],
      };

      mockPrismaService.fundraiser.create.mockResolvedValue(mockFundraiser);

      const result = await service.createFundraiser(fundraiserData);

      expect(result).toEqual(mockFundraiser);
      expect(prismaService.fundraiser.create).toHaveBeenCalledWith({
        data: fundraiserData,
        include: {
          ngo: true,
          donations: true,
        },
      });
    });
  });

  describe('findAll', () => {
    it('should return all fundraisers with pagination', async () => {
      const mockFundraisers = [
        {
          id: 'fundraiser-1',
          title: 'Fundraiser 1',
          goalAmount: 50000,
          raisedAmount: 10000,
          ngo: { id: 'ngo-1', name: 'NGO 1' },
          donations: [],
        },
        {
          id: 'fundraiser-2',
          title: 'Fundraiser 2',
          goalAmount: 75000,
          raisedAmount: 20000,
          ngo: { id: 'ngo-2', name: 'NGO 2' },
          donations: [],
        },
      ];

      mockPrismaService.fundraiser.findMany.mockResolvedValue(mockFundraisers);

      const result = await service.findAll({
        skip: 0,
        take: 10,
      });

      expect(result).toEqual(mockFundraisers);
      expect(prismaService.fundraiser.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        where: undefined,
        orderBy: undefined,
        include: {
          ngo: true,
          donations: true,
        },
      });
    });

    it('should return fundraisers with where clause', async () => {
      const mockFundraisers = [
        {
          id: 'fundraiser-1',
          title: 'Active Fundraiser',
          isActive: true,
        },
      ];

      mockPrismaService.fundraiser.findMany.mockResolvedValue(mockFundraisers);

      await service.findAll({
        where: { isActive: true },
      });

      expect(prismaService.fundraiser.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: true },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a fundraiser by id', async () => {
      const mockFundraiser = {
        id: 'fundraiser-1',
        title: 'Test Fundraiser',
        goalAmount: 50000,
        raisedAmount: 10000,
        ngo: { id: 'ngo-1', name: 'Test NGO' },
        donations: [
          {
            id: 'donation-1',
            amount: 1000,
            user: { id: 'user-1', username: 'donor1' },
          },
        ],
      };

      mockPrismaService.fundraiser.findUnique.mockResolvedValue(mockFundraiser);

      const result = await service.findOne('fundraiser-1');

      expect(result).toEqual(mockFundraiser);
      expect(prismaService.fundraiser.findUnique).toHaveBeenCalledWith({
        where: { id: 'fundraiser-1' },
        include: {
          ngo: true,
          donations: {
            include: {
              user: true,
            },
          },
        },
      });
    });

    it('should return null if fundraiser not found', async () => {
      mockPrismaService.fundraiser.findUnique.mockResolvedValue(null);

      const result = await service.findOne('invalid-id');

      expect(result).toBeNull();
    });
  });

  describe('findByNgo', () => {
    it('should return all fundraisers for a specific NGO', async () => {
      const mockFundraisers = [
        {
          id: 'fundraiser-1',
          title: 'NGO Fundraiser 1',
          ngoId: 'ngo-1',
          ngo: { id: 'ngo-1', name: 'Test NGO' },
        },
        {
          id: 'fundraiser-2',
          title: 'NGO Fundraiser 2',
          ngoId: 'ngo-1',
          ngo: { id: 'ngo-1', name: 'Test NGO' },
        },
      ];

      mockPrismaService.fundraiser.findMany.mockResolvedValue(mockFundraisers);

      const result = await service.findByNgo('ngo-1');

      expect(result).toEqual(mockFundraisers);
      expect(prismaService.fundraiser.findMany).toHaveBeenCalledWith({
        where: { ngoId: 'ngo-1' },
        include: {
          ngo: true,
          donations: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });
  });

  describe('findActiveFundraisers', () => {
    it('should return only active fundraisers with end date in future', async () => {
      const mockActiveFundraisers = [
        {
          id: 'fundraiser-1',
          title: 'Active Fundraiser',
          isActive: true,
          endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        },
      ];

      mockPrismaService.fundraiser.findMany.mockResolvedValue(
        mockActiveFundraisers,
      );

      const result = await service.findActiveFundraisers();

      expect(result).toEqual(mockActiveFundraisers);
      expect(prismaService.fundraiser.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            isActive: true,
            endDate: {
              gte: expect.any(Date),
            },
          },
        }),
      );
    });
  });

  describe('update', () => {
    it('should update a fundraiser', async () => {
      const updateData: Prisma.FundraiserUpdateInput = {
        title: 'Updated Title',
        description: 'Updated Description',
      };

      const mockUpdatedFundraiser = {
        id: 'fundraiser-1',
        title: 'Updated Title',
        description: 'Updated Description',
        goalAmount: 50000,
        raisedAmount: 10000,
      };

      mockPrismaService.fundraiser.update.mockResolvedValue(
        mockUpdatedFundraiser,
      );

      const result = await service.update('fundraiser-1', updateData);

      expect(result).toEqual(mockUpdatedFundraiser);
      expect(prismaService.fundraiser.update).toHaveBeenCalledWith({
        where: { id: 'fundraiser-1' },
        data: updateData,
        include: {
          ngo: true,
          donations: true,
        },
      });
    });
  });

  describe('updateRaisedAmount', () => {
    it('should increment raised amount by donation amount', async () => {
      const mockUpdatedFundraiser = {
        id: 'fundraiser-1',
        raisedAmount: 15000,
      };

      mockPrismaService.fundraiser.update.mockResolvedValue(
        mockUpdatedFundraiser,
      );

      const result = await service.updateRaisedAmount('fundraiser-1', 5000);

      expect(result.raisedAmount).toBe(15000);
      expect(prismaService.fundraiser.update).toHaveBeenCalledWith({
        where: { id: 'fundraiser-1' },
        data: {
          raisedAmount: {
            increment: 5000,
          },
        },
      });
    });
  });

  describe('delete', () => {
    it('should delete a fundraiser', async () => {
      const mockDeletedFundraiser = {
        id: 'fundraiser-1',
        title: 'Deleted Fundraiser',
      };

      mockPrismaService.fundraiser.delete.mockResolvedValue(
        mockDeletedFundraiser,
      );

      const result = await service.delete('fundraiser-1');

      expect(result).toEqual(mockDeletedFundraiser);
      expect(prismaService.fundraiser.delete).toHaveBeenCalledWith({
        where: { id: 'fundraiser-1' },
      });
    });
  });

  describe('getFundraiserStats', () => {
    it('should calculate and return fundraiser statistics', async () => {
      const mockFundraiser = {
        id: 'fundraiser-1',
        title: 'Test Fundraiser',
        goalAmount: 100000,
        raisedAmount: 50000,
        isActive: true,
        endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        donations: [
          { id: 'donation-1', amount: 25000 },
          { id: 'donation-2', amount: 15000 },
          { id: 'donation-3', amount: 10000 },
        ],
      };

      mockPrismaService.fundraiser.findUnique.mockResolvedValue(mockFundraiser);

      const result = await service.getFundraiserStats('fundraiser-1');

      expect(result).toBeDefined();
      expect(result.totalDonations).toBe(3);
      expect(result.totalRaised).toBe(50000);
      expect(result.goalAmount).toBe(100000);
      expect(result.percentageReached).toBe(50);
      expect(result.daysRemaining).toBeGreaterThan(0);
      expect(result.isActive).toBe(true);
    });

    it('should return null if fundraiser not found', async () => {
      mockPrismaService.fundraiser.findUnique.mockResolvedValue(null);

      const result = await service.getFundraiserStats('invalid-id');

      expect(result).toBeNull();
    });

    it('should mark fundraiser as inactive if days remaining is 0 or negative', async () => {
      const mockExpiredFundraiser = {
        id: 'fundraiser-1',
        goalAmount: 100000,
        raisedAmount: 50000,
        isActive: true,
        endDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        donations: [],
      };

      mockPrismaService.fundraiser.findUnique.mockResolvedValue(
        mockExpiredFundraiser,
      );

      const result = await service.getFundraiserStats('fundraiser-1');

      expect(result.isActive).toBe(false);
      expect(result.daysRemaining).toBeLessThanOrEqual(0);
    });
  });
});
