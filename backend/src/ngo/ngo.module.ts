import { Module } from '@nestjs/common';
import { NgoController } from './ngo.controller';
import { NgoService } from './ngo.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [NgoController],
  providers: [NgoService, PrismaService],
  exports: [NgoService],
})
export class NgoModule {}
