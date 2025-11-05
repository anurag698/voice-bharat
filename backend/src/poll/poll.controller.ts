import { Controller, Get, Post, Delete, Body, Param, Request, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PollService } from './poll.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('polls')
@Controller('polls')
export class PollController {
  constructor(private pollService: PollService) {}

  @Get()
  @ApiOperation({ summary: 'Get all active polls' })
  @ApiResponse({ status: 200, description: 'Returns all active polls' })
  async getPolls(@Query('userId') userId?: string) {
    return this.pollService.getPolls(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get poll by ID' })
  @ApiResponse({ status: 200, description: 'Returns poll details' })
  @ApiResponse({ status: 404, description: 'Poll not found' })
  async getPollById(@Param('id') id: string, @Query('userId') userId?: string) {
    return this.pollService.getPollById(id, userId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new poll' })
  @ApiResponse({ status: 201, description: 'Poll created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid poll data' })
  async createPoll(
    @Request() req,
    @Body()
    body: {
      question: string;
      options: string[];
      endsAt: Date;
      allowAnonymous?: boolean;
    },
  ) {
    return this.pollService.createPoll(req.user.sub, body);
  }

  @Post(':optionId/vote')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Vote on a poll option' })
  @ApiResponse({ status: 200, description: 'Vote recorded successfully' })
  @ApiResponse({ status: 400, description: 'Poll has ended' })
  @ApiResponse({ status: 404, description: 'Poll option not found' })
  async votePoll(@Request() req, @Param('optionId') optionId: string) {
    return this.pollService.votePoll(req.user.sub, optionId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete poll' })
  @ApiResponse({ status: 200, description: 'Poll deleted' })
  @ApiResponse({ status: 403, description: 'Not authorized' })
  async deletePoll(@Request() req, @Param('id') id: string) {
    return this.pollService.deletePoll(id, req.user.sub);
  }
}
