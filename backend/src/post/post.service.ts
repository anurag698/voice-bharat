import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MediaType } from '@prisma/client';

@Injectable()
export class PostService {
  constructor(private prisma: PrismaService) {}

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

    return comment;
  }
}
