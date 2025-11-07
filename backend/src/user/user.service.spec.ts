import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('UserService', () => {
  let service: UserService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    follow: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserById', () => {
    const userId = 'user-123';
    const mockUser = {
      id: userId,
      email: 'test@example.com',
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User',
      avatar: 'https://example.com/avatar.jpg',
      bio: 'Test bio',
      xp: 250,
      level: 3,
      badges: ['early-adopter', 'contributor'],
      createdAt: new Date('2024-01-01'),
      _count: {
        posts: 15,
        followers: 120,
        following: 80,
      },
    };

    it('should successfully get user by ID', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getUserById(userId);

      expect(result).toEqual(mockUser);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true,
          bio: true,
          xp: true,
          level: true,
          badges: true,
          createdAt: true,
          _count: {
            select: {
              posts: true,
              followers: true,
              following: true,
            },
          },
        },
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getUserById(userId)).rejects.toThrow(
        new NotFoundException('User not found'),
      );
    });
  });

  describe('updateProfile', () => {
    const userId = 'user-123';
    const updateData = {
      firstName: 'Updated',
      lastName: 'Name',
      bio: 'Updated bio',
      avatar: 'https://example.com/new-avatar.jpg',
    };
    const mockUpdatedUser = {
      id: userId,
      email: 'test@example.com',
      username: 'testuser',
      ...updateData,
      xp: 250,
      level: 3,
      badges: ['early-adopter'],
    };

    it('should successfully update user profile', async () => {
      mockPrismaService.user.update.mockResolvedValue(mockUpdatedUser);

      const result = await service.updateProfile(userId, updateData);

      expect(result).toEqual(mockUpdatedUser);
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true,
          bio: true,
          xp: true,
          level: true,
          badges: true,
        },
      });
    });

    it('should update partial profile data', async () => {
      const partialData = { bio: 'New bio only' };
      const partialUpdatedUser = { ...mockUpdatedUser, bio: 'New bio only' };

      mockPrismaService.user.update.mockResolvedValue(partialUpdatedUser);

      const result = await service.updateProfile(userId, partialData);

      expect(result).toEqual(partialUpdatedUser);
      expect(prismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: userId },
          data: partialData,
        }),
      );
    });
  });

  describe('followUser', () => {
    const followerId = 'user-123';
    const followingId = 'user-456';

    it('should successfully follow a user', async () => {
      const mockFollow = {
        id: 'follow-123',
        followerId,
        followingId,
        createdAt: new Date(),
      };

      mockPrismaService.follow.findUnique.mockResolvedValue(null);
      mockPrismaService.follow.create.mockResolvedValue(mockFollow);

      const result = await service.followUser(followerId, followingId);

      expect(result).toEqual(mockFollow);
      expect(prismaService.follow.create).toHaveBeenCalledWith({
        data: {
          followerId,
          followingId,
        },
      });
    });

    it('should throw error if already following', async () => {
      mockPrismaService.follow.findUnique.mockResolvedValue({
        id: 'existing-follow',
      });

      await expect(
        service.followUser(followerId, followingId),
      ).rejects.toThrow('Already following this user');
      expect(prismaService.follow.create).not.toHaveBeenCalled();
    });
  });

  describe('unfollowUser', () => {
    const followerId = 'user-123';
    const followingId = 'user-456';

    it('should successfully unfollow a user', async () => {
      const mockDeletedFollow = {
        id: 'follow-123',
        followerId,
        followingId,
        createdAt: new Date(),
      };

      mockPrismaService.follow.delete.mockResolvedValue(mockDeletedFollow);

      const result = await service.unfollowUser(followerId, followingId);

      expect(result).toEqual(mockDeletedFollow);
      expect(prismaService.follow.delete).toHaveBeenCalledWith({
        where: {
          followerId_followingId: {
            followerId,
            followingId,
          },
        },
      });
    });
  });

  describe('getFollowers', () => {
    const userId = 'user-123';

    it('should get followers with default pagination', async () => {
      const mockFollowers = [
        {
          follower: {
            id: 'user-1',
            username: 'follower1',
            firstName: 'Follower',
            lastName: 'One',
            avatar: 'avatar1.jpg',
          },
        },
        {
          follower: {
            id: 'user-2',
            username: 'follower2',
            firstName: 'Follower',
            lastName: 'Two',
            avatar: 'avatar2.jpg',
          },
        },
      ];

      mockPrismaService.follow.findMany.mockResolvedValue(mockFollowers);

      const result = await service.getFollowers(userId);

      expect(result).toEqual([
        mockFollowers[0].follower,
        mockFollowers[1].follower,
      ]);
      expect(prismaService.follow.findMany).toHaveBeenCalledWith({
        where: { followingId: userId },
        skip: 0,
        take: 20,
        include: {
          follower: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
      });
    });

    it('should get followers with custom pagination', async () => {
      mockPrismaService.follow.findMany.mockResolvedValue([]);

      await service.getFollowers(userId, 2, 10);

      expect(prismaService.follow.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        }),
      );
    });
  });

  describe('getFollowing', () => {
    const userId = 'user-123';

    it('should get following users with default pagination', async () => {
      const mockFollowing = [
        {
          following: {
            id: 'user-1',
            username: 'following1',
            firstName: 'Following',
            lastName: 'One',
            avatar: 'avatar1.jpg',
          },
        },
        {
          following: {
            id: 'user-2',
            username: 'following2',
            firstName: 'Following',
            lastName: 'Two',
            avatar: 'avatar2.jpg',
          },
        },
      ];

      mockPrismaService.follow.findMany.mockResolvedValue(mockFollowing);

      const result = await service.getFollowing(userId);

      expect(result).toEqual([
        mockFollowing[0].following,
        mockFollowing[1].following,
      ]);
      expect(prismaService.follow.findMany).toHaveBeenCalledWith({
        where: { followerId: userId },
        skip: 0,
        take: 20,
        include: {
          following: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
      });
    });

    it('should get following users with custom pagination', async () => {
      mockPrismaService.follow.findMany.mockResolvedValue([]);

      await service.getFollowing(userId, 3, 15);

      expect(prismaService.follow.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 30,
          take: 15,
        }),
      );
    });
  });

  describe('addXP', () => {
    const userId = 'user-123';

    it('should add XP and level up user', async () => {
      const currentUser = {
        id: userId,
        xp: 50,
        level: 1,
      };
      const updatedUser = {
        id: userId,
        xp: 150,
        level: 2,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(currentUser);
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.addXP(userId, 100);

      expect(result).toEqual(updatedUser);
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          xp: 150,
          level: 2,
        },
      });
    });

    it('should calculate correct level based on XP', async () => {
      const currentUser = {
        id: userId,
        xp: 280,
        level: 3,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(currentUser);
      mockPrismaService.user.update.mockResolvedValue({});

      await service.addXP(userId, 50);

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          xp: 330,
          level: 4,
        },
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.addXP(userId, 100)).rejects.toThrow(
        new NotFoundException('User not found'),
      );
      expect(prismaService.user.update).not.toHaveBeenCalled();
    });

    it('should handle negative XP addition', async () => {
      const currentUser = {
        id: userId,
        xp: 150,
        level: 2,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(currentUser);
      mockPrismaService.user.update.mockResolvedValue({});

      await service.addXP(userId, -30);

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          xp: 120,
          level: 2,
        },
      });
    });
  });
});
