import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PostService } from './post.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePostDto, UpdatePostDto, CreateCommentDto, AddPostReactionDto } from './dto/post.dto';

@ApiTags('posts')
@Controller('posts')
export class PostController {
  constructor(private postService: PostService) {}

  @Get('feed')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get personalized feed' })
  @ApiResponse({ status: 200, description: 'Feed retrieved successfully' })
  async getFeed(
    @Request() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.postService.getFeed(req.user.sub, parseInt(page), parseInt(limit));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get post by ID' })
  @ApiResponse({ status: 200, description: 'Post retrieved' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async getPost(@Param('id') id: string) {
    return this.postService.getPostById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new post' })
  @ApiResponse({ status: 201, description: 'Post created successfully' })
  async createPost(
    @Request() req,
    @Body() createPostDto: CreatePostDto,
  ) {
    return this.postService.createPost(req.user.sub, createPostDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update post' })
  @ApiResponse({ status: 200, description: 'Post updated' })
  @ApiResponse({ status: 403, description: 'Not authorized' })
  async updatePost(
    @Request() req,
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
  ) {
    return this.postService.updatePost(id, req.user.sub, updatePostDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete post' })
  @ApiResponse({ status: 200, description: 'Post deleted' })
  @ApiResponse({ status: 403, description: 'Not authorized' })
  async deletePost(@Request() req, @Param('id') id: string) {
    return this.postService.deletePost(id, req.user.sub);
  }

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Like/unlike post' })
  @ApiResponse({ status: 200, description: 'Post liked/unliked' })
  async likePost(@Request() req, @Param('id') id: string) {
    return this.postService.likePost(id, req.user.sub);
  }

  @Post(':id/comment')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add comment to post' })
  @ApiResponse({ status: 201, description: 'Comment added' })
  async addComment(
    @Request() req,
    @Param('id') id: string,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return this.postService.addComment(id, req.user.sub, createCommentDto.content);
  }

    @Post(':id/reaction')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add/remove reaction to post' })
  @ApiResponse({ status: 200, description: 'Reaction added/removed' })
  async addReaction(
    @Request() req,
    @Param('id') id: string,
    @Body() addPostReactionDto: AddPostReactionDto,
  ) {
    return this.postService.addPostReaction(id, req.user.sub, addPostReactionDto.type);
  }

  @Get(':id/reactions')
  @ApiOperation({ summary: 'Get all reactions for a post' })
  @ApiResponse({ status: 200, description: 'Reactions retrieved' })
  async getReactions(@Param('id') id: string) {
    return this.postService.getPostReactions(id);
  }

  @Get(':id/reactions/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user reactions on post' })
  @ApiResponse({ status: 200, description: 'User reactions retrieved' })
  async getMyReactions(@Request() req, @Param('id') id: string) {
    return this.postService.getUserPostReaction(id, req.user.sub);
  }
}
