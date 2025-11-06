import { Module } from '@nestjs/common';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { HashtagService } from './hashtag.service';
import { PrismaService } from '../prisma/prisma.service';
import { MentionModule } from '../mention/mention.module';

@Module({
    imports: [MentionModule],
  controllers: [PostController],
  providers: [PostService, PrismaService, HashtagService],
  exports: [PostService],
})
export class PostModule {}
