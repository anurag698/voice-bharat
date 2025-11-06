import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { CommentService, CreateCommentDto, UpdateCommentDto, CommentResponseDto, AddReactionDto } from './comment.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('comments')
@Controller('comments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new comment on a post' })
  @ApiResponse({ status: 201, description: 'Comment created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async createComment(
    @Request() req,
    @Body() createCommentDto: CreateCommentDto,
  ): Promise<CommentResponseDto> {
    return this.commentService.createComment(req.user.userId, createCommentDto);
  }

  @Get('post/:postId')
  @ApiOperation({ summary: 'Get all comments for a specific post' })
  @ApiParam({ name: 'postId', description: 'Post ID', type: String })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Comments per page (default: 20, max: 100)' })
  @ApiResponse({ status: 200, description: 'Comments retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async getCommentsByPost(
    @Param('postId') postId: string,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.commentService.getCommentsByPost(postId, page, limit);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all comments by a specific user' })
  @ApiParam({ name: 'userId', description: 'User ID', type: String })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Comments per page (default: 20, max: 100)' })
  @ApiResponse({ status: 200, description: 'User comments retrieved successfully' })
  async getCommentsByUser(
    @Param('userId') userId: string,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.commentService.getCommentsByUser(userId, page, limit);
  }

  @Get(':commentId')
  @ApiOperation({ summary: 'Get a single comment by ID' })
  @ApiParam({ name: 'commentId', description: 'Comment ID', type: String })
  @ApiResponse({ status: 200, description: 'Comment retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  async getCommentById(@Param('commentId') commentId: string): Promise<CommentResponseDto> {
    return this.commentService.getCommentById(commentId);
  }

  @Put(':commentId')
  @ApiOperation({ summary: 'Update a comment' })
  @ApiParam({ name: 'commentId', description: 'Comment ID', type: String })
  @ApiResponse({ status: 200, description: 'Comment updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not comment owner' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  async updateComment(
    @Request() req,
    @Param('commentId') commentId: string,
    @Body() updateCommentDto: UpdateCommentDto,
  ): Promise<CommentResponseDto> {
    return this.commentService.updateComment(commentId, req.user.userId, updateCommentDto);
  }

  @Delete(':commentId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a comment' })
  @ApiParam({ name: 'commentId', description: 'Comment ID', type: String })
  @ApiResponse({ status: 200, description: 'Comment deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not comment owner or admin' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  async deleteComment(
    @Request() req,
    @Param('commentId') commentId: string,
  ): Promise<{ message: string }> {
    const isAdmin = req.user.role === 'ADMIN' || req.user.role === 'MODERATOR';
    return this.commentService.deleteComment(commentId, req.user.userId, isAdmin);
  }

  @Get('post/:postId/count')
  @ApiOperation({ summary: 'Get comment count for a post' })
  @ApiParam({ name: 'postId', description: 'Post ID', type: String })
  @ApiResponse({ status: 200, description: 'Comment count retrieved successfully' })
  async getCommentCount(@Param('postId') postId: string): Promise<{ count: number }> {
    const count = await this.commentService.getCommentCount(postId);
    return { count };
  }

  @Get('post/:postId/check')
  @ApiOperation({ summary: 'Check if current user has commented on a post' })
  @ApiParam({ name: 'postId', description: 'Post ID', type: String })
  @ApiResponse({ status: 200, description: 'Check result retrieved successfully' })
  async hasUserCommented(
    @Request() req,
    @Param('postId') postId: string,
  ): Promise<{ hasCommented: boolean }> {
    const hasCommented = await this.commentService.hasUserCommented(postId, req.user.userId);
    return { hasCommented };
  }

    @Post(':commentId/reaction')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add/remove reaction to comment' })
  @ApiParam({ name: 'commentId', description: 'Comment ID', type: String })
  @ApiResponse({ status: 200, description: 'Reaction added/removed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid reaction type' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  async addReaction(
    @Request() req,
    @Param('commentId') commentId: string,
    @Body() addReactionDto: AddReactionDto,
  ): Promise<{ message: string }> {
    return this.commentService.addReaction(commentId, req.user.userId, addReactionDto.type);
  }

  @Get(':commentId/reactions')
  @ApiOperation({ summary: 'Get all reactions for a comment' })
  @ApiParam({ name: 'commentId', description: 'Comment ID', type: String })
  @ApiResponse({ status: 200, description: 'Reactions retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  async getReactions(@Param('commentId') commentId: string) {
    return this.commentService.getCommentReactions(commentId);
  }

  @Get(':commentId/reactions/me')
  @ApiOperation({ summary: 'Get current user reactions on comment' })
  @ApiParam({ name: 'commentId', description: 'Comment ID', type: String })
  @ApiResponse({ status: 200, description: 'User reactions retrieved successfully' })
  async getMyReactions(
    @Request() req,
    @Param('commentId') commentId: string,
  ) {
    return this.commentService.getUserReaction(commentId, req.user.userId);
  }
}
