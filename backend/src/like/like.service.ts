import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export class LikeResponseDto {
  id: string;
  postId: string;
  userId: string;
  createdAt: Date;
  user: {
    id: string;
    username: string;
    avatar: string | null;
    firstName: string;
    lastName: string;
  };
}

@Injectable()
export class LikeService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Like a post
   * Creates a like record and increments the post's like count
   */
  async likePost(userId: string, postId: string): Promise<{ message: string; liked: boolean }> {
    // Check if post exists
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Check if user already liked the post
    const existingLike = await this.prisma.like.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    if (existingLike) {
      throw new ConflictException('You have already liked this post');
    }

    // Create like
    await this.prisma.like.create({
      data: {
        userId,
        postId,
      },
    });

    // Increment like count on post
    await this.prisma.post.update({
      where: { id: postId },
      data: { likesCount: { increment: 1 } },
    });

    // TODO: Create notification for post owner
    // TODO: Award XP for liking (e.g., 1 XP)

    return { message: 'Post liked successfully', liked: true };
  }

  /**
   * Unlike a post
   * Removes the like record and decrements the post's like count
   */
  async unlikePost(userId: string, postId: string): Promise<{ message: string; liked: boolean }> {
    // Check if post exists
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Check if like exists
    const like = await this.prisma.like.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    if (!like) {
      throw new NotFoundException('You have not liked this post');
    }

    // Delete like
    await this.prisma.like.delete({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    // Decrement like count on post
    await this.prisma.post.update({
      where: { id: postId },
      data: { likesCount: { decrement: 1 } },
    });

    return { message: 'Post unliked successfully', liked: false };
  }

  /**
   * Toggle like on a post (like if not liked, unlike if liked)
   */
  async toggleLike(userId: string, postId: string): Promise<{ message: string; liked: boolean }> {
    // Check if post exists
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Check if like exists
    const existingLike = await this.prisma.like.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    if (existingLike) {
      // Unlike the post
      await this.prisma.like.delete({
        where: {
          postId_userId: {
            postId,
            userId,
          },
        },
      });

      await this.prisma.post.update({
        where: { id: postId },
        data: { likesCount: { decrement: 1 } },
      });

      return { message: 'Post unliked successfully', liked: false };
    } else {
      // Like the post
      await this.prisma.like.create({
        data: {
          userId,
          postId,
        },
      });

      await this.prisma.post.update({
        where: { id: postId },
        data: { likesCount: { increment: 1 } },
      });

      // TODO: Create notification for post owner
      // TODO: Award XP for liking (e.g., 1 XP)

      return { message: 'Post liked successfully', liked: true };
    }
  }

  /**
   * Get all likes for a specific post with pagination
   */
  async getLikesByPost(
    postId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ likes: LikeResponseDto[]; total: number; page: number; totalPages: number }> {
    // Validate pagination parameters
    if (page < 1) page = 1;
    if (limit < 1 || limit > 100) limit = 20;

    const skip = (page - 1) * limit;

    // Check if post exists
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Get likes with pagination
    const [likes, total] = await Promise.all([
      this.prisma.like.findMany({
        where: { postId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.like.count({
        where: { postId },
      }),
    ]);

    return {
      likes,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get all posts liked by a specific user
   */
  async getLikesByUser(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ likes: LikeResponseDto[]; total: number; page: number; totalPages: number }> {
    // Validate pagination parameters
    if (page < 1) page = 1;
    if (limit < 1 || limit > 100) limit = 20;

    const skip = (page - 1) * limit;

    // Get likes with pagination
    const [likes, total] = await Promise.all([
      this.prisma.like.findMany({
        where: { userId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.like.count({
        where: { userId },
      }),
    ]);

    return {
      likes,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Check if a user has liked a specific post
   */
  async hasUserLiked(postId: string, userId: string): Promise<boolean> {
    const like = await this.prisma.like.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    return !!like;
  }

  /**
   * Get like count for a post
   */
  async getLikeCount(postId: string): Promise<number> {
    return this.prisma.like.count({
      where: { postId },
    });
  }

  /**
   * Get multiple posts' like status for a user (batch check)
   */
  async getUserLikeStatus(postIds: string[], userId: string): Promise<Record<string, boolean>> {
    const likes = await this.prisma.like.findMany({
      where: {
        postId: { in: postIds },
        userId,
      },
      select: { postId: true },
    });

    const likeStatus: Record<string, boolean> = {};
    postIds.forEach((postId) => {
      likeStatus[postId] = likes.some((like) => like.postId === postId);
    });

    return likeStatus;
  }
}
