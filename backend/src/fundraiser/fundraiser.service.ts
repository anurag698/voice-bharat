import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Fundraiser, Prisma } from '@prisma/client';

@Injectable()
export class FundraiserService {
  constructor(private prisma: PrismaService) {}

  async createFundraiser(data: Prisma.FundraiserCreateInput): Promise<Fundraiser> {
    return this.prisma.fundraiser.create({
      data,
      include: {
        ngo: true,
        donations: true,
      },
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.FundraiserWhereInput;
    orderBy?: Prisma.FundraiserOrderByWithRelationInput;
  }): Promise<Fundraiser[]> {
    const { skip, take, where, orderBy } = params;
    return this.prisma.fundraiser.findMany({
      skip,
      take,
      where,
      orderBy,
      include: {
        ngo: true,
        donations: true,
      },
    });
  }

  async findOne(id: string): Promise<Fundraiser | null> {
    return this.prisma.fundraiser.findUnique({
      where: { id },
      include: {
        ngo: true,
        donations: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async findByNgo(ngoId: string): Promise<Fundraiser[]> {
    return this.prisma.fundraiser.findMany({
      where: { ngoId },
      include: {
        ngo: true,
        donations: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findActiveFundraisers(): Promise<Fundraiser[]> {
    return this.prisma.fundraiser.findMany({
      where: {
        isActive: true,
        endDate: {
          gte: new Date(),
        },
      },
      include: {
        ngo: true,
        donations: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async update(
    id: string,
    data: Prisma.FundraiserUpdateInput,
  ): Promise<Fundraiser> {
    return this.prisma.fundraiser.update({
      where: { id },
      data,
      include: {
        ngo: true,
        donations: true,
      },
    });
  }

  async updateRaisedAmount(id: string, amount: number): Promise<Fundraiser> {
    return this.prisma.fundraiser.update({
      where: { id },
      data: {
        raisedAmount: {
          increment: amount,
        },
      },
    });
  }

  async delete(id: string): Promise<Fundraiser> {
    return this.prisma.fundraiser.delete({
      where: { id },
    });
  }

  async getFundraiserStats(id: string) {
    const fundraiser = await this.prisma.fundraiser.findUnique({
      where: { id },
      include: {
        donations: true,
      },
    });

    if (!fundraiser) {
      return null;
    }

    const totalDonations = fundraiser.donations.length;
    const totalRaised = fundraiser.raisedAmount;
    const goalAmount = fundraiser.goalAmount;
    const percentageReached = (totalRaised / goalAmount) * 100;
    const daysRemaining = Math.ceil(
      (fundraiser.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
    );

    return {
      totalDonations,
      totalRaised,
      goalAmount,
      percentageReached,
      daysRemaining,
      isActive: fundraiser.isActive && daysRemaining > 0,
    };
  }
}
