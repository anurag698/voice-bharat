import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
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

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(userId: string, data: {
    firstName?: string;
    lastName?: string;
    bio?: string;
    avatar?: string;
  }) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
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
  }

  async followUser(followerId: string, followingId: string) {
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
      throw new Error('Already following this user');
    }

    return this.prisma.follow.create({
      data: {
        followerId,
        followingId,
      },
    });
  }

  async unfollowUser(followerId: string, followingId: string) {
    return this.prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });
  }

  async getFollowers(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const followers = await this.prisma.follow.findMany({
      where: { followingId: userId },
      skip,
      take: limit,
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

    return followers.map(f => f.follower);
  }

  async getFollowing(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const following = await this.prisma.follow.findMany({
      where: { followerId: userId },
      skip,
      take: limit,
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

    return following.map(f => f.following);
  }

  async addXP(userId: string, xpAmount: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const newXP = user.xp + xpAmount;
    const newLevel = Math.floor(newXP / 100) + 1; // 100 XP per level

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        xp: newXP,
        level: newLevel,
      },
    });
  }
}
