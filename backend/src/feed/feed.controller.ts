import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { FeedService } from './feed.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';

/**
 * Feed Controller - REST API endpoints for feed management
 * 
 * Endpoints:
 * - GET /feed/for-you - Personalized feed
 * - GET /feed/following - Following feed
 * - GET /feed/trending - Trending posts
 */
@ApiTags('feed')
@Controller('feed')
@UseGuards(JwtAuthGuard)
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  /**
   * Get personalized "For You" feed
   * Uses AI-based ranking algorithm
   * 
   * @route GET /feed/for-you
   * @access Private (requires authentication)
   */
  @Get('for-you')
  @ApiOperation({ summary: 'Get personalized For You feed' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20)' })
  @ApiResponse({ status: 200, description: 'Feed retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getForYouFeed(
    @Request() req,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    const userId = req.user.userId;
    return this.feedService.getForYouFeed(userId, page, limit);
  }

  /**
   * Get feed from followed users
   * Chronological order with light ranking
   * 
   * @route GET /feed/following
   * @access Private (requires authentication)
   */
  @Get('following')
  @ApiOperation({ summary: 'Get feed from users you follow' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20)' })
  @ApiResponse({ status: 200, description: 'Following feed retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getFollowingFeed(
    @Request() req,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    const userId = req.user.userId;
    return this.feedService.getFollowingFeed(userId, page, limit);
  }

  /**
   * Get trending posts
   * High engagement posts from last 24 hours
   * 
   * @route GET /feed/trending
   * @access Private (requires authentication)
   */
  @Get('trending')
  @ApiOperation({ summary: 'Get trending posts (last 24h)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of posts (default: 20)' })
  @ApiResponse({ status: 200, description: 'Trending posts retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getTrendingPosts(
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.feedService.getTrendingPosts(limit);
  }
}
