import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { NotificationGateway } from './notification.gateway';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [NotificationController],
  providers: [NotificationService, NotificationGateway, PrismaService],
  exports: [NotificationService, NotificationGateway],
})
export class NotificationModule {}
