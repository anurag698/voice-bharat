import { Module } from '@nestjs/common';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';
import { PrismaModule } from '../prisma/prisma.module';
import { MentionModule } from '../mention/mention.module';

@Module({
  imports: [PrismaModule], MentionModule,
  controllers: [CommentController],
  providers: [CommentService],
  exports: [CommentService],
})
export class CommentModule {}
