import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityType, BadgeType } from '@prisma/client';

// XP Rewards Configuration
const XP_REWARDS = {
  LOGIN: 5,
  POST_CREATED: 10,
  COMMENT_ADDED: 5,
  POLL_CREATED: 15,
  POLL_VOTED: 3,
  REEL_UPLOADED: 20,
  FUNDRAISER_SUPPORTED: 50,
  POST_SHARED: 8,
  MILESTONE_REACHED: 100,
};

// Level Thresholds (XP required for each level)
const LEVEL_THRESHOLDS = [
  0,      // Level 1
  100,    // Level 2
  250,    // Level 3
  500,    // Level 4
  1000,   // Level 5
  2000,   // Level 6
  3500,   // Level 7
  5500,   // Level 8
  8000,   // Level 9
  11000,  // Level 10
  15000,  // Level 11
  20000,  // Level 12
  26000,  // Level 13
  33000,  // Level 14
  41000,  // Level 15
  50000,  // Level 16+
];

@Injectable()
export class GamificationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Award XP to user for an activity
   */
  async awardXP(userId: string, activityType: ActivityType, metadata?: any) {
    const xpAmount = XP_REWARDS[activityType] || 0;

    if (xpAmount === 0) {
      throw new BadRequestException('Invalid activity type');
    }

    // Get current user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const currentXP = user.xp;
    const currentLevel = user.level;
    const newXP = currentXP + xpAmount;

    // Calculate new level
    const newLevel = this.calculateLevel(newXP);
    const leveledUp = newLevel > currentLevel;

    // Update user XP and level
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        xp: newXP,
        level: newLevel,
      },
    });

    // Log activity
    await this.prisma.activity.create({
      data: {
        userId,
        type: activityType,
        xpEarned: xpAmount,
        metadata,
      },
    });

    return {
      xpEarned: xpAmount,
      totalXP: newXP,
      currentLevel: newLevel,
      leveledUp,
      nextLevelXP: this.getNextLevelXP(newLevel),
    };
  }

  /**
   * Calculate level based on XP
   */
  private calculateLevel(xp: number): number {
    for (let level = LEVEL_THRESHOLDS.length - 1; level >= 0; level--) {
      if (xp >= LEVEL_THRESHOLDS[level]) {
        return level + 1;
      }
    }
    return 1;
  }

  /**
   * Get XP required for next level
   */
  private getNextLevelXP(currentLevel: number): number {
    if (currentLevel < LEVEL_THRESHOLDS.length) {
      return LEVEL_THRESHOLDS[currentLevel];
    }
    // For levels beyond threshold array, use exponential growth
    return LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] + (currentLevel - LEVEL_THRESHOLDS.length + 1) * 10000;
  }

  /**
   * Get user's gamification stats
   */
  async getUserStats(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        level: true,
        xp: true,
        badges: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const nextLevelXP = this.getNextLevelXP(user.level);
    const currentLevelXP = user.level > 1 ? LEVEL_THRESHOLDS[user.level - 1] : 0;
    const xpForCurrentLevel = user.xp - currentLevelXP;
    const xpNeededForNextLevel = nextLevelXP - user.xp;

    return {
      userId: user.id,
      username: user.username,
      level: user.level,
      totalXP: user.xp,
      currentLevelXP: xpForCurrentLevel,
      nextLevelXP: nextLevelXP,
      xpToNextLevel: xpNeededForNextLevel,
      badges: user.badges || [],
      progress: (xpForCurrentLevel / (nextLevelXP - currentLevelXP)) * 100,
    };
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;

    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        username: true,
        avatar: true,
        level: true,
        xp: true,
        badges: true,
      },
      orderBy: [
        { level: 'desc' },
        { xp: 'desc' },
      ],
      skip,
      take: limit,
    });

    const total = await this.prisma.user.count();

    const leaderboard = users.map((user, index) => ({
      rank: skip + index + 1,
      ...user,
      badgeCount: Array.isArray(user.badges) ? user.badges.length : 0,
    }));

    return {
      leaderboard,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Award badge to user
   */
  async awardBadge(userId: string, badgeType: BadgeType, reason?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get badge details
    const badge = await this.prisma.badge.findFirst({
      where: { type: badgeType },
    });

    if (!badge) {
      throw new NotFoundException('Badge not found');
    }

    // Check if user already has this badge
    const userBadges = Array.isArray(user.badges) ? user.badges : [];
    const hasBadge = userBadges.some((b: any) => b.type === badgeType);

    if (hasBadge) {
      throw new BadRequestException('User already has this badge');
    }

    // Add badge to user
    const newBadge = {
      type: badgeType,
      name: badge.name,
      icon: badge.icon,
      earnedAt: new Date().toISOString(),
      reason,
    };

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        badges: [...userBadges, newBadge],
        xp: { increment: badge.xpReward },
      },
    });

    return {
      badge: newBadge,
      xpReward: badge.xpReward,
      message: `Badge "${badge.name}" earned!`,
    };
  }

  /**
   * Get all available badges
   */
  async getAllBadges() {
    return this.prisma.badge.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Get user's badges
   */
  async getUserBadges(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        badges: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      badges: user.badges || [],
      badgeCount: Array.isArray(user.badges) ? user.badges.length : 0,
    };
  }

  /**
   * Get user's activity history
   */
  async getUserActivityHistory(userId: string, page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const activities = await this.prisma.activity.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    const total = await this.prisma.activity.count({
      where: { userId },
    });

    return {
      activities,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Check and award milestone badges
   */
  async checkMilestones(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        posts: true,
        reels: true,
        polls: true,
        donations: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const userBadges = Array.isArray(user.badges) ? user.badges : [];
    const badges = [];

    // Check for Content Creator badge (10+ posts)
    if (user.posts.length >= 10 && !userBadges.some((b: any) => b.type === BadgeType.CONTENT_CREATOR)) {
      try {
        const badge = await this.awardBadge(userId, BadgeType.CONTENT_CREATOR, 'Created 10 posts');
        badges.push(badge);
      } catch (e) {}
    }

    // Check for Influencer badge (50+ reels)
    if (user.reels.length >= 50 && !userBadges.some((b: any) => b.type === BadgeType.INFLUENCER)) {
      try {
        const badge = await this.awardBadge(userId, BadgeType.INFLUENCER, 'Uploaded 50 reels');
        badges.push(badge);
      } catch (e) {}
    }

    // Check for Poll Master badge (20+ polls)
    if (user.polls.length >= 20 && !userBadges.some((b: any) => b.type === BadgeType.POLL_MASTER)) {
      try {
        const badge = await this.awardBadge(userId, BadgeType.POLL_MASTER, 'Created 20 polls');
        badges.push(badge);
      } catch (e) {}
    }

    // Check for Cause Champion badge (10+ donations)
    if (user.donations.length >= 10 && !userBadges.some((b: any) => b.type === BadgeType.CAUSE_CHAMPION)) {
      try {
        const badge = await this.awardBadge(userId, BadgeType.CAUSE_CHAMPION, 'Supported 10 causes');
        badges.push(badge);
      } catch (e) {}
    }

    return {
      newBadges: badges,
      message: badges.length > 0 ? `Earned ${badges.length} new badge(s)!` : 'No new badges',
    };
  }

  /**
   * Get top performers by activity type
   */
  async getTopPerformers(activityType?: ActivityType, limit: number = 10) {
    if (activityType) {
      // Get top performers for specific activity
      const activities = await this.prisma.activity.groupBy({
        by: ['userId'],
        where: { type: activityType },
        _sum: { xpEarned: true },
        _count: true,
        orderBy: { _sum: { xpEarned: 'desc' } },
        take: limit,
      });

      const userIds = activities.map(a => a.userId);
      const users = await this.prisma.user.findMany({
        where: { id: { in: userIds } },
        select: {
          id: true,
          username: true,
          avatar: true,
          level: true,
        },
      });

      return activities.map((activity, index) => {
        const user = users.find(u => u.id === activity.userId);
        return {
          rank: index + 1,
          user,
          totalXP: activity._sum.xpEarned || 0,
          activityCount: activity._count,
        };
      });
    } else {
      // Get overall top performers
      const users = await this.prisma.user.findMany({
        select: {
          id: true,
          username: true,
          avatar: true,
          level: true,
          xp: true,
        },
        orderBy: [
          { level: 'desc' },
          { xp: 'desc' },
        ],
        take: limit,
      });

      return users.map((user, index) => ({
        rank: index + 1,
        user: {
          id: user.id,
          username: user.username,
          avatar: user.avatar,
          level: user.level,
        },
        totalXP: user.xp,
      }));
    }
  }
}
