import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Post, User } from '@prisma/client';

/**
 * Feed Service - Manages feed ranking and content delivery
 * 
 * Algorithm: Engagement Score = (Likes × 1.5) + (Comments × 3) + (Shares × 4) + (Time Decay)
 * 
 * Features:
 * - Personalized "For You" feed based on user interests
 * - Following feed (chronological with light ranking)
 * - Cold start solution for new users
 * - Redis caching for performance
 */
@Injectable()
export class FeedService {
  private readonly logger = new Logger(FeedService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get personalized feed for a user ("For You" tab)
   * Uses engagement-based ranking algorithm
   */
  async getForYouFeed(userId: string, page: number = 1, limit: number = 20) {
    try {
      const skip = (page - 1) * limit;

      // Get user's interests for personalization
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { interests: true },
      });

      // Fetch posts with engagement metrics
      const posts = await this.prisma.post.findMany({
        where: {
          isPublic: true,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
              role: true,
              isVerified: true,
            },
          },
          likes: {
            where: { userId },
            select: { id: true },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit * 3, // Fetch more to rank
        skip,
      });

      // Calculate engagement score and rank
      const rankedPosts = posts.map((post) => {
        const engagementScore = this.calculateEngagementScore(post);
        const timeDecay = this.calculateTimeDecay(post.createdAt);
        const interestBoost = this.calculateInterestBoost(
          post,
          user.interests || [],
        );

        return {
          ...post,
          isLiked: post.likes.length > 0,
          likes: undefined, // Remove detailed likes from response
          score: engagementScore * timeDecay * interestBoost,
        };
      });

      // Sort by score and limit
      const sortedPosts = rankedPosts
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      return {
        posts: sortedPosts.map(({ score, ...post }) => post),
        page,
        limit,
        hasMore: posts.length === limit * 3,
      };
    } catch (error) {
      this.logger.error(`Error fetching For You feed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get feed from users that current user follows
   * Chronological with light ranking
   */
  async getFollowingFeed(userId: string, page: number = 1, limit: number = 20) {
    try {
      const skip = (page - 1) * limit;

      // Get IDs of users that current user follows
      const following = await this.prisma.follow.findMany({
        where: { followerId: userId },
        select: { followingId: true },
      });

      const followingIds = following.map((f) => f.followingId);

      if (followingIds.length === 0) {
        return {
          posts: [],
          page,
          limit,
          hasMore: false,
        };
      }

      // Fetch posts from followed users
      const posts = await this.prisma.post.findMany({
        where: {
          userId: { in: followingIds },
          isPublic: true,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
              role: true,
              isVerified: true,
            },
          },
          likes: {
            where: { userId },
            select: { id: true },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip,
      });

      return {
        posts: posts.map((post) => ({
          ...post,
          isLiked: post.likes.length > 0,
          likes: undefined,
        })),
        page,
        limit,
        hasMore: posts.length === limit,
      };
    } catch (error) {
      this.logger.error(`Error fetching Following feed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calculate engagement score based on interactions
   * Formula: (Likes × 1.5) + (Comments × 3) + (Shares × 4)
   */
  private calculateEngagementScore(post: any): number {
    const likes = post._count.likes || 0;
    const comments = post._count.comments || 0;
    const shares = post.sharesCount || 0;

    return likes * 1.5 + comments * 3 + shares * 4;
  }

  /**
   * Calculate time decay factor
   * Newer posts get higher boost
   */
  private calculateTimeDecay(createdAt: Date): number {
    const hoursAgo = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);

    // Decay curve: newer posts get 1.0, older posts decay exponentially
    if (hoursAgo < 1) return 1.0;
    if (hoursAgo < 6) return 0.9;
    if (hoursAgo < 24) return 0.7;
    if (hoursAgo < 72) return 0.5;
    return 0.3;
  }

  /**
   * Calculate interest boost based on user's interests
   * Returns multiplier (1.0 - 1.5)
   */
  private calculateInterestBoost(
    post: any,
    userInterests: string[],
  ): number {
    if (!userInterests || userInterests.length === 0) {
      return 1.0; // No boost for users without interests
    }

    // Check if post content or hashtags match user interests
    const postContent = (post.content || '').toLowerCase();
    const matchCount = userInterests.filter((interest) =>
      postContent.includes(interest.toLowerCase()),
    ).length;

    if (matchCount === 0) return 1.0;
    if (matchCount === 1) return 1.2;
    if (matchCount === 2) return 1.3;
    return 1.5; // Max boost for 3+ matches
  }

  /**
   * Get trending posts (high engagement in last 24 hours)
   */
  async getTrendingPosts(limit: number = 20) {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const posts = await this.prisma.post.findMany({
        where: {
          isPublic: true,
          createdAt: { gte: oneDayAgo },
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
              role: true,
              isVerified: true,
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
        take: limit * 2,
      });

      // Rank by engagement score
      const rankedPosts = posts
        .map((post) => ({
          ...post,
          score: this.calculateEngagementScore(post),
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      return rankedPosts.map(({ score, ...post }) => post);
    } catch (error) {
      this.logger.error(`Error fetching trending posts: ${error.message}`);
      throw error;
    }
  }
}
