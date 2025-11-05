import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { MessageService } from './message.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';

@ApiTags('messages')
@Controller('messages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  /**
   * Send a message to another user
   */
  @Post('send')
  @ApiOperation({ summary: 'Send a message to another user' })
  @ApiResponse({ status: 201, description: 'Message sent successfully' })
  @ApiResponse({ status: 404, description: 'Receiver not found' })
  async sendMessage(
    @Request() req,
    @Body('receiverId', ParseIntPipe) receiverId: number,
    @Body('content') content: string,
    @Body('attachmentUrl') attachmentUrl?: string,
  ) {
    return this.messageService.sendMessage(
      req.user.userId,
      receiverId,
      content,
      attachmentUrl,
    );
  }

  /**
   * Get conversation with another user
   */
  @Get('conversation/:userId')
  @ApiOperation({ summary: 'Get conversation with another user' })
  @ApiParam({ name: 'userId', description: 'Other user ID' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Messages per page (default: 50)' })
  @ApiResponse({ status: 200, description: 'Conversation retrieved successfully' })
  async getConversation(
    @Request() req,
    @Param('userId', ParseIntPipe) userId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 50;
    
    return this.messageService.getConversation(
      req.user.userId,
      userId,
      pageNum,
      limitNum,
    );
  }

  /**
   * Get all conversations for current user
   */
  @Get('conversations')
  @ApiOperation({ summary: 'Get all conversations for current user' })
  @ApiResponse({ status: 200, description: 'Conversations retrieved successfully' })
  async getConversations(@Request() req) {
    return this.messageService.getConversations(req.user.userId);
  }

  /**
   * Mark messages as read
   */
  @Post('mark-read/:userId')
  @ApiOperation({ summary: 'Mark messages from a user as read' })
  @ApiParam({ name: 'userId', description: 'Other user ID' })
  @ApiResponse({ status: 200, description: 'Messages marked as read' })
  async markAsRead(
    @Request() req,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.messageService.markAsRead(req.user.userId, userId);
  }

  /**
   * Delete a message
   */
  @Delete(':messageId')
  @ApiOperation({ summary: 'Delete a message (sender only)' })
  @ApiParam({ name: 'messageId', description: 'Message ID to delete' })
  @ApiResponse({ status: 200, description: 'Message deleted successfully' })
  @ApiResponse({ status: 403, description: 'You can only delete your own messages' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  async deleteMessage(
    @Request() req,
    @Param('messageId', ParseIntPipe) messageId: number,
  ) {
    return this.messageService.deleteMessage(messageId, req.user.userId);
  }

  /**
   * Search messages in a conversation
   */
  @Get('search/:userId')
  @ApiOperation({ summary: 'Search messages in a conversation' })
  @ApiParam({ name: 'userId', description: 'Other user ID' })
  @ApiQuery({ name: 'q', description: 'Search query' })
  @ApiResponse({ status: 200, description: 'Search results retrieved' })
  async searchMessages(
    @Request() req,
    @Param('userId', ParseIntPipe) userId: number,
    @Query('q') searchQuery: string,
  ) {
    return this.messageService.searchMessages(
      req.user.userId,
      userId,
      searchQuery,
    );
  }

  /**
   * Get unread message count
   */
  @Get('unread/count')
  @ApiOperation({ summary: 'Get unread message count for current user' })
  @ApiResponse({ status: 200, description: 'Unread count retrieved' })
  async getUnreadCount(@Request() req) {
    return this.messageService.getUnreadCount(req.user.userId);
  }
}
