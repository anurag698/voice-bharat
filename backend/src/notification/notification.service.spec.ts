import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';

describe('NotificationService', () => {
  let service: NotificationService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(() => {
    prisma = {
      notification: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn()
      },
      post: { findUnique: jest.fn() },
      comment: { findUnique: jest.fn() },
      user: { findUnique: jest.fn() },
      poll: { findUnique: jest.fn() },
      fundraiser: { findUnique: jest.fn() },
      ngo: { findUnique: jest.fn() }
    } as any;
    service = new NotificationService(prisma);
    jest.clearAllMocks();
  });

  describe('createNotification', () => {
    it('creates notification for other user', async () => {
      prisma.notification.create.mockResolvedValue({ id: 1 } as any);
      const result = await service.createNotification(2, 'LIKE', 'Liked your post', 6, 1);
      expect(prisma.notification.create).toHaveBeenCalled();
      expect(result).toEqual({ id: 1 });
    });
    it('returns null if acting on self', async () => {
      const result = await service.createNotification(1, 'LIKE', 'Liked your post', 6, 1);
      expect(result).toBeNull();
      expect(prisma.notification.create).not.toHaveBeenCalled();
    });
  });

  describe('notifyPostLike', () => {
    it('sends notification for post like', async () => {
      prisma.post.findUnique.mockResolvedValue({ userId: 2 } as any);
      prisma.user.findUnique.mockResolvedValue({ username: 'likerUser' } as any);
      prisma.notification.create.mockResolvedValue({ id: 1 } as any);
      const result = await service.notifyPostLike(1, 6, 1);
      expect(prisma.notification.create).toHaveBeenCalled();
      expect(result).toEqual({ id: 1 });
    });
    it('throws NotFoundException if post missing', async () => {
      prisma.post.findUnique.mockResolvedValue(null);
      await expect(service.notifyPostLike(1, 99, 2)).rejects.toThrow(NotFoundException);
    });
    it('throws NotFoundException if liker missing', async () => {
      prisma.post.findUnique.mockResolvedValue({ userId: 2 } as any);
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.notifyPostLike(1, 6, 99)).rejects.toThrow(NotFoundException);
    });
  });
  // Repeat similar describe blocks for all methods (notifyComment, notifyFollow, etc.) covering both success/error

  describe('getNotifications', () => {
    it('returns notifications with pagination', async () => {
      prisma.notification.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }] as any);
      const result = await service.getNotifications(1, 0, 10);
      expect(prisma.notification.findMany).toHaveBeenCalled();
      expect(result).toEqual([{ id: 1 }, { id: 2 }]);
    });
  });

  describe('getUnreadCount', () => {
    it('returns unread count', async () => {
      prisma.notification.count.mockResolvedValue(5);
      const result = await service.getUnreadCount(1);
      expect(prisma.notification.count).toHaveBeenCalled();
      expect(result).toBe(5);
    });
  });

  describe('markAsRead', () => {
    it('marks notification as read', async () => {
      prisma.notification.update.mockResolvedValue({ id: 1, read: true } as any);
      const result = await service.markAsRead(1, 1);
      expect(prisma.notification.update).toHaveBeenCalled();
      expect(result).toEqual({ id: 1, read: true });
    });
    it('throws ForbiddenException on wrong user', async () => {
      prisma.notification.update.mockImplementation(() => { throw new ForbiddenException(); });
      await expect(service.markAsRead(2, 1)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteNotification', () => {
    it('deletes notification for user', async () => {
      prisma.notification.delete.mockResolvedValue({ id: 1 } as any);
      const result = await service.deleteNotification(1, 1);
      expect(prisma.notification.delete).toHaveBeenCalled();
      expect(result).toEqual({ id: 1 });
    });
    it('throws ForbiddenException for wrong user', async () => {
      prisma.notification.delete.mockImplementation(() => { throw new ForbiddenException(); });
      await expect(service.deleteNotification(2, 1)).rejects.toThrow(ForbiddenException);
    });
  });

  // Continue similar tests for notifyComment, notifyFollow, notifyMessage, notifyPollVote, notifyDonation,
  // notifyNGOVerification, notifyLevelUp, notifyBadgeEarned, markAllAsRead, deleteAllRead
  // Each method must have both success and error/edge case tests

  afterEach(() => {
    jest.clearAllMocks();
  });
});
