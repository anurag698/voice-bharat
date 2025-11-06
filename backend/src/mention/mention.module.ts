import { Module } from '@nestjs/common';
import { MentionService } from './mention.service';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * MentionModule
 * 
 * Provides mention-related functionality for the VOCH platform.
 * This module handles extraction of @username mentions from content,
 * creation of mention records, and retrieval of mention data.
 * 
 * Features:
 * - Extract @mentions from post and comment content
 * - Create mention records in database
 * - Retrieve mentions for posts, comments, and users
 * - Support for mention-based notifications
 * 
 * Dependencies:
 * - PrismaModule: For database access
 */
@Module({
  imports: [PrismaModule],
  providers: [MentionService],
  exports: [MentionService], // Export for use in other modules (PostModule, CommentModule)
})
export class MentionModule {}
