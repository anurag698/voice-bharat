import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MediaType, ReactionType } from '@prisma/client';
import { HashtagService } from './hashtag.service';

@Injectable()
export class PostService {
  constructor(private prisma: PrismaService, private hashtagService: HashtagService) {}

  async getFeed(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    // Get posts from users that the current user follows + own posts
    const posts = await this.prisma.post.findMany({
      where: {
        OR: [
          {
            author: {
              followers: {
                some: {
                  followerId: userId,
                },
              },
            },
          },
          {
            authorId: userId,
          },
        ],
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
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
      skip,
      take: limit,
    });

    return posts;
  }

  async getPostById(postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        comments: {
          include: {
            author: {
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
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return post;
  }

  async createPost(userId: string, data: {
    content: string;
    mediaUrls?: string[];
    mediaType?: MediaType;
  }) {
        // Extract hashtags from content for processing
        const hashtags = this.hashtagService.extractHashtags(data.content);
    
    const post = await this.prisma.post.create({
      data: {
        content: data.content,
        mediaUrls: data.mediaUrls || [],
        mediaType: data.mediaType || MediaType.TEXT,
        authorId: userId,
      },
      include: {
        author: {
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

        // Process hashtags asynchronously (non-blocking)
        if (hashtags.length > 0) {
                this.hashtagService.processHashtags(hashtags).catch((err) => {
                          // Log error but don't fail post creation
                          console.error('Failed to process hashtags:', err);
                        });
              }

    // Award XP for creating post
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        xp: {
          increment: 5, // 5 XP for posting
        },
      },
    });

    return post;
  }

  async updatePost(postId: string, userId: string, data: { content?: string }) {
    // Check if user owns the post
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.authorId !== userId) {
      throw new ForbiddenException('You can only edit your own posts');
    }

    return this.prisma.post.update({
      where: { id: postId },
      data,
    });
  }

  async deletePost(postId: string, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own posts');
    }

    return this.prisma.post.delete({
      where: { id: postId },
    });
  }

  async likePost(postId: string, userId: string) {
    // Check if already liked
    const existingLike = await this.prisma.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (existingLike) {
      // Unlike
      return this.prisma.like.delete({
        where: {
          userId_postId: {
            userId,
            postId,
          },
        },
      });
    }

    // Like
    return this.prisma.like.create({
      data: {
        userId,
        postId,
      },
    });
  }

  async addComment(postId: string, userId: string, content: string) {
    const comment = await this.prisma.comment.create({
      data: {
        content,
        postId,
        authorId: userId,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    // Award XP for commenting
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        xp: {
          increment: 2, // 2 XP for commenting
        },
      },
    });

   
    
      // Post Reaction Methods
  async addPostReaction(
    postId: string,
    userId: string,
    type: ReactionType,
  ): Promise<{ message: string }> {
    // Verify post exists
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Check if reaction already exists
    const existingReaction = await this.prisma.postReaction.findUnique({
      where: {
        postId_userId_type: {
          postId,
          userId,
          type,
        },
      },
    });

    if (existingReaction) {
      // Remove reaction (toggle off)
      await this.prisma.$transaction([
        this.prisma.postReaction.delete({
          where: { id: existingReaction.id },
        }),
        this.prisma.post.update({
          where: { id: postId },
          data: { reactionsCount: { decrement: 1 } },
        }),
      ]);

      return { message: 'Reaction removed' };
    }

    // Add new reaction
    await this.prisma.$transaction([
      this.prisma.postReaction.create({
        data: {
          postId,
          userId,
          type,
        },
      }),
      this.prisma.post.update({
        where: { id: postId },
        data: { reactionsCount: { increment: 1 } },
      }),
    ]);

    return { message: 'Reaction added' };
  }

  async getPostReactions(postId: string) {
    // Verify post exists
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Get all reactions grouped by type
    const reactions = await this.prisma.postReaction.findMany({
      where: { postId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group reactions by type
    const groupedReactions = reactions.reduce(
      (acc, reaction) => {
        const existing = acc.find((r) => r.type === reaction.type);
        if (existing) {
          existing.count++;
          existing.users.push(reaction.user);
        } else {
          acc.push({
            type: reaction.type,
            count: 1,
            users: [reaction.user],
          });
        }
        return acc;
      },
      [] as Array<{
        type: ReactionType;
        count: number;
        users: Array<{ id: string; username: string; avatar: string | null }>;
      }>,
    );

    return groupedReactions;
  }

  async getUserPostReaction(
    postId: string,
    userId: string,
  ): Promise<ReactionType[]> {
    // Get all reaction types the user has added to this post
    const reactions = await this.prisma.postReaction.findMany({
      where: {
        postId,
        userId,
      },
      select: {
        type: true,
      },
    });

    return reactions.map((r) => r.type);
  }return comment;
  }
}
