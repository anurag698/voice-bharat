import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FundraiserService } from './fundraiser.service';
import { Prisma } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('fundraisers')
export class FundraiserController {
  constructor(private readonly fundraiserService: FundraiserService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createFundraiserDto: Prisma.FundraiserCreateInput) {
    return this.fundraiserService.createFundraiser(createFundraiserDto);
  }

  @Get()
  findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('ngoId') ngoId?: string,
  ) {
    return this.fundraiserService.findAll({
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      where: ngoId ? { ngoId } : undefined,
    });
  }

  @Get('active')
  findActiveFundraisers() {
    return this.fundraiserService.findActiveFundraisers();
  }

  @Get('ngo/:ngoId')
  findByNgo(@Param('ngoId') ngoId: string) {
    return this.fundraiserService.findByNgo(ngoId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.fundraiserService.findOne(id);
  }

  @Get(':id/stats')
  getStats(@Param('id') id: string) {
    return this.fundraiserService.getFundraiserStats(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() updateFundraiserDto: Prisma.FundraiserUpdateInput,
  ) {
    return this.fundraiserService.update(id, updateFundraiserDto);
  }

  @Patch(':id/amount')
  @UseGuards(JwtAuthGuard)
  updateAmount(@Param('id') id: string, @Body('amount') amount: number) {
    return this.fundraiserService.updateRaisedAmount(id, amount);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.fundraiserService.delete(id);
  }
}
