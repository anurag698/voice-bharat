import { Module } from '@nestjs/common';
import { FeedService } from './feed.service';
import { FeedController } from './feed.controller';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * Feed Module - Manages feed functionality
 * 
 * Provides:
 * - Personalized feed ranking
 * - Following feed
 * - Trending content
 * - Real-time feed updates (future)
 * 
 * Dependencies:
 * - PrismaModule for database access
 * - Redis for caching (future)
 */
@Module({
  imports: [PrismaModule],
  controllers: [FeedController],
  providers: [FeedService],
  exports: [FeedService], // Export for use in other modules
})
export class FeedModule {}
