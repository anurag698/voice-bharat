import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReelService } from './reel.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('reels')
@Controller('reels')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReelController {
  constructor(private readonly reelService: ReelService) {}

  @Post()
  @ApiOperation({ summary: 'Upload a new reel' })
  @ApiResponse({ status: 201, description: 'Reel uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async uploadReel(
    @Request() req,
    @Body() body: {
      caption?: string;
      videoUrl: string;
      thumbnailUrl: string;
      duration: number;
      soundUrl?: string;
      hashtags: string[];
    },
  ) {
    return this.reelService.uploadReel(
      req.user.userId,
      body.caption || null,
      body.videoUrl,
      body.thumbnailUrl,
      body.duration,
      body.soundUrl || null,
      body.hashtags || [],
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a reel by ID' })
  @ApiResponse({ status: 200, description: 'Reel retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Reel not found' })
  async getReel(@Param('id') id: string) {
    return this.reelService.getReel(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a reel' })
  @ApiResponse({ status: 200, description: 'Reel deleted successfully' })
  @ApiResponse({ status: 403, description: 'Not authorized to delete this reel' })
  @ApiResponse({ status: 404, description: 'Reel not found' })
  async deleteReel(@Request() req, @Param('id') id: string) {
    return this.reelService.deleteReel(req.user.userId, id);
  }

  @Get()
  @ApiOperation({ summary: 'Get personalized reel feed' })
  @ApiResponse({ status: 200, description: 'Feed retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  async getFeed(
    @Request() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.reelService.getFeed(
      req.user.userId,
      page ? parseInt(page.toString()) : 1,
      limit ? parseInt(limit.toString()) : 20,
    );
  }

  @Get('trending/all')
  @ApiOperation({ summary: 'Get trending reels' })
  @ApiResponse({ status: 200, description: 'Trending reels retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  async getTrendingReels(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.reelService.getTrendingReels(
      page ? parseInt(page.toString()) : 1,
      limit ? parseInt(limit.toString()) : 20,
    );
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get reels by user' })
  @ApiResponse({ status: 200, description: 'User reels retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  async getUserReels(
    @Param('userId') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.reelService.getUserReels(
      userId,
      page ? parseInt(page.toString()) : 1,
      limit ? parseInt(limit.toString()) : 20,
    );
  }

  @Post(':id/like')
  @ApiOperation({ summary: 'Like a reel' })
  @ApiResponse({ status: 200, description: 'Reel liked successfully' })
  @ApiResponse({ status: 400, description: 'Already liked this reel' })
  @ApiResponse({ status: 404, description: 'Reel not found' })
  async likeReel(@Request() req, @Param('id') id: string) {
    return this.reelService.likeReel(req.user.userId, id);
  }

  @Delete(':id/like')
  @ApiOperation({ summary: 'Unlike a reel' })
  @ApiResponse({ status: 200, description: 'Reel unliked successfully' })
  @ApiResponse({ status: 400, description: 'Not liked yet' })
  @ApiResponse({ status: 404, description: 'Reel not found' })
  async unlikeReel(@Request() req, @Param('id') id: string) {
    return this.reelService.unlikeReel(req.user.userId, id);
  }

  @Get(':id/likes')
  @ApiOperation({ summary: 'Get users who liked a reel' })
  @ApiResponse({ status: 200, description: 'Likes retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Reel not found' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 50 })
  async getReelLikes(
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.reelService.getReelLikes(
      id,
      page ? parseInt(page.toString()) : 1,
      limit ? parseInt(limit.toString()) : 50,
    );
  }

  @Post(':id/comment')
  @ApiOperation({ summary: 'Comment on a reel' })
  @ApiResponse({ status: 201, description: 'Comment added successfully' })
  @ApiResponse({ status: 400, description: 'Invalid content' })
  @ApiResponse({ status: 404, description: 'Reel not found' })
  async commentOnReel(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { content: string },
  ) {
    return this.reelService.commentOnReel(req.user.userId, id, body.content);
  }

  @Get(':id/comments')
  @ApiOperation({ summary: 'Get comments on a reel' })
  @ApiResponse({ status: 200, description: 'Comments retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Reel not found' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 50 })
  async getReelComments(
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.reelService.getReelComments(
      id,
      page ? parseInt(page.toString()) : 1,
      limit ? parseInt(limit.toString()) : 50,
    );
  }

  @Post(':id/view')
  @ApiOperation({ summary: 'Increment view count for a reel' })
  @ApiResponse({ status: 200, description: 'View count incremented' })
  @ApiResponse({ status: 404, description: 'Reel not found' })
  async incrementViewCount(@Param('id') id: string) {
    return this.reelService.incrementViewCount(id);
  }

  @Get('search/hashtag')
  @ApiOperation({ summary: 'Search reels by hashtag' })
  @ApiResponse({ status: 200, description: 'Search results retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid hashtag' })
  @ApiQuery({ name: 'hashtag', required: true, type: String, example: 'climatechange' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  async searchReelsByHashtag(
    @Query('hashtag') hashtag: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.reelService.searchReelsByHashtag(
      hashtag,
      page ? parseInt(page.toString()) : 1,
      limit ? parseInt(limit.toString()) : 20,
    );
  }
}
