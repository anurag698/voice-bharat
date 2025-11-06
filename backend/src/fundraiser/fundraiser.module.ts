import { Module } from '@nestjs/common';
import { FundraiserService } from './fundraiser.service';
import { FundraiserController } from './fundraiser.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FundraiserController],
  providers: [FundraiserService],
  exports: [FundraiserService],
})
export class FundraiserModule {}
