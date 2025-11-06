import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReactionType } from '@prisma/client';

// DTOs for Comment operations
export class CreateCommentDto {
  postId: string;
  content: string;
    parentId?: string;  // Optional: for nested/threaded comments
}

export class UpdateCommentDto {
  content: string;
}

export class CommentResponseDto {
  id: string;
  postId: string;
  userId: string;
  content: string;
    parentId: string | null;  // Parent comment ID for nested comments
  repliesCount: number;  // Number of replies to this comment
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    username: string;
    avatar: string | null;
    firstName: string;
    lastName: string;
  };
}

  // DTO for adding reaction
export class AddReactionDto {
  type: ReactionType;
}

@Injectable()
export class CommentService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new comment on a post
   */
  async createComment(
    userId: string,
    createCommentDto: CreateCommentDto,
  ): Promise<CommentResponseDto> {
    const { postId, content } = createCommentDto;

    // Validate content is not empty
    if (!content || content.trim().length === 0) {
      throw new BadRequestException('Comment content cannot be empty');
    }

    // Validate content length (max 2000 characters)
    if (content.length > 2000) {
      throw new BadRequestException('Comment content cannot exceed 2000 characters');
    }

    // Check if post exists
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

        // If parentId is provided, validate parent comment exists
    if (createCommentDto.parentId) {
      const parentComment = await this.prisma.comment.findUnique({
        where: { id: createCommentDto.parentId },
      });

      if (!parentComment) {
        throw new NotFoundException('Parent comment not found');
      }

      // Ensure parent comment belongs to the same post
      if (parentComment.postId !== postId) {
        throw new BadRequestException('Parent comment must belong to the same post');
      }
    }

    // Create comment
    const comment = await this.prisma.comment.create({
      data: {
        userId,
        postId,
        content: content.trim(),
              ...(createCommentDto.parentId && { parentId: createCommentDto.parentId }),
      },
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
    });

    // Increment comment count on post
    await this.prisma.post.update({
      where: { id: postId },
      data: { commentsCount: { increment: 1 } },
    });

        // If this is a reply, increment parent comment's repliesCount
    if (createCommentDto.parentId) {
      await this.prisma.comment.update({
        where: { id: createCommentDto.parentId },
        data: { repliesCount: { increment: 1 } },
      });
    }

    // TODO: Create notification for post owner
    // TODO: Award XP for commenting (e.g., 3 XP)

    return comment;
  }

  /**
   * Get all comments for a specific post with pagination
   */
  async getCommentsByPost(
    postId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ comments: CommentResponseDto[]; total: number; page: number; totalPages: number }> {
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

    // Get comments with pagination
    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
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
      this.prisma.comment.count({
        where: { postId },
      }),
    ]);

    return {
      comments,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get a single comment by ID
   */
  async getCommentById(commentId: string): Promise<CommentResponseDto> {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
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
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    return comment;
  }

  /**
   * Get all comments by a specific user
   */
  async getCommentsByUser(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ comments: CommentResponseDto[]; total: number; page: number; totalPages: number }> {
    // Validate pagination parameters
    if (page < 1) page = 1;
    if (limit < 1 || limit > 100) limit = 20;

    const skip = (page - 1) * limit;

    // Get comments with pagination
    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
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
      this.prisma.comment.count({
        where: { userId },
      }),
    ]);

    return {
      comments,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Update a comment
   */
  async updateComment(
    commentId: string,
    userId: string,
    updateCommentDto: UpdateCommentDto,
  ): Promise<CommentResponseDto> {
    const { content } = updateCommentDto;

    // Validate content
    if (!content || content.trim().length === 0) {
      throw new BadRequestException('Comment content cannot be empty');
    }

    if (content.length > 2000) {
      throw new BadRequestException('Comment content cannot exceed 2000 characters');
    }

    // Check if comment exists
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Check if user is the owner of the comment
    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    // Update comment
    const updatedComment = await this.prisma.comment.update({
      where: { id: commentId },
      data: { content: content.trim() },
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
    });

    return updatedComment;
  }

  /**
   * Delete a comment
   */
  async deleteComment(commentId: string, userId: string, isAdmin: boolean = false): Promise<{ message: string }> {
    // Check if comment exists
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Check if user is the owner or admin
    if (comment.userId !== userId && !isAdmin) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    // Delete comment
    await this.prisma.comment.delete({
      where: { id: commentId },
    });

    // Decrement comment count on post
    await this.prisma.post.update({
      where: { id: comment.postId },
      data: { commentsCount: { decrement: 1 } },
    });

        // If this comment is a reply, decrement parent's repliesCount
    if (comment.parentId) {
      await this.prisma.comment.update({
        where: { id: comment.parentId },
        data: { repliesCount: { decrement: 1 } },
      });
    }

    return { message: 'Comment deleted successfully' };
  }

  /**
   * Get comment count for a post
   */
  async getCommentCount(postId: string): Promise<number> {
    return this.prisma.comment.count({
      where: { postId },
    });
  }

  /**
   * Check if user has commented on a post
   */
  async hasUserCommented(postId: string, userId: string): Promise<boolean> {
    const comment = await this.prisma.comment.findFirst({
      where: {
        postId,
        userId,
      },
    });

    return !!comment;
  }

    /**
   * Get all replies to a specific comment (threaded comments)
   */
  async getCommentReplies(
    commentId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ replies: CommentResponseDto[]; total: number; page: number; totalPages: number }> {
    // Validate pagination parameters
    if (page < 1) page = 1;
    if (limit < 1 || limit > 100) limit = 10;

    const skip = (page - 1) * limit;

    // Check if parent comment exists
    const parentComment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!parentComment) {
      throw new NotFoundException('Parent comment not found');
    }

    // Get replies with pagination
    const [replies, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: { parentId: commentId },
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
        orderBy: { createdAt: 'asc' },  // Replies typically shown oldest first
        skip,
        take: limit,
      }),
      this.prisma.comment.count({
        where: { parentId: commentId },
      }),
    ]);

    return {
      replies,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

    /**
   * Add or update a reaction to a comment
   */
  async addReaction(
    commentId: string,
    userId: string,
    addReactionDto: AddReactionDto,
  ): Promise<{ message: string; reaction: any }> {
    const { type } = addReactionDto;

    // Check if comment exists
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Check if user already has this reaction type on this comment
    const existingReaction = await this.prisma.commentReaction.findUnique({
      where: {
        commentId_userId_type: {
          commentId,
          userId,
          type,
        },
      },
    });

    if (existingReaction) {
      // User already reacted with this type, remove it (toggle behavior)
      await this.prisma.commentReaction.delete({
        where: { id: existingReaction.id },
      });

      // Decrement reaction count
      await this.prisma.comment.update({
        where: { id: commentId },
        data: { reactionsCount: { decrement: 1 } },
      });

      return { message: 'Reaction removed', reaction: null };
    }

    // Create new reaction
    const reaction = await this.prisma.commentReaction.create({
      data: {
        commentId,
        userId,
        type,
      },
    });

    // Increment reaction count
    await this.prisma.comment.update({
      where: { id: commentId },
      data: { reactionsCount: { increment: 1 } },
    });

    return { message: 'Reaction added', reaction };
  }

  /**
   * Get all reactions for a comment
   */
  async getCommentReactions(
    commentId: string,
  ): Promise<{ type: ReactionType; count: number; users: any[] }[]> {
    // Check if comment exists
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Get all reactions grouped by type
    const reactions = await this.prisma.commentReaction.findMany({
      where: { commentId },
      include: {
        // We don't have user relation in CommentReaction, need to fetch separately
      },
    });

    // Group reactions by type and count
    const reactionSummary = reactions.reduce((acc, reaction) => {
      const existing = acc.find((r) => r.type === reaction.type);
      if (existing) {
        existing.count++;
        existing.userIds.push(reaction.userId);
      } else {
        acc.push({
          type: reaction.type,
          count: 1,
          userIds: [reaction.userId],
        });
      }
      return acc;
    }, [] as { type: ReactionType; count: number; userIds: string[] }[]);

    // Fetch user details for each reaction type
    const result = await Promise.all(
      reactionSummary.map(async (summary) => {
        const users = await this.prisma.user.findMany({
          where: { id: { in: summary.userIds } },
          select: {
            id: true,
            username: true,
            avatar: true,
            firstName: true,
            lastName: true,
          },
        });
        return {
          type: summary.type,
          count: summary.count,
          users,
        };
      }),
    );

    return result;
  }

  /**
   * Check if user has reacted to a comment
   */
  async getUserReaction(
    commentId: string,
    userId: string,
  ): Promise<ReactionType[]> {
    const reactions = await this.prisma.commentReaction.findMany({
      where: {
        commentId,
        userId,
      },
      select: {
        type: true,
      },
    });

    return reactions.map((r) => r.type);
  }
}
