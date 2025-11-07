import { Test, TestingModule } from '@nestjs/testing';
import { FollowService } from './follow.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';

describe('FollowService', () => {
  let service: FollowService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    follow: {
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
        FollowService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<FollowService>(FollowService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('followUser', () => {
    const followerId = 'user-1';
    const followingId = 'user-2';

    it('should follow a user successfully', async () => {
      const mockUser = { id: followingId, username: 'testuser' };
      const mockFollow = {
        id: 'follow-1',
        followerId,
        followingId,
        createdAt: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.follow.findUnique.mockResolvedValue(null);
      mockPrismaService.follow.create.mockResolvedValue(mockFollow);

      const result = await service.followUser(followerId, followingId);

      expect(result).toEqual({
        message: 'Successfully followed user',
        following: true,
      });
      expect(mockPrismaService.follow.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException when trying to follow self', async () => {
      await expect(service.followUser(followerId, followerId)).rejects.toThrow(BadRequestException);
      await expect(service.followUser(followerId, followerId)).rejects.toThrow('You cannot follow yourself');
    });

    it('should throw NotFoundException when user to follow does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.followUser(followerId, followingId)).rejects.toThrow(NotFoundException);
      await expect(service.followUser(followerId, followingId)).rejects.toThrow('User to follow not found');
    });

    it('should throw ConflictException when already following', async () => {
      const mockUser = { id: followingId };
      const existingFollow = { id: 'follow-1', followerId, followingId };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.follow.findUnique.mockResolvedValue(existingFollow);

      await expect(service.followUser(followerId, followingId)).rejects.toThrow(ConflictException);
      await expect(service.followUser(followerId, followingId)).rejects.toThrow('You are already following this user');
    });
  });

  describe('unfollowUser', () => {
    const followerId = 'user-1';
    const followingId = 'user-2';

    it('should unfollow a user successfully', async () => {
      const existingFollow = { id: 'follow-1', followerId, followingId };

      mockPrismaService.follow.findUnique.mockResolvedValue(existingFollow);
      mockPrismaService.follow.delete.mockResolvedValue(existingFollow);

      const result = await service.unfollowUser(followerId, followingId);

      expect(result).toEqual({
        message: 'Successfully unfollowed user',
        following: false,
      });
      expect(mockPrismaService.follow.delete).toHaveBeenCalled();
    });

    it('should throw NotFoundException when not following the user', async () => {
      mockPrismaService.follow.findUnique.mockResolvedValue(null);

      await expect(service.unfollowUser(followerId, followingId)).rejects.toThrow(NotFoundException);
      await expect(service.unfollowUser(followerId, followingId)).rejects.toThrow('You are not following this user');
    });
  });

  describe('toggleFollow', () => {
    const followerId = 'user-1';
    const followingId = 'user-2';

    it('should follow user when not currently following', async () => {
      const mockUser = { id: followingId };
      const mockFollow = { id: 'follow-1', followerId, followingId };

      mockPrismaService.follow.findUnique.mockResolvedValue(null);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.follow.create.mockResolvedValue(mockFollow);

      const result = await service.toggleFollow(followerId, followingId);

      expect(result).toEqual({
        message: 'Successfully followed user',
        following: true,
      });
      expect(mockPrismaService.follow.create).toHaveBeenCalled();
    });

    it('should unfollow user when currently following', async () => {
      const existingFollow = { id: 'follow-1', followerId, followingId };

      mockPrismaService.follow.findUnique.mockResolvedValue(existingFollow);
      mockPrismaService.follow.delete.mockResolvedValue(existingFollow);

      const result = await service.toggleFollow(followerId, followingId);

      expect(result).toEqual({
        message: 'Successfully unfollowed user',
        following: false,
      });
      expect(mockPrismaService.follow.delete).toHaveBeenCalled();
    });

    it('should throw BadRequestException when trying to toggle self-follow', async () => {
      await expect(service.toggleFollow(followerId, followerId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getFollowers', () => {
    it('should return followers list with pagination', async () => {
      const userId = 'user-1';
      const mockFollowers = [
        {
          id: 'follow-1',
          followerId: 'user-2',
          followingId: userId,
          createdAt: new Date(),
          follower: {
            id: 'user-2',
            username: 'follower1',
            firstName: 'John',
            lastName: 'Doe',
            avatar: null,
            isVerified: false,
          },
        },
      ];

      mockPrismaService.follow.findMany.mockResolvedValue(mockFollowers);

      const result = await service.getFollowers(userId, 1, 20);

      expect(result).toHaveLength(1);
      expect(result[0].follower?.username).toBe('follower1');
      expect(mockPrismaService.follow.findMany).toHaveBeenCalled();
    });
  });

  describe('getFollowing', () => {
    it('should return following list with pagination', async () => {
      const userId = 'user-1';
      const mockFollowing = [
        {
          id: 'follow-1',
          followerId: userId,
          followingId: 'user-2',
          createdAt: new Date(),
          following: {
            id: 'user-2',
            username: 'following1',
            firstName: 'Jane',
            lastName: 'Smith',
            avatar: null,
            isVerified: true,
          },
        },
      ];

      mockPrismaService.follow.findMany.mockResolvedValue(mockFollowing);

      const result = await service.getFollowing(userId, 1, 20);

      expect(result).toHaveLength(1);
      expect(result[0].following?.username).toBe('following1');
      expect(mockPrismaService.follow.findMany).toHaveBeenCalled();
    });
  });

  describe('isFollowing', () => {
    const followerId = 'user-1';
    const followingId = 'user-2';

    it('should return true when following', async () => {
      mockPrismaService.follow.findUnique.mockResolvedValue({
        id: 'follow-1',
        followerId,
        followingId,
      });

      const result = await service.isFollowing(followerId, followingId);

      expect(result).toBe(true);
    });

    it('should return false when not following', async () => {
      mockPrismaService.follow.findUnique.mockResolvedValue(null);

      const result = await service.isFollowing(followerId, followingId);

      expect(result).toBe(false);
    });
  });

  describe('getFollowStats', () => {
    it('should return follow statistics', async () => {
      const userId = 'user-1';

      mockPrismaService.follow.count
        .mockResolvedValueOnce(10) // followers count
        .mockResolvedValueOnce(5); // following count

      const result = await service.getFollowStats(userId);

      expect(result).toEqual({
        userId,
        followersCount: 10,
        followingCount: 5,
      });
      expect(mockPrismaService.follow.count).toHaveBeenCalledTimes(2);
    });
  });

  describe('getMutualFollows', () => {
    it('should return mutual follows list', async () => {
      const userId = 'user-1';
      const mockFollowing = [{ followingId: 'user-2' }, { followingId: 'user-3' }];
      const mockMutualFollows = [
        {
          id: 'follow-1',
          followerId: 'user-2',
          followingId: userId,
          createdAt: new Date(),
          follower: {
            id: 'user-2',
            username: 'mutual1',
            firstName: 'Mutual',
            lastName: 'Friend',
            avatar: null,
            isVerified: false,
          },
        },
      ];

      mockPrismaService.follow.findMany
        .mockResolvedValueOnce(mockFollowing)
        .mockResolvedValueOnce(mockMutualFollows);

      const result = await service.getMutualFollows(userId, 1, 20);

      expect(result).toHaveLength(1);
      expect(result[0].follower?.username).toBe('mutual1');
      expect(mockPrismaService.follow.findMany).toHaveBeenCalledTimes(2);
    });
  });

  describe('getSuggestedUsers', () => {
    it('should return suggested users to follow', async () => {
      const userId = 'user-1';
      const mockFollowing = [{ followingId: 'user-2' }];
      const mockSuggestedUsers = [
        {
          id: 'user-3',
          username: 'suggested1',
          firstName: 'Suggested',
          lastName: 'User',
          avatar: null,
          isVerified: false,
          _count: { followers: 100 },
        },
      ];

      mockPrismaService.follow.findMany.mockResolvedValue(mockFollowing);
      mockPrismaService.user.findMany.mockResolvedValue(mockSuggestedUsers);

      const result = await service.getSuggestedUsers(userId, 10);

      expect(result).toHaveLength(1);
      expect(result[0].username).toBe('suggested1');
      expect(result[0].followersCount).toBe(100);
      expect(mockPrismaService.user.findMany).toHaveBeenCalled();
    });
  });

  describe('removeFollower', () => {
    it('should remove a follower successfully', async () => {
      const userId = 'user-1';
      const followerId = 'user-2';
      const existingFollow = {
        id: 'follow-1',
        followerId,
        followingId: userId,
      };

      mockPrismaService.follow.findUnique.mockResolvedValue(existingFollow);
      mockPrismaService.follow.delete.mockResolvedValue(existingFollow);

      const result = await service.removeFollower(userId, followerId);

      expect(result).toEqual({
        message: 'Successfully removed follower',
      });
      expect(mockPrismaService.follow.delete).toHaveBeenCalled();
    });

    it('should throw NotFoundException when user is not a follower', async () => {
      mockPrismaService.follow.findUnique.mockResolvedValue(null);

      await expect(service.removeFollower('user-1', 'user-2')).rejects.toThrow(NotFoundException);
      await expect(service.removeFollower('user-1', 'user-2')).rejects.toThrow('This user is not following you');
    });
  });
});
