import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Donation, Prisma } from '@prisma/client';

@Injectable()
export class DonationService {
  constructor(private prisma: PrismaService) {}

  async createDonation(data: Prisma.DonationCreateInput): Promise<Donation> {
    return this.prisma.donation.create({
      data,
      include: {
        user: true,
        fundraiser: true,
      },
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.DonationWhereInput;
    orderBy?: Prisma.DonationOrderByWithRelationInput;
  }): Promise<Donation[]> {
    const { skip, take, where, orderBy } = params;
    return this.prisma.donation.findMany({
      skip,
      take,
      where,
      orderBy,
      include: {
        user: true,
        fundraiser: true,
      },
    });
  }

  async findOne(id: string): Promise<Donation | null> {
    return this.prisma.donation.findUnique({
      where: { id },
      include: {
        user: true,
        fundraiser: {
          include: {
            ngo: true,
          },
        },
      },
    });
  }

  async findByUser(userId: string): Promise<Donation[]> {
    return this.prisma.donation.findMany({
      where: { userId },
      include: {
        fundraiser: {
          include: {
            ngo: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findByFundraiser(fundraiserId: string): Promise<Donation[]> {
    return this.prisma.donation.findMany({
      where: { fundraiserId },
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async update(
    id: string,
    data: Prisma.DonationUpdateInput,
  ): Promise<Donation> {
    return this.prisma.donation.update({
      where: { id },
      data,
      include: {
        user: true,
        fundraiser: true,
      },
    });
  }

  async updateStatus(id: string, status: string): Promise<Donation> {
    return this.prisma.donation.update({
      where: { id },
      data: { status },
    });
  }

  async delete(id: string): Promise<Donation> {
    return this.prisma.donation.delete({
      where: { id },
    });
  }

  async getDonationStats(userId?: string) {
    const where = userId ? { userId } : {};

    const total = await this.prisma.donation.count({ where });
    const totalAmount = await this.prisma.donation.aggregate({
      where,
      _sum: {
        amount: true,
      },
    });

    return {
      totalDonations: total,
      totalAmount: totalAmount._sum.amount || 0,
    };
  }
}
