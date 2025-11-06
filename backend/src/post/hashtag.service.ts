import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HashtagService {
  constructor(private prisma: PrismaService) {}

  /**
   * Extract hashtags from text content
   * Matches #word patterns, supports Unicode for Indian languages
   */
  extractHashtags(content: string): string[] {
    // Regex to match hashtags (# followed by alphanumeric + Unicode chars)
    const hashtagRegex = /#([\w\u0900-\u097F\u0980-\u09FF\u0A00-\u0A7F\u0A80-\u0AFF\u0B00-\u0B7F\u0B80-\u0BFF\u0C00-\u0C7F\u0C80-\u0CFF\u0D00-\u0D7F]+)/g;
    
    const matches = content.match(hashtagRegex);
    
    if (!matches) {
      return [];
    }
    
    // Remove # and convert to lowercase for consistency
    return matches.map(tag => tag.substring(1).toLowerCase());
  }

  /**
   * Process and store hashtags for a post
   * Updates usage count and trending score
   */
  async processHashtags(hashtags: string[]): Promise<void> {
    const uniqueHashtags = [...new Set(hashtags)];
    
    for (const tag of uniqueHashtags) {
      await this.prisma.hashtag.upsert({
        where: { tag },
        update: {
          usageCount: {
            increment: 1,
          },
          lastUsedAt: new Date(),
          // Simple trending score: recent usage counts more
          trendingScore: {
            increment: 1,
          },
        },
        create: {
          tag,
          usageCount: 1,
          trendingScore: 1,
          lastUsedAt: new Date(),
        },
      });
    }
  }

  /**
   * Get trending hashtags
   */
  async getTrendingHashtags(limit: number = 10) {
    return this.prisma.hashtag.findMany({
      orderBy: {
        trendingScore: 'desc',
      },
      take: limit,
      select: {
        tag: true,
        usageCount: true,
        trendingScore: true,
      },
    });
  }

  /**
   * Search hashtags by partial match
   */
  async searchHashtags(query: string, limit: number = 20) {
    return this.prisma.hashtag.findMany({
      where: {
        tag: {
          contains: query.toLowerCase(),
          mode: 'insensitive',
        },
      },
      orderBy: {
        usageCount: 'desc',
      },
      take: limit,
      select: {
        tag: true,
        usageCount: true,
      },
    });
  }

  /**
   * Decay trending scores periodically (should be run via cron)
   * This ensures old popular tags don't stay trending forever
   */
  async decayTrendingScores(): Promise<void> {
    // Reduce all trending scores by 10%
    await this.prisma.$executeRaw`
      UPDATE "Hashtag"
      SET "trendingScore" = "trendingScore" * 0.9
      WHERE "trendingScore" > 0
    `;
  }
}
