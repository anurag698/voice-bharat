import { Test, TestingModule } from '@nestjs/testing';
import { CommentService } from './comment.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { CommentReactionType } from '@prisma/client';

describe('CommentService', () => {
  let service: CommentService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    comment: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    post: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    commentReaction: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      groupBy: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CommentService>(CommentService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createComment', () => {
    const createCommentDto = {
      content: 'Great post!',
      postId: 'post-123',
      parentId: undefined,
    };
    const userId = 'user-123';

    it('should create a comment successfully', async () => {
      const mockPost = { id: 'post-123', userId: 'author-123' };
      const mockComment = {
        id: 'comment-123',
        content: 'Great post!',
        postId: 'post-123',
        userId: 'user-123',
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);
      mockPrismaService.comment.create.mockResolvedValue(mockComment);

      const result = await service.createComment(createCommentDto, userId);

      expect(result).toEqual(mockComment);
      expect(mockPrismaService.post.findUnique).toHaveBeenCalledWith({
        where: { id: 'post-123' },
      });
      expect(mockPrismaService.comment.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException when post does not exist', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(null);

      await expect(service.createComment(createCommentDto, userId)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for empty content', async () => {
      const emptyDto = { ...createCommentDto, content: '   ' };
      const mockPost = { id: 'post-123' };
      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);

      await expect(service.createComment(emptyDto, userId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getCommentsByPost', () => {
    it('should return paginated comments for a post', async () => {
      const postId = 'post-123';
      const mockComments = [
        { id: 'comment-1', content: 'Comment 1', postId: 'post-123' },
        { id: 'comment-2', content: 'Comment 2', postId: 'post-123' },
      ];

      mockPrismaService.comment.findMany.mockResolvedValue(mockComments);
      mockPrismaService.comment.count.mockResolvedValue(2);

      const result = await service.getCommentsByPost(postId, 1, 10);

      expect(result.comments).toEqual(mockComments);
      expect(result.total).toBe(2);
      expect(mockPrismaService.comment.findMany).toHaveBeenCalled();
    });
  });

  describe('getCommentById', () => {
    it('should return a comment by id', async () => {
      const commentId = 'comment-123';
      const mockComment = {
        id: commentId,
        content: 'Test comment',
        postId: 'post-123',
        userId: 'user-123',
      };

      mockPrismaService.comment.findUnique.mockResolvedValue(mockComment);

      const result = await service.getCommentById(commentId);

      expect(result).toEqual(mockComment);
      expect(mockPrismaService.comment.findUnique).toHaveBeenCalledWith({
        where: { id: commentId },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException when comment does not exist', async () => {
      mockPrismaService.comment.findUnique.mockResolvedValue(null);

      await expect(service.getCommentById('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateComment', () => {
    const updateDto = { content: 'Updated content' };
    const userId = 'user-123';

    it('should update comment successfully', async () => {
      const mockComment = {
        id: 'comment-123',
        content: 'Old content',
        userId: 'user-123',
      };
      const mockUpdated = { ...mockComment, content: 'Updated content' };

      mockPrismaService.comment.findUnique.mockResolvedValue(mockComment);
      mockPrismaService.comment.update.mockResolvedValue(mockUpdated);

      const result = await service.updateComment('comment-123', updateDto, userId);

      expect(result).toEqual(mockUpdated);
      expect(mockPrismaService.comment.update).toHaveBeenCalled();
    });

    it('should throw ForbiddenException when user is not the owner', async () => {
      const mockComment = { id: 'comment-123', userId: 'other-user' };
      mockPrismaService.comment.findUnique.mockResolvedValue(mockComment);

      await expect(service.updateComment('comment-123', updateDto, userId)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteComment', () => {
    const userId = 'user-123';

    it('should delete comment successfully', async () => {
      const mockComment = {
        id: 'comment-123',
        userId: 'user-123',
        postId: 'post-123',
      };
      const mockUser = { id: userId, role: 'USER' };

      mockPrismaService.comment.findUnique.mockResolvedValue(mockComment);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.comment.delete.mockResolvedValue(mockComment);

      await service.deleteComment('comment-123', userId);

      expect(mockPrismaService.comment.delete).toHaveBeenCalledWith({
        where: { id: 'comment-123' },
      });
    });

    it('should allow admin to delete any comment', async () => {
      const mockComment = { id: 'comment-123', userId: 'other-user', postId: 'post-123' };
      const mockAdmin = { id: userId, role: 'ADMIN' };

      mockPrismaService.comment.findUnique.mockResolvedValue(mockComment);
      mockPrismaService.user.findUnique.mockResolvedValue(mockAdmin);
      mockPrismaService.comment.delete.mockResolvedValue(mockComment);

      await service.deleteComment('comment-123', userId);

      expect(mockPrismaService.comment.delete).toHaveBeenCalled();
    });
  });

  describe('addReaction', () => {
    const userId = 'user-123';
    const commentId = 'comment-123';

    it('should add a new reaction', async () => {
      const mockComment = { id: commentId };
      const mockReaction = {
        id: 'reaction-1',
        userId,
        commentId,
        type: CommentReactionType.LIKE,
      };

      mockPrismaService.comment.findUnique.mockResolvedValue(mockComment);
      mockPrismaService.commentReaction.findUnique.mockResolvedValue(null);
      mockPrismaService.commentReaction.create.mockResolvedValue(mockReaction);

      const result = await service.addReaction(commentId, userId, CommentReactionType.LIKE);

      expect(result).toEqual(mockReaction);
      expect(mockPrismaService.commentReaction.create).toHaveBeenCalled();
    });

    it('should remove existing reaction (toggle)', async () => {
      const mockComment = { id: commentId };
      const existingReaction = {
        id: 'reaction-1',
        userId,
        commentId,
        type: CommentReactionType.LIKE,
      };

      mockPrismaService.comment.findUnique.mockResolvedValue(mockComment);
      mockPrismaService.commentReaction.findUnique.mockResolvedValue(existingReaction);
      mockPrismaService.commentReaction.delete.mockResolvedValue(existingReaction);

      await service.addReaction(commentId, userId, CommentReactionType.LIKE);

      expect(mockPrismaService.commentReaction.delete).toHaveBeenCalled();
    });
  });

  describe('getCommentReactions', () => {
    it('should return grouped reactions for a comment', async () => {
      const commentId = 'comment-123';
      const mockReactions = [
        { type: CommentReactionType.LIKE, _count: { type: 5 } },
        { type: CommentReactionType.LOVE, _count: { type: 3 } },
      ];

      mockPrismaService.commentReaction.groupBy.mockResolvedValue(mockReactions);

      const result = await service.getCommentReactions(commentId);

      expect(result).toEqual(mockReactions);
      expect(mockPrismaService.commentReaction.groupBy).toHaveBeenCalledWith({
        by: ['type'],
        where: { commentId },
        _count: { type: true },
      });
    });
  });

  describe('getUserReaction', () => {
    it('should return user reaction if exists', async () => {
      const mockReaction = {
        id: 'reaction-1',
        userId: 'user-123',
        commentId: 'comment-123',
        type: CommentReactionType.LIKE,
      };

      mockPrismaService.commentReaction.findUnique.mockResolvedValue(mockReaction);

      const result = await service.getUserReaction('comment-123', 'user-123');

      expect(result).toEqual(mockReaction);
    });

    it('should return null if no reaction exists', async () => {
      mockPrismaService.commentReaction.findUnique.mockResolvedValue(null);

      const result = await service.getUserReaction('comment-123', 'user-123');

      expect(result).toBeNull();
    });
  });
});
