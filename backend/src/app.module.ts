import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { PrismaService } from './prisma/prisma.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    AuthModule,
    // More modules will be added here:
    // UserModule, PostModule, PollModule, NGOModule, MessageModule
  ],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class AppModule {}
