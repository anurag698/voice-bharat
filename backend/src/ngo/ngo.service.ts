import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VerificationStatus } from '@prisma/client';

@Injectable()
export class NgoService {
  constructor(private prisma: PrismaService) {}

  // Get all verified NGOs
  async getVerifiedNGOs() {
    return this.prisma.nGOProfile.findMany({
      where: {
        verificationStatus: VerificationStatus.VERIFIED,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            fundraisers: true,
          },
        },
      },
      orderBy: {
        verifiedAt: 'desc',
      },
    });
  }

  // Get NGO profile by user ID
  async getNGOProfile(userId: string) {
    const ngoProfile = await this.prisma.nGOProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
            email: true,
          },
        },
        fundraisers: {
          include: {
            _count: {
              select: { donations: true },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!ngoProfile) {
      throw new NotFoundException('NGO profile not found');
    }

    return ngoProfile;
  }

  // Create/Update NGO profile
  async createOrUpdateNGOProfile(
    userId: string,
    data: {
      registrationNumber: string;
      registrationDoc: string;
      website?: string;
      description: string;
      address: string;
      contactPhone: string;
    },
  ) {
    // Check if NGO profile already exists
    const existing = await this.prisma.nGOProfile.findUnique({
      where: { userId },
    });

    if (existing) {
      // Update existing profile
      return this.prisma.nGOProfile.update({
        where: { userId },
        data: {
          ...data,
          verificationStatus: VerificationStatus.PENDING, // Reset to pending on update
        },
      });
    }

    // Create new NGO profile
    return this.prisma.nGOProfile.create({
      data: {
        userId,
        ...data,
        verificationStatus: VerificationStatus.PENDING,
      },
    });
  }

  // Verify NGO (Admin only)
  async verifyNGO(ngoId: string, adminUserId: string) {
    // TODO: Add admin role check
    const ngoProfile = await this.prisma.nGOProfile.findUnique({
      where: { id: ngoId },
    });

    if (!ngoProfile) {
      throw new NotFoundException('NGO profile not found');
    }

    return this.prisma.nGOProfile.update({
      where: { id: ngoId },
      data: {
        verificationStatus: VerificationStatus.VERIFIED,
        verifiedAt: new Date(),
      },
    });
  }

  // Reject NGO verification (Admin only)
  async rejectNGO(ngoId: string, adminUserId: string) {
    // TODO: Add admin role check
    const ngoProfile = await this.prisma.nGOProfile.findUnique({
      where: { id: ngoId },
    });

    if (!ngoProfile) {
      throw new NotFoundException('NGO profile not found');
    }

    return this.prisma.nGOProfile.update({
      where: { id: ngoId },
      data: {
        verificationStatus: VerificationStatus.REJECTED,
      },
    });
  }

  // Get all fundraisers (with filters)
  async getFundraisers(filters?: {
    ngoId?: string;
    active?: boolean;
  }) {
    const where: any = {};

    if (filters?.ngoId) {
      where.ngoProfileId = filters.ngoId;
    }

    if (filters?.active) {
      where.endsAt = {
        gte: new Date(),
      };
    }

    return this.prisma.fundraiser.findMany({
      where,
      include: {
        ngoProfile: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        },
        _count: {
          select: { donations: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // Get fundraiser by ID
  async getFundraiserById(fundraiserId: string) {
    const fundraiser = await this.prisma.fundraiser.findUnique({
      where: { id: fundraiserId },
      include: {
        ngoProfile: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        },
        donations: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                fullName: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!fundraiser) {
      throw new NotFoundException('Fundraiser not found');
    }

    return fundraiser;
  }

  // Create fundraiser (NGO only, must be verified)
  async createFundraiser(
    userId: string,
    data: {
      title: string;
      description: string;
      goalAmount: number;
      endsAt: Date;
      imageUrl?: string;
    },
  ) {
    // Check if user has verified NGO profile
    const ngoProfile = await this.prisma.nGOProfile.findUnique({
      where: { userId },
    });

    if (!ngoProfile) {
      throw new ForbiddenException('You must have an NGO profile to create fundraisers');
    }

    if (ngoProfile.verificationStatus !== VerificationStatus.VERIFIED) {
      throw new ForbiddenException('Your NGO profile must be verified to create fundraisers');
    }

    return this.prisma.fundraiser.create({
      data: {
        ...data,
        ngoProfileId: ngoProfile.id,
        currentAmount: 0,
      },
      include: {
        ngoProfile: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });
  }

  // Donate to fundraiser
  async donateTo Fundraiser(
    userId: string,
    fundraiserId: string,
    amount: number,
    paymentId: string,
  ) {
    const fundraiser = await this.prisma.fundraiser.findUnique({
      where: { id: fundraiserId },
    });

    if (!fundraiser) {
      throw new NotFoundException('Fundraiser not found');
    }

    if (fundraiser.endsAt < new Date()) {
      throw new BadRequestException('This fundraiser has ended');
    }

    if (amount <= 0) {
      throw new BadRequestException('Donation amount must be positive');
    }

    // Create donation and update fundraiser amount in a transaction
    return this.prisma.$transaction(async (tx) => {
      const donation = await tx.donation.create({
        data: {
          userId,
          fundraiserId,
          amount,
          paymentId,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatarUrl: true,
            },
          },
        },
      });

      await tx.fundraiser.update({
        where: { id: fundraiserId },
        data: {
          currentAmount: {
            increment: amount,
          },
        },
      });

      return donation;
    });
  }

  // Update fundraiser (NGO owner only)
  async updateFundraiser(
    fundraiserId: string,
    userId: string,
    data: {
      title?: string;
      description?: string;
      goalAmount?: number;
      endsAt?: Date;
      imageUrl?: string;
    },
  ) {
    const fundraiser = await this.prisma.fundraiser.findUnique({
      where: { id: fundraiserId },
      include: {
        ngoProfile: true,
      },
    });

    if (!fundraiser) {
      throw new NotFoundException('Fundraiser not found');
    }

    if (fundraiser.ngoProfile.userId !== userId) {
      throw new ForbiddenException('You can only update your own fundraisers');
    }

    return this.prisma.fundraiser.update({
      where: { id: fundraiserId },
      data,
    });
  }

  // Delete fundraiser (NGO owner only)
  async deleteFundraiser(fundraiserId: string, userId: string) {
    const fundraiser = await this.prisma.fundraiser.findUnique({
      where: { id: fundraiserId },
      include: {
        ngoProfile: true,
      },
    });

    if (!fundraiser) {
      throw new NotFoundException('Fundraiser not found');
    }

    if (fundraiser.ngoProfile.userId !== userId) {
      throw new ForbiddenException('You can only delete your own fundraisers');
    }

    await this.prisma.fundraiser.delete({
      where: { id: fundraiserId },
    });

    return { message: 'Fundraiser deleted successfully' };
  }
}
