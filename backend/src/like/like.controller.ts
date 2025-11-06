import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { LikeService } from './like.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('likes')
@Controller('likes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LikeController {
  constructor(private readonly likeService: LikeService) {}

  @Post(':postId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Like a post' })
  @ApiParam({ name: 'postId', description: 'Post ID to like', type: String })
  @ApiResponse({ status: 200, description: 'Post liked successfully' })
  @ApiResponse({ status: 409, description: 'Already liked this post' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async likePost(@Request() req, @Param('postId') postId: string) {
    return this.likeService.likePost(req.user.userId, postId);
  }

  @Delete(':postId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unlike a post' })
  @ApiParam({ name: 'postId', description: 'Post ID to unlike', type: String })
  @ApiResponse({ status: 200, description: 'Post unliked successfully' })
  @ApiResponse({ status: 404, description: 'Post not found or not liked' })
  async unlikePost(@Request() req, @Param('postId') postId: string) {
    return this.likeService.unlikePost(req.user.userId, postId);
  }

  @Post('toggle/:postId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle like on a post (like if not liked, unlike if liked)' })
  @ApiParam({ name: 'postId', description: 'Post ID to toggle like', type: String })
  @ApiResponse({ status: 200, description: 'Like toggled successfully' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async toggleLike(@Request() req, @Param('postId') postId: string) {
    return this.likeService.toggleLike(req.user.userId, postId);
  }

  @Get('post/:postId')
  @ApiOperation({ summary: 'Get all likes for a specific post' })
  @ApiParam({ name: 'postId', description: 'Post ID', type: String })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Likes per page (default: 20, max: 100)' })
  @ApiResponse({ status: 200, description: 'Likes retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async getLikesByPost(
    @Param('postId') postId: string,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.likeService.getLikesByPost(postId, page, limit);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all posts liked by a specific user' })
  @ApiParam({ name: 'userId', description: 'User ID', type: String })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Likes per page (default: 20, max: 100)' })
  @ApiResponse({ status: 200, description: 'User likes retrieved successfully' })
  async getLikesByUser(
    @Param('userId') userId: string,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.likeService.getLikesByUser(userId, page, limit);
  }

  @Get('post/:postId/count')
  @ApiOperation({ summary: 'Get like count for a post' })
  @ApiParam({ name: 'postId', description: 'Post ID', type: String })
  @ApiResponse({ status: 200, description: 'Like count retrieved successfully' })
  async getLikeCount(@Param('postId') postId: string) {
    const count = await this.likeService.getLikeCount(postId);
    return { count };
  }

  @Get('post/:postId/check')
  @ApiOperation({ summary: 'Check if current user has liked a post' })
  @ApiParam({ name: 'postId', description: 'Post ID', type: String })
  @ApiResponse({ status: 200, description: 'Like status retrieved successfully' })
  async hasUserLiked(@Request() req, @Param('postId') postId: string) {
    const liked = await this.likeService.hasUserLiked(postId, req.user.userId);
    return { liked };
  }

  @Post('batch/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get like status for multiple posts (batch check for feed rendering)' })
  @ApiBody({ description: 'Array of post IDs', schema: { type: 'object', properties: { postIds: { type: 'array', items: { type: 'string' } } } } })
  @ApiResponse({ status: 200, description: 'Batch like status retrieved successfully' })
  async getUserLikeStatus(@Request() req, @Body('postIds') postIds: string[]) {
    return this.likeService.getUserLikeStatus(postIds, req.user.userId);
  }
}
