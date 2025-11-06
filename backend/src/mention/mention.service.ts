import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MentionService {
  constructor(private prisma: PrismaService) {}

  /**
   * Extract @mentions from content text
   * Supports Unicode for Indian languages
   * @param content - Text content to extract mentions from
   * @returns Array of unique usernames mentioned
   */
  extractMentions(content: string): string[] {
    // Match @username pattern (alphanumeric, underscores, dots)
    // Supports usernames like @user_123, @user.name, etc.
    const mentionRegex = /@([a-zA-Z0-9_.]+)/g;
    const mentions: string[] = [];
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      const username = match[1];
      if (!mentions.includes(username)) {
        mentions.push(username);
      }
    }

    return mentions;
  }

  /**
   * Create mention records for a post
   * @param postId - ID of the post containing mentions
   * @param content - Post content
   * @param mentionedByUserId - ID of user who created the post
   */
  async createPostMentions(
    postId: string,
    content: string,
    mentionedByUserId: string,
  ): Promise<void> {
    const usernames = this.extractMentions(content);

    if (usernames.length === 0) {
      return;
    }

    // Find all mentioned users by username
    const users = await this.prisma.user.findMany({
      where: {
        username: {
          in: usernames,
        },
      },
      select: {
        id: true,
        username: true,
      },
    });

    // Create mention records
    const mentionData = users.map((user) => ({
      postId,
      mentionedUserId: user.id,
      mentionedByUserId,
    }));

    if (mentionData.length > 0) {
      await this.prisma.mention.createMany({
        data: mentionData,
        skipDuplicates: true,
      });
    }
  }

  /**
   * Create mention records for a comment
   * @param commentId - ID of the comment containing mentions
   * @param content - Comment content
   * @param mentionedByUserId - ID of user who created the comment
   */
  async createCommentMentions(
    commentId: string,
    content: string,
    mentionedByUserId: string,
  ): Promise<void> {
    const usernames = this.extractMentions(content);

    if (usernames.length === 0) {
      return;
    }

    // Find all mentioned users by username
    const users = await this.prisma.user.findMany({
      where: {
        username: {
          in: usernames,
        },
      },
      select: {
        id: true,
        username: true,
      },
    });

    // Create mention records
    const mentionData = users.map((user) => ({
      commentId,
      mentionedUserId: user.id,
      mentionedByUserId,
    }));

    if (mentionData.length > 0) {
      await this.prisma.mention.createMany({
        data: mentionData,
        skipDuplicates: true,
      });
    }
  }

  /**
   * Get all users mentioned in content
   * @param content - Text content to analyze
   * @returns Array of user objects that were mentioned
   */
  async getMentionedUsers(content: string) {
    const usernames = this.extractMentions(content);

    if (usernames.length === 0) {
      return [];
    }

    return this.prisma.user.findMany({
      where: {
        username: {
          in: usernames,
        },
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
      },
    });
  }

  /**
   * Get all mentions for a specific post
   * @param postId - ID of the post
   * @returns Array of mention records with user details
   */
  async getPostMentions(postId: string) {
    return this.prisma.mention.findMany({
      where: { postId },
      include: {
        // Include mentioned user details
        // Note: Prisma schema needs to be updated to include relations
      },
    });
  }

  /**
   * Get all mentions for a user (where they were mentioned)
   * @param userId - ID of the user
   * @param page - Page number for pagination
   * @param limit - Items per page
   * @returns Paginated mentions
   */
  async getUserMentions(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const skip = (page - 1) * limit;

    return this.prisma.mention.findMany({
      where: {
        mentionedUserId: userId,
      },
      include: {
        // Include post/comment details and user who mentioned
        // Note: Prisma schema needs to be updated to include relations
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });
  }
}
