import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PollService {
  constructor(private prisma: PrismaService) {}

  // Get all active polls with vote counts
  async getPolls(userId?: string) {
    const polls = await this.prisma.poll.findMany({
      where: {
        endsAt: {
          gte: new Date(), // Only active polls
        },
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        options: {
          include: {
            _count: {
              select: { votes: true },
            },
          },
        },
        _count: {
          select: { votes: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Add hasVoted flag if userId provided
    if (userId) {
      return Promise.all(
        polls.map(async (poll) => {
          const userVote = await this.prisma.pollVote.findFirst({
            where: {
              userId,
              option: {
                pollId: poll.id,
              },
            },
          });
          return {
            ...poll,
            hasVoted: !!userVote,
          };
        }),
      );
    }

    return polls;
  }

  // Get single poll by ID
  async getPollById(pollId: string, userId?: string) {
    const poll = await this.prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        options: {
          include: {
            _count: {
              select: { votes: true },
            },
          },
        },
        _count: {
          select: { votes: true },
        },
      },
    });

    if (!poll) {
      throw new NotFoundException('Poll not found');
    }

    // Check if user has voted
    if (userId) {
      const userVote = await this.prisma.pollVote.findFirst({
        where: {
          userId,
          option: {
            pollId: poll.id,
          },
        },
      });
      return {
        ...poll,
        hasVoted: !!userVote,
        userVotedOptionId: userVote?.optionId,
      };
    }

    return poll;
  }

  // Create a new poll
  async createPoll(
    userId: string,
    data: {
      question: string;
      options: string[];
      endsAt: Date;
      allowAnonymous?: boolean;
    },
  ) {
    if (data.options.length < 2) {
      throw new BadRequestException('Poll must have at least 2 options');
    }

    if (data.options.length > 6) {
      throw new BadRequestException('Poll cannot have more than 6 options');
    }

    const poll = await this.prisma.poll.create({
      data: {
        question: data.question,
        authorId: userId,
        endsAt: data.endsAt,
        allowAnonymous: data.allowAnonymous ?? false,
        options: {
          create: data.options.map((text) => ({ text })),
        },
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        options: true,
      },
    });

    return poll;
  }

  // Vote on a poll
  async votePoll(userId: string, optionId: string) {
    // Get the option with poll details
    const option = await this.prisma.pollOption.findUnique({
      where: { id: optionId },
      include: {
        poll: true,
      },
    });

    if (!option) {
      throw new NotFoundException('Poll option not found');
    }

    // Check if poll has ended
    if (option.poll.endsAt < new Date()) {
      throw new BadRequestException('Poll has ended');
    }

    // Check if user has already voted
    const existingVote = await this.prisma.pollVote.findFirst({
      where: {
        userId,
        option: {
          pollId: option.pollId,
        },
      },
    });

    if (existingVote) {
      // Update existing vote (change vote)
      await this.prisma.pollVote.update({
        where: { id: existingVote.id },
        data: { optionId },
      });
    } else {
      // Create new vote
      await this.prisma.pollVote.create({
        data: {
          userId,
          optionId,
        },
      });
    }

    // Return updated poll with results
    return this.getPollById(option.pollId, userId);
  }

  // Delete poll (author only)
  async deletePoll(pollId: string, userId: string) {
    const poll = await this.prisma.poll.findUnique({
      where: { id: pollId },
    });

    if (!poll) {
      throw new NotFoundException('Poll not found');
    }

    if (poll.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own polls');
    }

    await this.prisma.poll.delete({
      where: { id: pollId },
    });

    return { message: 'Poll deleted successfully' };
  }
}
