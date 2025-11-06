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
import { ReportService } from './report.service';
import { Prisma } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createReportDto: Prisma.ReportCreateInput) {
    return this.reportService.createReport(createReportDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('status') status?: string,
  ) {
    return this.reportService.findAll({
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      where: status ? { status } : undefined,
    });
  }

  @Get('pending')
  @UseGuards(JwtAuthGuard)
  findPendingReports() {
    return this.reportService.findPendingReports();
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  getStats() {
    return this.reportService.getReportStats();
  }

  @Get('reporter/:reporterId')
  @UseGuards(JwtAuthGuard)
  findByReporter(@Param('reporterId') reporterId: string) {
    return this.reportService.findByReporter(reporterId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.reportService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() updateReportDto: Prisma.ReportUpdateInput,
  ) {
    return this.reportService.update(id, updateReportDto);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.reportService.updateStatus(id, status);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.reportService.delete(id);
  }
}
