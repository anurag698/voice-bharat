import { Test, TestingModule } from '@nestjs/testing';
import { DonationService } from './donation.service';
import { PrismaService } from '../prisma/prisma.service';

describe('DonationService', () => {
  let service: DonationService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(() => {
    prisma = {
      donation: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
        aggregate: jest.fn()
      }
    } as any;
    service = new DonationService(prisma);
    jest.clearAllMocks();
  });

  describe('createDonation', () => {
    it('should create and return donation', async () => {
      prisma.donation.create.mockResolvedValue({ id: 'don1' } as any);
      const result = await service.createDonation({});
      expect(prisma.donation.create).toHaveBeenCalled();
      expect(result).toEqual({ id: 'don1' });
    });
    it('should handle creation error', async () => {
      prisma.donation.create.mockRejectedValue(new Error('Create failed'));
      await expect(service.createDonation({})).rejects.toThrow('Create failed');
    });
  });

  describe('findAll', () => {
    it('should return all donation results', async () => {
      prisma.donation.findMany.mockResolvedValue([{ id: 'don2' }] as any);
      const result = await service.findAll({});
      expect(prisma.donation.findMany).toHaveBeenCalled();
      expect(result).toEqual([{ id: 'don2' }]);
    });
    it('should handle fetch errors', async () => {
      prisma.donation.findMany.mockRejectedValue(new Error('FindMany failed'));
      await expect(service.findAll({})).rejects.toThrow('FindMany failed');
    });
  });

  describe('findOne', () => {
    it('should return single donation', async () => {
      prisma.donation.findUnique.mockResolvedValue({ id: 'don3' } as any);
      const result = await service.findOne('don3');
      expect(prisma.donation.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'don3' }}));
      expect(result).toEqual({ id: 'don3' });
    });
    it('should return null if not found', async () => {
      prisma.donation.findUnique.mockResolvedValue(null);
      const result = await service.findOne('missing');
      expect(result).toBeNull();
    });
    it('should handle error', async () => {
      prisma.donation.findUnique.mockRejectedValue(new Error('FindUnique failed'));
      await expect(service.findOne('fail')).rejects.toThrow('FindUnique failed');
    });
  });

  describe('findByUser', () => {
    it('should return user donations', async () => {
      prisma.donation.findMany.mockResolvedValue([{ id: 'donU' }]);
      const result = await service.findByUser('user1');
      expect(prisma.donation.findMany).toHaveBeenCalled();
      expect(result).toEqual([{ id: 'donU' }]);
    });
  });

  describe('findByFundraiser', () => {
    it('should return fundraiser donations', async () => {
      prisma.donation.findMany.mockResolvedValue([{ id: 'donF' }]);
      const result = await service.findByFundraiser('fund1');
      expect(prisma.donation.findMany).toHaveBeenCalled();
      expect(result).toEqual([{ id: 'donF' }]);
    });
  });

  describe('update', () => {
    it('should update and return donation', async () => {
      prisma.donation.update.mockResolvedValue({ id: 'donUp' } as any);
      const result = await service.update('donUp', {});
      expect(prisma.donation.update).toHaveBeenCalled();
      expect(result).toEqual({ id: 'donUp' });
    });
    it('should handle update error', async () => {
      prisma.donation.update.mockRejectedValue(new Error('Update failed'));
      await expect(service.update('fail', {})).rejects.toThrow('Update failed');
    });
  });

  describe('updateStatus', () => {
    it('should update donation status', async () => {
      prisma.donation.update.mockResolvedValue({ id: 'donStat', status: 'approved' } as any);
      const result = await service.updateStatus('donStat', 'approved');
      expect(prisma.donation.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'donStat' }, data: { status: 'approved' }}));
      expect(result).toEqual({ id: 'donStat', status: 'approved' });
    });
  });

  describe('delete', () => {
    it('should delete and return donation', async () => {
      prisma.donation.delete.mockResolvedValue({ id: 'donDel' } as any);
      const result = await service.delete('donDel');
      expect(prisma.donation.delete).toHaveBeenCalled();
      expect(result).toEqual({ id: 'donDel' });
    });
    it('should handle delete error', async () => {
      prisma.donation.delete.mockRejectedValue(new Error('Delete failed'));
      await expect(service.delete('fail')).rejects.toThrow('Delete failed');
    });
  });

  describe('getDonationStats', () => {
    it('should return stats for a user', async () => {
      prisma.donation.count.mockResolvedValue(3);
      prisma.donation.aggregate.mockResolvedValue({ _sum: { amount: 50 } });
      const result = await service.getDonationStats('user2');
      expect(result).toEqual({ totalDonations: 3, totalAmount: 50 });
    });
    it('should handle case where no amount', async () => {
      prisma.donation.count.mockResolvedValue(0);
      prisma.donation.aggregate.mockResolvedValue({ _sum: { amount: null } });
      const result = await service.getDonationStats('userEmpty');
      expect(result).toEqual({ totalDonations: 0, totalAmount: 0 });
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
test: Add comprehensive unit tests for DonationService

Covers createDonation, findAll, findOne, findByUser, findByFundraiser, update, updateStatus, delete, getDonationStats. Success/error/edge cases, with PrismaService mocks.
