import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { FollowService } from './follow.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('follow')
@Controller('follow')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FollowController {
  constructor(private readonly followService: FollowService) {}

  @Post(':userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Follow a user' })
  @ApiParam({ name: 'userId', description: 'User ID to follow', type: String })
  @ApiResponse({ status: 200, description: 'Successfully followed user' })
  @ApiResponse({ status: 400, description: 'Cannot follow yourself' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'Already following this user' })
  async followUser(@Param('userId') userId: string, @Request() req) {
    return this.followService.followUser(req.user.userId, userId);
  }

  @Delete(':userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unfollow a user' })
  @ApiParam({ name: 'userId', description: 'User ID to unfollow', type: String })
  @ApiResponse({ status: 200, description: 'Successfully unfollowed user' })
  @ApiResponse({ status: 404, description: 'Not following this user' })
  async unfollowUser(@Param('userId') userId: string, @Request() req) {
    return this.followService.unfollowUser(req.user.userId, userId);
  }

  @Post('toggle/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle follow status for a user' })
  @ApiParam({ name: 'userId', description: 'User ID to toggle follow', type: String })
  @ApiResponse({ status: 200, description: 'Follow status toggled successfully' })
  @ApiResponse({ status: 400, description: 'Cannot follow yourself' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async toggleFollow(@Param('userId') userId: string, @Request() req) {
    return this.followService.toggleFollow(req.user.userId, userId);
  }

  @Get('followers/:userId')
  @ApiOperation({ summary: 'Get followers of a user' })
  @ApiParam({ name: 'userId', description: 'User ID', type: String })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (max 100)', type: Number })
  @ApiResponse({ status: 200, description: 'Followers retrieved successfully' })
  async getFollowers(
    @Param('userId') userId: string,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.followService.getFollowers(userId, page, limit);
  }

  @Get('following/:userId')
  @ApiOperation({ summary: 'Get users that a user is following' })
  @ApiParam({ name: 'userId', description: 'User ID', type: String })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (max 100)', type: Number })
  @ApiResponse({ status: 200, description: 'Following list retrieved successfully' })
  async getFollowing(
    @Param('userId') userId: string,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.followService.getFollowing(userId, page, limit);
  }

  @Get('check/:userId')
  @ApiOperation({ summary: 'Check if current user is following a specific user' })
  @ApiParam({ name: 'userId', description: 'User ID to check', type: String })
  @ApiResponse({ status: 200, description: 'Follow status checked successfully' })
  async isFollowing(@Param('userId') userId: string, @Request() req) {
    const isFollowing = await this.followService.isFollowing(req.user.userId, userId);
    return { following: isFollowing };
  }

  @Get('stats/:userId')
  @ApiOperation({ summary: 'Get follow statistics for a user' })
  @ApiParam({ name: 'userId', description: 'User ID', type: String })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getFollowStats(@Param('userId') userId: string) {
    return this.followService.getFollowStats(userId);
  }

  @Get('mutual/:userId')
  @ApiOperation({ summary: 'Get mutual follows (users who follow each other)' })
  @ApiParam({ name: 'userId', description: 'User ID', type: String })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (max 100)', type: Number })
  @ApiResponse({ status: 200, description: 'Mutual follows retrieved successfully' })
  async getMutualFollows(
    @Param('userId') userId: string,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.followService.getMutualFollows(userId, page, limit);
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'Get suggested users to follow' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of suggestions (max 50)', type: Number })
  @ApiResponse({ status: 200, description: 'Suggestions retrieved successfully' })
  async getSuggestedUsers(
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
    @Request() req,
  ) {
    return this.followService.getSuggestedUsers(req.user.userId, limit);
  }

  @Delete('remove-follower/:followerId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a follower' })
  @ApiParam({ name: 'followerId', description: 'Follower ID to remove', type: String })
  @ApiResponse({ status: 200, description: 'Follower removed successfully' })
  @ApiResponse({ status: 404, description: 'This user is not following you' })
  async removeFollower(@Param('followerId') followerId: string, @Request() req) {
    return this.followService.removeFollower(req.user.userId, followerId);
  }
}
