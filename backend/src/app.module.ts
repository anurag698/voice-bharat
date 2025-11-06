import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { PrismaService } from './prisma/prisma.service';
import { UserModule } from './user/user.module';
import { PostModule } from './post/post.module';
import { PollModule } from './poll/poll.module';
import { NgoModule } from './ngo/ngo.module';
import { MessageModule } from './message/message.module';
import { NotificationModule } from './notification/notification.module';
import { FeedModule } from './feed/feed.module';
import { CommentModule } from './comment/comment.module';
import { LikeModule } from './like/like.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    AuthModule,
        UserModule,
        PostModule,
        PollModule,
        NgoModule,
        MessageModule,
        NotificationModule,
        FeedModule,
        CommentModule,
        LikeModule,
    // More modules will be added here:
    // UserModule, PostModule, PollModule, NGOModule, MessageModule
  ],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class AppModule {}
