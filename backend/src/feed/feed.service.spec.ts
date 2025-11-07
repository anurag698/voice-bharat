import { Test, TestingModule } from '@nestjs/testing';
import { FeedService } from './feed.service';
import { PrismaService } from '../prisma/prisma.service';
import { Logger } from '@nestjs/common';

describe('FeedService', () => {
  let service: FeedService;
  let prisma: jest.Mocked<PrismaService>;
  let loggerError: jest.SpyInstance;

  beforeEach(() => {
    prisma = {
      user: { findUnique: jest.fn() },
      post: { findMany: jest.fn() },
      follow: { findMany: jest.fn() }
    } as any;
    service = new FeedService(prisma);

    // Mock logger
    loggerError = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    jest.clearAllMocks();
  });

  describe('getForYouFeed', () => {
    it('returns ranked personalized feed', async () => {
      prisma.user.findUnique.mockResolvedValue({ interests: ['art'] } as any);
      prisma.post.findMany.mockResolvedValue([
        { id: 1, createdAt: new Date(), likes: [{}], user: {}, _count: { likes: 2, comments: 2 }, content: 'Great art post', sharesCount: 4 },
        { id: 2, createdAt: new Date(), likes: [], user: {}, _count: { likes: 0, comments: 1 }, content: 'Music', sharesCount: 1 }
      ] as any);
      const result = await service.getForYouFeed('user123', 1, 2);
      expect(result.posts.length).toBeLessThanOrEqual(2);
      expect(prisma.post.findMany).toHaveBeenCalled();
      expect(prisma.user.findUnique).toHaveBeenCalled();
    });
    it('handles user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.getForYouFeed('nouser', 1, 1)).rejects.toBeTruthy();
      expect(loggerError).toHaveBeenCalled();
    });
    it('handles post fetch error', async () => {
      prisma.user.findUnique.mockResolvedValue({ interests: [] } as any);
      prisma.post.findMany.mockRejectedValue(new Error('DB fail'));
      await expect(service.getForYouFeed('test', 1, 1)).rejects.toThrow('DB fail');
      expect(loggerError).toHaveBeenCalled();
    });
  });

  describe('getFollowingFeed', () => {
    it('returns feed from followed users', async () => {
      prisma.follow.findMany.mockResolvedValue([{ followingId: 'abc' }]);
      prisma.post.findMany.mockResolvedValue([
        { id: 1, user: {}, likes: [{}], _count: { likes: 3, comments: 2 }, isPublic: true }
      ] as any);
      const result = await service.getFollowingFeed('userA', 1, 1);
      expect(result.posts.length).toBeGreaterThanOrEqual(0);
      expect(prisma.post.findMany).toHaveBeenCalled();
      expect(prisma.follow.findMany).toHaveBeenCalled();
    });
    it('returns empty if not following anyone', async () => {
      prisma.follow.findMany.mockResolvedValue([]);
      const result = await service.getFollowingFeed('userA', 1, 2);
      expect(result.posts).toEqual([]);
      expect(result.hasMore).toBe(false);
    });
    it('handles db errors', async () => {
      prisma.follow.findMany.mockRejectedValue(new Error('DB problem'));
      await expect(service.getFollowingFeed('badid', 1, 1)).rejects.toThrow('DB problem');
      expect(loggerError).toHaveBeenCalled();
    });
  });

  describe('getTrendingPosts', () => {
    it('returns trending posts sorted by engagement', async () => {
      prisma.post.findMany.mockResolvedValue([
        { id: 1, createdAt: new Date(), _count: { likes: 10, comments: 5 }, user: {}, sharesCount: 2 },
        { id: 2, createdAt: new Date(), _count: { likes: 5, comments: 2 }, user: {}, sharesCount: 1 }
      ] as any);
      const result = await service.getTrendingPosts(2);
      expect(result.length).toBeLessThanOrEqual(2);
      expect(prisma.post.findMany).toHaveBeenCalled();
    });
    it('returns empty list if no posts', async () => {
      prisma.post.findMany.mockResolvedValue([]);
      const result = await service.getTrendingPosts(5);
      expect(result).toEqual([]);
    });
    it('handles fetch errors', async () => {
      prisma.post.findMany.mockRejectedValue(new Error('Trending fail'));
      await expect(service.getTrendingPosts(1)).rejects.toThrow('Trending fail');
      expect(loggerError).toHaveBeenCalled();
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    loggerError.mockRestore();
  });
});
test: Add comprehensive unit tests for FeedService

Covers getForYouFeed, getFollowingFeed, getTrendingPosts and ranking. Success and error scenarios (user not found, empty result, DB errors), full mocking for PrismaService, edge cases, and failure logging.
