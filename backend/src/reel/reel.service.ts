import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReelService {
  constructor(private prisma: PrismaService) {}

  /**
   * Upload a new reel
   */
  async uploadReel(
    userId: string,
    caption: string | null,
    videoUrl: string,
    thumbnailUrl: string,
    duration: number,
    soundUrl: string | null,
    hashtags: string[],
  ) {
    if (!videoUrl || !thumbnailUrl) {
      throw new BadRequestException('Video URL and thumbnail URL are required');
    }

    if (duration <= 0) {
      throw new BadRequestException('Duration must be positive');
    }

    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const reel = await this.prisma.reel.create({
      data: {
        userId,
        caption,
        videoUrl,
        thumbnailUrl,
        duration,
        soundUrl,
        hashtags,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    return reel;
  }

  /**
   * Get a reel by ID
   */
  async getReel(reelId: string) {
    const reel = await this.prisma.reel.findUnique({
      where: { id: reelId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        likes: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!reel) {
      throw new NotFoundException('Reel not found');
    }

    return reel;
  }

  /**
   * Delete a reel (only by owner)
   */
  async deleteReel(userId: string, reelId: string) {
    const reel = await this.prisma.reel.findUnique({
      where: { id: reelId },
    });

    if (!reel) {
      throw new NotFoundException('Reel not found');
    }

    if (reel.userId !== userId) {
      throw new ForbiddenException('You can only delete your own reels');
    }

    await this.prisma.reel.delete({
      where: { id: reelId },
    });

    return { message: 'Reel deleted successfully' };
  }

  /**
   * Get reels feed from followed users
   */
  async getFeed(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    // Get users that current user follows
    const following = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const followingIds = following.map((f) => f.followingId);
    followingIds.push(userId); // Include own reels

    const reels = await this.prisma.reel.findMany({
      where: {
        userId: {
          in: followingIds,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        likes: true,
        comments: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    const total = await this.prisma.reel.count({
      where: {
        userId: {
          in: followingIds,
        },
      },
    });

    return {
      reels,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get trending reels (based on engagement)
   */
  async getTrendingReels(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const reels = await this.prisma.reel.findMany({
      where: {
        createdAt: {
          gte: oneDayAgo,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        likes: true,
        comments: true,
      },
      orderBy: [
        { likesCount: 'desc' },
        { commentsCount: 'desc' },
        { viewsCount: 'desc' },
      ],
      skip,
      take: limit,
    });

    const total = await this.prisma.reel.count({
      where: {
        createdAt: {
          gte: oneDayAgo,
        },
      },
    });

    return {
      reels,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get reels by a specific user
   */
  async getUserReels(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const reels = await this.prisma.reel.findMany({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        likes: true,
        comments: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    const total = await this.prisma.reel.count({
      where: { userId },
    });

    return {
      reels,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Like a reel
   */
  async likeReel(userId: string, reelId: string) {
    const reel = await this.prisma.reel.findUnique({
      where: { id: reelId },
    });

    if (!reel) {
      throw new NotFoundException('Reel not found');
    }

    // Check if already liked
    const existingLike = await this.prisma.reelLike.findUnique({
      where: {
        reelId_userId: {
          reelId,
          userId,
        },
      },
    });

    if (existingLike) {
      throw new BadRequestException('You already liked this reel');
    }

    // Create like and increment count atomically
    await this.prisma.$transaction([
      this.prisma.reelLike.create({
        data: {
          reelId,
          userId,
        },
      }),
      this.prisma.reel.update({
        where: { id: reelId },
        data: {
          likesCount: {
            increment: 1,
          },
        },
      }),
    ]);

    return { message: 'Reel liked successfully' };
  }

  /**
   * Unlike a reel
   */
  async unlikeReel(userId: string, reelId: string) {
    const reel = await this.prisma.reel.findUnique({
      where: { id: reelId },
    });

    if (!reel) {
      throw new NotFoundException('Reel not found');
    }

    const existingLike = await this.prisma.reelLike.findUnique({
      where: {
        reelId_userId: {
          reelId,
          userId,
        },
      },
    });

    if (!existingLike) {
      throw new BadRequestException('You have not liked this reel');
    }

    // Delete like and decrement count atomically
    await this.prisma.$transaction([
      this.prisma.reelLike.delete({
        where: {
          reelId_userId: {
            reelId,
            userId,
          },
        },
      }),
      this.prisma.reel.update({
        where: { id: reelId },
        data: {
          likesCount: {
            decrement: 1,
          },
        },
      }),
    ]);

    return { message: 'Reel unliked successfully' };
  }

  /**
   * Get likes for a reel
   */
  async getReelLikes(reelId: string, page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;

    const reel = await this.prisma.reel.findUnique({
      where: { id: reelId },
    });

    if (!reel) {
      throw new NotFoundException('Reel not found');
    }

    const likes = await this.prisma.reelLike.findMany({
      where: { reelId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    const total = await this.prisma.reelLike.count({
      where: { reelId },
    });

    return {
      likes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Comment on a reel
   */
  async commentOnReel(userId: string, reelId: string, content: string) {
    if (!content || content.trim().length === 0) {
      throw new BadRequestException('Comment content cannot be empty');
    }

    const reel = await this.prisma.reel.findUnique({
      where: { id: reelId },
    });

    if (!reel) {
      throw new NotFoundException('Reel not found');
    }

    // Create comment and increment count atomically
    const [comment] = await this.prisma.$transaction([
      this.prisma.reelComment.create({
        data: {
          reelId,
          userId,
          content,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          },
        },
      }),
      this.prisma.reel.update({
        where: { id: reelId },
        data: {
          commentsCount: {
            increment: 1,
          },
        },
      }),
    ]);

    return comment;
  }

  /**
   * Get comments for a reel
   */
  async getReelComments(reelId: string, page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;

    const reel = await this.prisma.reel.findUnique({
      where: { id: reelId },
    });

    if (!reel) {
      throw new NotFoundException('Reel not found');
    }

    const comments = await this.prisma.reelComment.findMany({
      where: { reelId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    const total = await this.prisma.reelComment.count({
      where: { reelId },
    });

    return {
      comments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Increment view count for a reel
   */
  async incrementViewCount(reelId: string) {
    const reel = await this.prisma.reel.findUnique({
      where: { id: reelId },
    });

    if (!reel) {
      throw new NotFoundException('Reel not found');
    }

    await this.prisma.reel.update({
      where: { id: reelId },
      data: {
        viewsCount: {
          increment: 1,
        },
      },
    });

    return { message: 'View count incremented' };
  }

  /**
   * Search reels by hashtag
   */
  async searchReelsByHashtag(hashtag: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    if (!hashtag || hashtag.trim().length === 0) {
      throw new BadRequestException('Hashtag cannot be empty');
    }

    // Remove # if present
    const cleanHashtag = hashtag.replace('#', '').toLowerCase();

    const reels = await this.prisma.reel.findMany({
      where: {
        hashtags: {
          has: cleanHashtag,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        likes: true,
        comments: true,
      },
      orderBy: [
        { likesCount: 'desc' },
        { createdAt: 'desc' },
      ],
      skip,
      take: limit,
    });

    const total = await this.prisma.reel.count({
      where: {
        hashtags: {
          has: cleanHashtag,
        },
      },
    });

    return {
      reels,
      hashtag: cleanHashtag,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
