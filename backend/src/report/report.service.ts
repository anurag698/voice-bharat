import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Report, Prisma } from '@prisma/client';

@Injectable()
export class ReportService {
  constructor(private prisma: PrismaService) {}

  async createReport(data: Prisma.ReportCreateInput): Promise<Report> {
    return this.prisma.report.create({
      data,
      include: {
        reporter: true,
        post: true,
        comment: true,
      },
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.ReportWhereInput;
    orderBy?: Prisma.ReportOrderByWithRelationInput;
  }): Promise<Report[]> {
    const { skip, take, where, orderBy } = params;
    return this.prisma.report.findMany({
      skip,
      take,
      where,
      orderBy,
      include: {
        reporter: true,
        post: true,
        comment: true,
      },
    });
  }

  async findOne(id: string): Promise<Report | null> {
    return this.prisma.report.findUnique({
      where: { id },
      include: {
        reporter: true,
        post: {
          include: {
            user: true,
          },
        },
        comment: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async findPendingReports(): Promise<Report[]> {
    return this.prisma.report.findMany({
      where: {
        status: 'pending',
      },
      include: {
        reporter: true,
        post: true,
        comment: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findByReporter(reporterId: string): Promise<Report[]> {
    return this.prisma.report.findMany({
      where: { reporterId },
      include: {
        post: true,
        comment: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async update(
    id: string,
    data: Prisma.ReportUpdateInput,
  ): Promise<Report> {
    return this.prisma.report.update({
      where: { id },
      data,
      include: {
        reporter: true,
        post: true,
        comment: true,
      },
    });
  }

  async updateStatus(id: string, status: string): Promise<Report> {
    return this.prisma.report.update({
      where: { id },
      data: { status },
    });
  }

  async delete(id: string): Promise<Report> {
    return this.prisma.report.delete({
      where: { id },
    });
  }

  async getReportStats() {
    const total = await this.prisma.report.count();
    const pending = await this.prisma.report.count({
      where: { status: 'pending' },
    });
    const resolved = await this.prisma.report.count({
      where: { status: 'resolved' },
    });
    const dismissed = await this.prisma.report.count({
      where: { status: 'dismissed' },
    });

    return {
      total,
      pending,
      resolved,
      dismissed,
    };
  }
}
