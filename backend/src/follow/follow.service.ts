import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// DTOs
export class FollowResponseDto {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: Date;
  follower?: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
    isVerified: boolean;
  };
  following?: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
    isVerified: boolean;
  };
}

export class FollowStatsDto {
  userId: string;
  followersCount: number;
  followingCount: number;
}

@Injectable()
export class FollowService {
  constructor(private prisma: PrismaService) {}

  /**
   * Follow a user
   */
  async followUser(followerId: string, followingId: string): Promise<{ message: string; following: boolean }> {
    // Prevent self-follow
    if (followerId === followingId) {
      throw new BadRequestException('You cannot follow yourself');
    }

    // Check if following user exists
    const userToFollow = await this.prisma.user.findUnique({
      where: { id: followingId },
    });

    if (!userToFollow) {
      throw new NotFoundException('User to follow not found');
    }

    // Check if already following
    const existingFollow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (existingFollow) {
      throw new ConflictException('You are already following this user');
    }

    // Create follow relationship
    await this.prisma.follow.create({
      data: {
        followerId,
        followingId,
      },
    });

    return {
      message: 'Successfully followed user',
      following: true,
    };
  }

  /**
   * Unfollow a user
   */
  async unfollowUser(followerId: string, followingId: string): Promise<{ message: string; following: boolean }> {
    // Check if follow relationship exists
    const existingFollow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (!existingFollow) {
      throw new NotFoundException('You are not following this user');
    }

    // Delete follow relationship
    await this.prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    return {
      message: 'Successfully unfollowed user',
      following: false,
    };
  }

  /**
   * Toggle follow status (follow if not following, unfollow if following)
   */
  async toggleFollow(followerId: string, followingId: string): Promise<{ message: string; following: boolean }> {
    // Prevent self-follow
    if (followerId === followingId) {
      throw new BadRequestException('You cannot follow yourself');
    }

    // Check if already following
    const existingFollow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (existingFollow) {
      // Unfollow
      await this.prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId,
            followingId,
          },
        },
      });

      return {
        message: 'Successfully unfollowed user',
        following: false,
      };
    } else {
      // Check if user exists
      const userToFollow = await this.prisma.user.findUnique({
        where: { id: followingId },
      });

      if (!userToFollow) {
        throw new NotFoundException('User not found');
      }

      // Follow
      await this.prisma.follow.create({
        data: {
          followerId,
          followingId,
        },
      });

      return {
        message: 'Successfully followed user',
        following: true,
      };
    }
  }

  /**
   * Get followers of a user (users who follow them)
   */
  async getFollowers(userId: string, page: number = 1, limit: number = 20): Promise<FollowResponseDto[]> {
    const skip = (page - 1) * limit;

    const followers = await this.prisma.follow.findMany({
      where: {
        followingId: userId,
      },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
            isVerified: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return followers.map((follow) => ({
      id: follow.id,
      followerId: follow.followerId,
      followingId: follow.followingId,
      createdAt: follow.createdAt,
      follower: follow.follower,
    }));
  }

  /**
   * Get users that a user is following
   */
  async getFollowing(userId: string, page: number = 1, limit: number = 20): Promise<FollowResponseDto[]> {
    const skip = (page - 1) * limit;

    const following = await this.prisma.follow.findMany({
      where: {
        followerId: userId,
      },
      include: {
        following: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
            isVerified: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return following.map((follow) => ({
      id: follow.id,
      followerId: follow.followerId,
      followingId: follow.followingId,
      createdAt: follow.createdAt,
      following: follow.following,
    }));
  }

  /**
   * Check if user A is following user B
   */
  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const follow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    return !!follow;
  }

  /**
   * Get follow statistics for a user
   */
  async getFollowStats(userId: string): Promise<FollowStatsDto> {
    const [followersCount, followingCount] = await Promise.all([
      this.prisma.follow.count({
        where: { followingId: userId },
      }),
      this.prisma.follow.count({
        where: { followerId: userId },
      }),
    ]);

    return {
      userId,
      followersCount,
      followingCount,
    };
  }

  /**
   * Get mutual follows (users who follow each other)
   */
  async getMutualFollows(userId: string, page: number = 1, limit: number = 20): Promise<FollowResponseDto[]> {
    const skip = (page - 1) * limit;

    // Get users that the current user follows
    const following = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const followingIds = following.map((f) => f.followingId);

    // Get users who follow the current user AND are followed by them (mutual)
    const mutualFollows = await this.prisma.follow.findMany({
      where: {
        followingId: userId,
        followerId: { in: followingIds },
      },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
            isVerified: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return mutualFollows.map((follow) => ({
      id: follow.id,
      followerId: follow.followerId,
      followingId: follow.followingId,
      createdAt: follow.createdAt,
      follower: follow.follower,
    }));
  }

  /**
   * Get suggested users to follow (not yet following, excluding self)
   */
  async getSuggestedUsers(userId: string, limit: number = 10) {
    // Get users the current user is already following
    const following = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const followingIds = following.map((f) => f.followingId);
    const excludeIds = [...followingIds, userId]; // Exclude followed users and self

    // Get suggested users (popular users not yet followed)
    const suggestedUsers = await this.prisma.user.findMany({
      where: {
        id: { notIn: excludeIds },
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        isVerified: true,
        _count: {
          select: {
            followers: true,
          },
        },
      },
      take: limit,
      orderBy: {
        followers: {
          _count: 'desc',
        },
      },
    });

    return suggestedUsers.map((user) => ({
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      isVerified: user.isVerified,
      followersCount: user._count.followers,
    }));
  }

  /**
   * Remove a follower (block them from following you)
   */
  async removeFollower(userId: string, followerId: string): Promise<{ message: string }> {
    const existingFollow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: followerId,
          followingId: userId,
        },
      },
    });

    if (!existingFollow) {
      throw new NotFoundException('This user is not following you');
    }

    await this.prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId: followerId,
          followingId: userId,
        },
      },
    });

    return {
      message: 'Successfully removed follower',
    };
  }
}
