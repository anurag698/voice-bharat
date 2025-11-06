import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ActivityType } from '@prisma/client';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

// DTOs for request/response validation
class AwardXPDto {
  activityType: ActivityType;
  metadata?: any;
}

class AwardBadgeDto {
  badgeType: string;
  reason: string;
}

@ApiTags('Gamification')
@ApiBearerAuth()
@Controller('gamification')
@UseGuards(JwtAuthGuard)
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  @Post('xp')
  @ApiOperation({ summary: 'Award XP to authenticated user for an activity' })
  @ApiResponse({
    status: 200,
    description: 'XP awarded successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid activity type',
  })
  async awardXP(@Request() req, @Body() awardXPDto: AwardXPDto) {
    try {
      const result = await this.gamificationService.awardXP(
        req.user.userId,
        awardXPDto.activityType,
        awardXPDto.metadata,
      );
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('stats/:userId')
  @ApiOperation({ summary: 'Get user gamification stats' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'User stats retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async getUserStats(@Param('userId') userId: string) {
    try {
      const stats = await this.gamificationService.getUserStats(userId);
      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get global leaderboard' })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Results per page (default: 50, max: 100)',
  })
  @ApiResponse({
    status: 200,
    description: 'Leaderboard retrieved successfully',
  })
  async getLeaderboard(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
  ) {
    try {
      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50));

      const result = await this.gamificationService.getLeaderboard(
        pageNum,
        limitNum,
      );
      return {
        success: true,
        data: result,
        pagination: {
          page: pageNum,
          limit: limitNum,
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('badges')
  @ApiOperation({ summary: 'Get all available badges' })
  @ApiResponse({
    status: 200,
    description: 'Badges list retrieved successfully',
  })
  async getAllBadges() {
    try {
      const badges = await this.gamificationService.getAllBadges();
      return {
        success: true,
        data: badges,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('badges/:userId')
  @ApiOperation({ summary: 'Get user earned badges' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'User badges retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async getUserBadges(@Param('userId') userId: string) {
    try {
      const result = await this.gamificationService.getUserBadges(userId);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @Post('badges/:userId')
  @ApiOperation({ summary: 'Award badge to user (Admin only)' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'Badge awarded successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Badge already awarded or invalid badge type',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async awardBadge(
    @Param('userId') userId: string,
    @Body() awardBadgeDto: AwardBadgeDto,
  ) {
    try {
      const result = await this.gamificationService.awardBadge(
        userId,
        awardBadgeDto.badgeType,
        awardBadgeDto.reason,
      );
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('activity/:userId')
  @ApiOperation({ summary: 'Get user activity history' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Results per page (default: 50, max: 100)',
  })
  @ApiResponse({
    status: 200,
    description: 'Activity history retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async getUserActivityHistory(
    @Param('userId') userId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
  ) {
    try {
      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50));

      const result = await this.gamificationService.getUserActivityHistory(
        userId,
        pageNum,
        limitNum,
      );
      return {
        success: true,
        data: result,
        pagination: {
          page: pageNum,
          limit: limitNum,
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @Post('milestones/:userId')
  @ApiOperation({
    summary: 'Check and award milestone badges for user',
  })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'Milestones checked and awarded',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async checkMilestones(@Param('userId') userId: string) {
    try {
      const result = await this.gamificationService.checkMilestones(userId);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @Get('top-performers')
  @ApiOperation({ summary: 'Get top performers by activity type' })
  @ApiQuery({
    name: 'activityType',
    required: false,
    description: 'Filter by activity type (optional)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of top performers (default: 10, max: 50)',
  })
  @ApiResponse({
    status: 200,
    description: 'Top performers retrieved successfully',
  })
  async getTopPerformers(
    @Query('activityType') activityType?: ActivityType,
    @Query('limit') limit: string = '10',
  ) {
    try {
      const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 10));

      const result = await this.gamificationService.getTopPerformers(
        activityType,
        limitNum,
      );
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('my-stats')
  @ApiOperation({ summary: 'Get authenticated user gamification stats' })
  @ApiResponse({
    status: 200,
    description: 'User stats retrieved successfully',
  })
  async getMyStats(@Request() req) {
    try {
      const stats = await this.gamificationService.getUserStats(
        req.user.userId,
      );
      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @Get('my-badges')
  @ApiOperation({ summary: 'Get authenticated user earned badges' })
  @ApiResponse({
    status: 200,
    description: 'User badges retrieved successfully',
  })
  async getMyBadges(@Request() req) {
    try {
      const result = await this.gamificationService.getUserBadges(
        req.user.userId,
      );
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @Get('my-activity')
  @ApiOperation({ summary: 'Get authenticated user activity history' })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Results per page (default: 50, max: 100)',
  })
  @ApiResponse({
    status: 200,
    description: 'Activity history retrieved successfully',
  })
  async getMyActivity(
    @Request() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
  ) {
    try {
      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50));

      const result = await this.gamificationService.getUserActivityHistory(
        req.user.userId,
        pageNum,
        limitNum,
      );
      return {
        success: true,
        data: result,
        pagination: {
          page: pageNum,
          limit: limitNum,
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }
}
