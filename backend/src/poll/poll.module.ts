import { Module } from '@nestjs/common';
import { PollController } from './poll.controller';
import { PollService } from './poll.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [PollController],
  providers: [PollService, PrismaService],
  exports: [PollService],
})
export class PollModule {}
