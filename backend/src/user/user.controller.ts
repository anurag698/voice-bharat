import { Controller, Get, Put, Post, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get user profile by ID' })
  @ApiResponse({ status: 200, description: 'User profile retrieved' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserProfile(@Param('id') id: string) {
    return this.userService.getUserById(id);
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  async updateProfile(
    @Request() req,
    @Body() body: { firstName?: string; lastName?: string; bio?: string; avatar?: string },
  ) {
    return this.userService.updateProfile(req.user.sub, body);
  }

  @Post(':id/follow')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Follow a user' })
  @ApiResponse({ status: 201, description: 'User followed successfully' })
  async followUser(@Request() req, @Param('id') followingId: string) {
    return this.userService.followUser(req.user.sub, followingId);
  }

  @Delete(':id/follow')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unfollow a user' })
  @ApiResponse({ status: 200, description: 'User unfollowed successfully' })
  async unfollowUser(@Request() req, @Param('id') followingId: string) {
    return this.userService.unfollowUser(req.user.sub, followingId);
  }

  @Get(':id/followers')
  @ApiOperation({ summary: 'Get user followers' })
  @ApiResponse({ status: 200, description: 'Followers list retrieved' })
  async getFollowers(
    @Param('id') id: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.userService.getFollowers(id, parseInt(page), parseInt(limit));
  }

  @Get(':id/following')
  @ApiOperation({ summary: 'Get users being followed' })
  @ApiResponse({ status: 200, description: 'Following list retrieved' })
  async getFollowing(
    @Param('id') id: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.userService.getFollowing(id, parseInt(page), parseInt(limit));
  }
}
