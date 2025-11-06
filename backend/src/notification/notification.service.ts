import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export enum NotificationType {
  LIKE = 'LIKE',
  COMMENT = 'COMMENT',
  FOLLOW = 'FOLLOW',
  MESSAGE = 'MESSAGE',
  POLL_VOTE = 'POLL_VOTE',
  FUNDRAISER_DONATION = 'FUNDRAISER_DONATION',
  NGO_VERIFIED = 'NGO_VERIFIED',
  LEVEL_UP = 'LEVEL_UP',
  BADGE_EARNED = 'BADGE_EARNED',
}

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a notification
   * @param userId - User to receive notification
   * @param type - Notification type
   * @param message - Notification message
   * @param relatedId - Related entity ID (post, comment, etc.)
   * @param relatedUserId - User who triggered the notification
   */
  async createNotification(
    userId: number,
    type: NotificationType,
    message: string,
    relatedId?: number,
    relatedUserId?: number,
  ) {
    // Don't create notification if user is triggering action on themselves
    if (relatedUserId && userId === relatedUserId) {
      return null;
    }

    const notification = await this.prisma.notification.create({
      data: {
        userId,
        type,
        message,
        relatedId,
        relatedUserId,
        isRead: false,
      },
      include: {
        relatedUser: {
          select: {
            id: true,
            username: true,
            fullName: true,
            profilePicture: true,
          },
        },
      },
    });

    return notification;
  }

  /**
   * Create notification for post like
   */
  async notifyPostLike(postId: number, likedByUserId: number) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: { username: true },
        },
      },
    });

    if (!post) return null;

    const liker = await this.prisma.user.findUnique({
      where: { id: likedByUserId },
      select: { username: true },
    });

    return this.createNotification(
      post.authorId,
      NotificationType.LIKE,
      `${liker.username} liked your post`,
      postId,
      likedByUserId,
    );
  }

  /**
   * Create notification for comment
   */
  async notifyComment(postId: number, commentedByUserId: number) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) return null;

    const commenter = await this.prisma.user.findUnique({
      where: { id: commentedByUserId },
      select: { username: true },
    });

    return this.createNotification(
      post.authorId,
      NotificationType.COMMENT,
      `${commenter.username} commented on your post`,
      postId,
      commentedByUserId,
    );
  }

  /**
   * Create notification for follow
   */
  async notifyFollow(followedUserId: number, followerUserId: number) {
    const follower = await this.prisma.user.findUnique({
      where: { id: followerUserId },
      select: { username: true },
    });

    return this.createNotification(
      followedUserId,
      NotificationType.FOLLOW,
      `${follower.username} started following you`,
      followerUserId,
      followerUserId,
    );
  }

  /**
   * Create notification for message
   */
  async notifyMessage(receiverId: number, senderId: number) {
    const sender = await this.prisma.user.findUnique({
      where: { id: senderId },
      select: { username: true },
    });

    return this.createNotification(
      receiverId,
      NotificationType.MESSAGE,
      `${sender.username} sent you a message`,
      senderId,
      senderId,
    );
  }

  /**
   * Create notification for poll vote
   */
  async notifyPollVote(pollId: number, votedByUserId: number) {
    const poll = await this.prisma.poll.findUnique({
      where: { id: pollId },
    });

    if (!poll) return null;

    const voter = await this.prisma.user.findUnique({
      where: { id: votedByUserId },
      select: { username: true },
    });

    return this.createNotification(
      poll.authorId,
      NotificationType.POLL_VOTE,
      `${voter.username} voted on your poll`,
      pollId,
      votedByUserId,
    );
  }

  /**
   * Create notification for fundraiser donation
   */
  async notifyDonation(
    fundraiserId: number,
    donorUserId: number,
    amount: number,
  ) {
    const fundraiser = await this.prisma.fundraiser.findUnique({
      where: { id: fundraiserId },
      include: {
        ngo: {
          select: { userId: true },
        },
      },
    });

    if (!fundraiser) return null;

    const donor = await this.prisma.user.findUnique({
      where: { id: donorUserId },
      select: { username: true },
    });

    return this.createNotification(
      fundraiser.ngo.userId,
      NotificationType.FUNDRAISER_DONATION,
      `${donor.username} donated ₹${amount} to your fundraiser`,
      fundraiserId,
      donorUserId,
    );
  }

  /**
   * Create notification for NGO verification
   */
  async notifyNGOVerification(userId: number, verified: boolean) {
    return this.createNotification(
      userId,
      NotificationType.NGO_VERIFIED,
      verified
        ? 'Your NGO profile has been verified! You can now create fundraisers.'
        : 'Your NGO verification request has been reviewed.',
      null,
      null,
    );
  }

  /**
   * Create notification for level up
   */
  async notifyLevelUp(userId: number, newLevel: number) {
    return this.createNotification(
      userId,
      NotificationType.LEVEL_UP,
      `Congratulations! You've reached Level ${newLevel}! 🎉`,
      null,
      null,
    );
  }

  /**
   * Create notification for badge earned
   */
  async notifyBadgeEarned(userId: number, badgeName: string) {
    return this.createNotification(
      userId,
      NotificationType.BADGE_EARNED,
      `You've earned the "${badgeName}" badge! 🏆`,
      null,
      null,
    );
  }

  /**
   * Get all notifications for a user
   */
  async getNotifications(
    userId: number,
    page: number = 1,
    limit: number = 20,
  ) {
    const notifications = await this.prisma.notification.findMany({
      where: { userId },
      include: {
        relatedUser: {
          select: {
            id: true,
            username: true,
            fullName: true,
            profilePicture: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalCount = await this.prisma.notification.count({
      where: { userId },
    });

    return {
      notifications,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  /**
   * Get unread notifications count
   */
  async getUnreadCount(userId: number) {
    const count = await this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    return { unreadCount: count };
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: number, userId: number) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new NotFoundException('Notification not found');
    }

    await this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    return { success: true, message: 'Notification marked as read' };
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: number) {
    await this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: { isRead: true },
    });

    return { success: true, message: 'All notifications marked as read' };
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: number, userId: number) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new NotFoundException('Notification not found');
    }

    await this.prisma.notification.delete({
      where: { id: notificationId },
    });

    return { success: true, message: 'Notification deleted' };
  }

  /**
   * Delete all read notifications
   */
  async deleteAllRead(userId: number) {
    await this.prisma.notification.deleteMany({
      where: {
        userId,
        isRead: true,
      },
    });

    return { success: true, message: 'All read notifications deleted' };
  }
}
