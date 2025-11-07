import { Test, TestingModule } from '@nestjs/testing';
import { LikeService } from './like.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('LikeService', () => {
  let service: LikeService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    post: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    like: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LikeService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<LikeService>(LikeService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('likePost', () => {
    const userId = 'user-1';
    const postId = 'post-1';

    it('should like a post successfully', async () => {
      const mockPost = { id: postId, likesCount: 5 };
      const mockLike = { id: 'like-1', userId, postId, createdAt: new Date() };

      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);
      mockPrismaService.like.findUnique.mockResolvedValue(null);
      mockPrismaService.like.create.mockResolvedValue(mockLike);
      mockPrismaService.post.update.mockResolvedValue({ ...mockPost, likesCount: 6 });

      const result = await service.likePost(userId, postId);

      expect(result).toEqual({
        message: 'Post liked successfully',
        liked: true,
      });
      expect(mockPrismaService.like.create).toHaveBeenCalled();
      expect(mockPrismaService.post.update).toHaveBeenCalledWith({
        where: { id: postId },
        data: { likesCount: { increment: 1 } },
      });
    });

    it('should throw NotFoundException when post does not exist', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(null);

      await expect(service.likePost(userId, postId)).rejects.toThrow(NotFoundException);
      await expect(service.likePost(userId, postId)).rejects.toThrow('Post not found');
    });

    it('should throw ConflictException when post is already liked', async () => {
      const mockPost = { id: postId };
      const existingLike = { id: 'like-1', userId, postId };

      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);
      mockPrismaService.like.findUnique.mockResolvedValue(existingLike);

      await expect(service.likePost(userId, postId)).rejects.toThrow(ConflictException);
      await expect(service.likePost(userId, postId)).rejects.toThrow('You have already liked this post');
    });
  });

  describe('unlikePost', () => {
    const userId = 'user-1';
    const postId = 'post-1';

    it('should unlike a post successfully', async () => {
      const mockPost = { id: postId, likesCount: 5 };
      const mockLike = { id: 'like-1', userId, postId };

      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);
      mockPrismaService.like.findUnique.mockResolvedValue(mockLike);
      mockPrismaService.like.delete.mockResolvedValue(mockLike);
      mockPrismaService.post.update.mockResolvedValue({ ...mockPost, likesCount: 4 });

      const result = await service.unlikePost(userId, postId);

      expect(result).toEqual({
        message: 'Post unliked successfully',
        liked: false,
      });
      expect(mockPrismaService.like.delete).toHaveBeenCalled();
      expect(mockPrismaService.post.update).toHaveBeenCalledWith({
        where: { id: postId },
        data: { likesCount: { decrement: 1 } },
      });
    });

    it('should throw NotFoundException when post does not exist', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(null);

      await expect(service.unlikePost(userId, postId)).rejects.toThrow(NotFoundException);
      await expect(service.unlikePost(userId, postId)).rejects.toThrow('Post not found');
    });

    it('should throw NotFoundException when like does not exist', async () => {
      const mockPost = { id: postId };

      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);
      mockPrismaService.like.findUnique.mockResolvedValue(null);

      await expect(service.unlikePost(userId, postId)).rejects.toThrow(NotFoundException);
      await expect(service.unlikePost(userId, postId)).rejects.toThrow('You have not liked this post');
    });
  });

  describe('toggleLike', () => {
    const userId = 'user-1';
    const postId = 'post-1';

    it('should like post when not currently liked', async () => {
      const mockPost = { id: postId, likesCount: 5 };

      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);
      mockPrismaService.like.findUnique.mockResolvedValue(null);
      mockPrismaService.like.create.mockResolvedValue({ id: 'like-1', userId, postId });
      mockPrismaService.post.update.mockResolvedValue({ ...mockPost, likesCount: 6 });

      const result = await service.toggleLike(userId, postId);

      expect(result).toEqual({
        message: 'Post liked successfully',
        liked: true,
      });
      expect(mockPrismaService.like.create).toHaveBeenCalled();
    });

    it('should unlike post when currently liked', async () => {
      const mockPost = { id: postId, likesCount: 5 };
      const existingLike = { id: 'like-1', userId, postId };

      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);
      mockPrismaService.like.findUnique.mockResolvedValue(existingLike);
      mockPrismaService.like.delete.mockResolvedValue(existingLike);
      mockPrismaService.post.update.mockResolvedValue({ ...mockPost, likesCount: 4 });

      const result = await service.toggleLike(userId, postId);

      expect(result).toEqual({
        message: 'Post unliked successfully',
        liked: false,
      });
      expect(mockPrismaService.like.delete).toHaveBeenCalled();
    });

    it('should throw NotFoundException when post does not exist', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(null);

      await expect(service.toggleLike(userId, postId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getLikesByPost', () => {
    const postId = 'post-1';

    it('should return paginated likes for a post', async () => {
      const mockPost = { id: postId };
      const mockLikes = [
        {
          id: 'like-1',
          postId,
          userId: 'user-1',
          createdAt: new Date(),
          user: {
            id: 'user-1',
            username: 'user1',
            avatar: null,
            firstName: 'John',
            lastName: 'Doe',
          },
        },
      ];

      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);
      mockPrismaService.like.findMany.mockResolvedValue(mockLikes);
      mockPrismaService.like.count.mockResolvedValue(1);

      const result = await service.getLikesByPost(postId, 1, 20);

      expect(result).toEqual({
        likes: mockLikes,
        total: 1,
        page: 1,
        totalPages: 1,
      });
      expect(mockPrismaService.like.findMany).toHaveBeenCalled();
    });

    it('should throw NotFoundException when post does not exist', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(null);

      await expect(service.getLikesByPost(postId, 1, 20)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getLikesByUser', () => {
    const userId = 'user-1';

    it('should return paginated likes by user', async () => {
      const mockLikes = [
        {
          id: 'like-1',
          postId: 'post-1',
          userId,
          createdAt: new Date(),
          user: {
            id: userId,
            username: 'user1',
            avatar: null,
            firstName: 'John',
            lastName: 'Doe',
          },
        },
      ];

      mockPrismaService.like.findMany.mockResolvedValue(mockLikes);
      mockPrismaService.like.count.mockResolvedValue(1);

      const result = await service.getLikesByUser(userId, 1, 20);

      expect(result).toEqual({
        likes: mockLikes,
        total: 1,
        page: 1,
        totalPages: 1,
      });
      expect(mockPrismaService.like.findMany).toHaveBeenCalled();
    });
  });

  describe('hasUserLiked', () => {
    const postId = 'post-1';
    const userId = 'user-1';

    it('should return true when user has liked the post', async () => {
      mockPrismaService.like.findUnique.mockResolvedValue({
        id: 'like-1',
        postId,
        userId,
      });

      const result = await service.hasUserLiked(postId, userId);

      expect(result).toBe(true);
    });

    it('should return false when user has not liked the post', async () => {
      mockPrismaService.like.findUnique.mockResolvedValue(null);

      const result = await service.hasUserLiked(postId, userId);

      expect(result).toBe(false);
    });
  });

  describe('getLikeCount', () => {
    it('should return like count for a post', async () => {
      const postId = 'post-1';

      mockPrismaService.like.count.mockResolvedValue(10);

      const result = await service.getLikeCount(postId);

      expect(result).toBe(10);
      expect(mockPrismaService.like.count).toHaveBeenCalledWith({
        where: { postId },
      });
    });
  });

  describe('getUserLikeStatus', () => {
    const userId = 'user-1';

    it('should return like status for multiple posts', async () => {
      const postIds = ['post-1', 'post-2', 'post-3'];
      const mockLikes = [
        { postId: 'post-1' },
        { postId: 'post-3' },
      ];

      mockPrismaService.like.findMany.mockResolvedValue(mockLikes);

      const result = await service.getUserLikeStatus(postIds, userId);

      expect(result).toEqual({
        'post-1': true,
        'post-2': false,
        'post-3': true,
      });
      expect(mockPrismaService.like.findMany).toHaveBeenCalledWith({
        where: {
          postId: { in: postIds },
          userId,
        },
        select: { postId: true },
      });
    });
  });
});
