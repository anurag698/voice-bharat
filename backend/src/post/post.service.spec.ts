import { Test, TestingModule } from '@nestjs/testing';
import { PostService } from './post.service';
import { PrismaService } from '../prisma/prisma.service';
import { HashtagService } from './hashtag.service';
import { MentionService } from '../mention/mention.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { MediaType, ReactionType } from '@prisma/client';

describe('PostService', () => {
  let service: PostService;
  let prismaService: PrismaService;
  let hashtagService: HashtagService;
  let mentionService: MentionService;

  const mockPrismaService = {
    post: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    like: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    comment: {
      create: jest.fn(),
    },
    user: {
      update: jest.fn(),
    },
    postReaction: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockHashtagService = {
    extractHashtags: jest.fn(),
    processHashtags: jest.fn(),
  };

  const mockMentionService = {
    createPostMentions: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: HashtagService,
          useValue: mockHashtagService,
        },
        {
          provide: MentionService,
          useValue: mockMentionService,
        },
      ],
    }).compile();

    service = module.get<PostService>(PostService);
    prismaService = module.get<PrismaService>(PrismaService);
    hashtagService = module.get<HashtagService>(HashtagService);
    mentionService = module.get<MentionService>(MentionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getFeed', () => {
    const userId = 'user-123';

    it('should get feed with pagination', async () => {
      const mockPosts = [
        {
          id: 'post-1',
          content: 'Test post',
          author: { id: userId, username: 'testuser' },
          _count: { likes: 10, comments: 5 },
        },
      ];

      mockPrismaService.post.findMany.mockResolvedValue(mockPosts);

      const result = await service.getFeed(userId, 1, 20);

      expect(result).toEqual(mockPosts);
      expect(prismaService.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 20,
        }),
      );
    });
  });

  describe('getPostById', () => {
    it('should get post by ID', async () => {
      const mockPost = {
        id: 'post-1',
        content: 'Test',
        author: { id: '1', username: 'test' },
        comments: [],
        _count: { likes: 0, comments: 0 },
      };

      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);

      const result = await service.getPostById('post-1');

      expect(result).toEqual(mockPost);
    });

    it('should throw NotFoundException if post not found', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(null);

      await expect(service.getPostById('invalid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createPost', () => {
    const userId = 'user-123';
    const postData = {
      content: 'Test #hashtag @mention',
      mediaUrls: ['https://example.com/image.jpg'],
      mediaType: MediaType.IMAGE,
    };

    it('should create post successfully', async () => {
      const mockPost = {
        id: 'post-1',
        ...postData,
        authorId: userId,
        author: { id: userId, username: 'test' },
      };

      mockHashtagService.extractHashtags.mockReturnValue(['hashtag']);
      mockHashtagService.processHashtags.mockResolvedValue(Promise.resolve());
      mockMentionService.createPostMentions.mockResolvedValue(Promise.resolve());
      mockPrismaService.post.create.mockResolvedValue(mockPost);
      mockPrismaService.user.update.mockResolvedValue({});

      const result = await service.createPost(userId, postData);

      expect(result).toEqual(mockPost);
      expect(prismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { xp: { increment: 5 } },
        }),
      );
    });
  });

  describe('updatePost', () => {
    it('should update own post', async () => {
      const post = { id: 'post-1', authorId: 'user-1', content: 'Old' };
      const updated = { ...post, content: 'New' };

      mockPrismaService.post.findUnique.mockResolvedValue(post);
      mockPrismaService.post.update.mockResolvedValue(updated);

      const result = await service.updatePost('post-1', 'user-1', {
        content: 'New',
      });

      expect(result.content).toBe('New');
    });

    it('should throw ForbiddenException for others post', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue({
        id: 'post-1',
        authorId: 'user-1',
      });

      await expect(
        service.updatePost('post-1', 'user-2', { content: 'New' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deletePost', () => {
    it('should delete own post', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue({
        id: 'post-1',
        authorId: 'user-1',
      });
      mockPrismaService.post.delete.mockResolvedValue({ id: 'post-1' });

      await service.deletePost('post-1', 'user-1');

      expect(prismaService.post.delete).toHaveBeenCalled();
    });

    it('should throw ForbiddenException for others post', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue({
        id: 'post-1',
        authorId: 'user-1',
      });

      await expect(service.deletePost('post-1', 'user-2')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('likePost', () => {
    it('should like post if not already liked', async () => {
      mockPrismaService.like.findUnique.mockResolvedValue(null);
      mockPrismaService.like.create.mockResolvedValue({ id: 'like-1' });

      await service.likePost('post-1', 'user-1');

      expect(prismaService.like.create).toHaveBeenCalled();
    });

    it('should unlike post if already liked', async () => {
      mockPrismaService.like.findUnique.mockResolvedValue({ id: 'like-1' });
      mockPrismaService.like.delete.mockResolvedValue({ id: 'like-1' });

      await service.likePost('post-1', 'user-1');

      expect(prismaService.like.delete).toHaveBeenCalled();
    });
  });

  describe('addComment', () => {
    it('should add comment and award XP', async () => {
      const mockComment = {
        id: 'comment-1',
        content: 'Great post!',
        author: { id: 'user-1', username: 'test' },
      };

      mockPrismaService.comment.create.mockResolvedValue(mockComment);
      mockPrismaService.user.update.mockResolvedValue({});

      const result = await service.addComment('post-1', 'user-1', 'Great post!');

      expect(result).toEqual(mockComment);
      expect(prismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { xp: { increment: 2 } },
        }),
      );
    });
  });

  describe('addPostReaction', () => {
    it('should add reaction if not exists', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue({ id: 'post-1' });
      mockPrismaService.postReaction.findUnique.mockResolvedValue(null);
      mockPrismaService.$transaction.mockResolvedValue([{}, {}]);

      const result = await service.addPostReaction(
        'post-1',
        'user-1',
        ReactionType.LIKE,
      );

      expect(result).toEqual({ message: 'Reaction added' });
    });

    it('should remove reaction if exists', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue({ id: 'post-1' });
      mockPrismaService.postReaction.findUnique.mockResolvedValue({
        id: 'reaction-1',
      });
      mockPrismaService.$transaction.mockResolvedValue([{}, {}]);

      const result = await service.addPostReaction(
        'post-1',
        'user-1',
        ReactionType.LIKE,
      );

      expect(result).toEqual({ message: 'Reaction removed' });
    });
  });

  describe('getPostReactions', () => {
    it('should get reactions grouped by type', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue({ id: 'post-1' });
      mockPrismaService.postReaction.findMany.mockResolvedValue([
        {
          type: ReactionType.LIKE,
          user: { id: '1', username: 'user1', avatar: null },
        },
        {
          type: ReactionType.LIKE,
          user: { id: '2', username: 'user2', avatar: null },
        },
        {
          type: ReactionType.LOVE,
          user: { id: '3', username: 'user3', avatar: null },
        },
      ]);

      const result = await service.getPostReactions('post-1');

      expect(result).toHaveLength(2);
      expect(result[0].type).toBe(ReactionType.LIKE);
      expect(result[0].count).toBe(2);
      expect(result[1].type).toBe(ReactionType.LOVE);
      expect(result[1].count).toBe(1);
    });
  });

  describe('getUserPostReaction', () => {
    it('should get user reactions on post', async () => {
      mockPrismaService.postReaction.findMany.mockResolvedValue([
        { type: ReactionType.LIKE },
        { type: ReactionType.LOVE },
      ]);

      const result = await service.getUserPostReaction('post-1', 'user-1');

      expect(result).toEqual([ReactionType.LIKE, ReactionType.LOVE]);
    });
  });
});
