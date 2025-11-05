import { Controller, Get, Post, Put, Delete, Body, Param, Request, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { NgoService } from './ngo.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('ngo')
@Controller('ngo')
export class NgoController {
  constructor(private ngoService: NgoService) {}

  @Get('verified')
  @ApiOperation({ summary: 'Get all verified NGOs' })
  @ApiResponse({ status: 200, description: 'Returns all verified NGOs' })
  async getVerifiedNGOs() {
    return this.ngoService.getVerifiedNGOs();
  }

  @Get('profile/:userId')
  @ApiOperation({ summary: 'Get NGO profile by user ID' })
  @ApiResponse({ status: 200, description: 'Returns NGO profile' })
  @ApiResponse({ status: 404, description: 'NGO profile not found' })
  async getNGOProfile(@Param('userId') userId: string) {
    return this.ngoService.getNGOProfile(userId);
  }

  @Post('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create or update NGO profile' })
  @ApiResponse({ status: 201, description: 'NGO profile created/updated' })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  async createOrUpdateProfile(
    @Request() req,
    @Body()
    body: {
      registrationNumber: string;
      registrationDoc: string;
      website?: string;
      description: string;
      address: string;
      contactPhone: string;
    },
  ) {
    return this.ngoService.createOrUpdateNGOProfile(req.user.sub, body);
  }

  @Post(':ngoId/verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify NGO (Admin only)' })
  @ApiResponse({ status: 200, description: 'NGO verified successfully' })
  @ApiResponse({ status: 403, description: 'Not authorized' })
  @ApiResponse({ status: 404, description: 'NGO not found' })
  async verifyNGO(@Request() req, @Param('ngoId') ngoId: string) {
    return this.ngoService.verifyNGO(ngoId, req.user.sub);
  }

  @Post(':ngoId/reject')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject NGO verification (Admin only)' })
  @ApiResponse({ status: 200, description: 'NGO verification rejected' })
  @ApiResponse({ status: 403, description: 'Not authorized' })
  @ApiResponse({ status: 404, description: 'NGO not found' })
  async rejectNGO(@Request() req, @Param('ngoId') ngoId: string) {
    return this.ngoService.rejectNGO(ngoId, req.user.sub);
  }

  @Get('fundraisers')
  @ApiOperation({ summary: 'Get all fundraisers' })
  @ApiResponse({ status: 200, description: 'Returns all fundraisers' })
  async getFundraisers(
    @Query('ngoId') ngoId?: string,
    @Query('active') active?: string,
  ) {
    return this.ngoService.getFundraisers({
      ngoId,
      active: active === 'true',
    });
  }

  @Get('fundraisers/:id')
  @ApiOperation({ summary: 'Get fundraiser by ID' })
  @ApiResponse({ status: 200, description: 'Returns fundraiser details' })
  @ApiResponse({ status: 404, description: 'Fundraiser not found' })
  async getFundraiserById(@Param('id') id: string) {
    return this.ngoService.getFundraiserById(id);
  }

  @Post('fundraisers')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create fundraiser (Verified NGO only)' })
  @ApiResponse({ status: 201, description: 'Fundraiser created' })
  @ApiResponse({ status: 403, description: 'NGO not verified' })
  async createFundraiser(
    @Request() req,
    @Body()
    body: {
      title: string;
      description: string;
      goalAmount: number;
      endsAt: Date;
      imageUrl?: string;
    },
  ) {
    return this.ngoService.createFundraiser(req.user.sub, body);
  }

  @Post('fundraisers/:id/donate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Donate to fundraiser' })
  @ApiResponse({ status: 200, description: 'Donation successful' })
  @ApiResponse({ status: 400, description: 'Fundraiser ended or invalid amount' })
  @ApiResponse({ status: 404, description: 'Fundraiser not found' })
  async donate(
    @Request() req,
    @Param('id') fundraiserId: string,
    @Body() body: { amount: number; paymentId: string },
  ) {
    return this.ngoService.donateToFundraiser(
      req.user.sub,
      fundraiserId,
      body.amount,
      body.paymentId,
    );
  }

  @Put('fundraisers/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update fundraiser' })
  @ApiResponse({ status: 200, description: 'Fundraiser updated' })
  @ApiResponse({ status: 403, description: 'Not authorized' })
  @ApiResponse({ status: 404, description: 'Fundraiser not found' })
  async updateFundraiser(
    @Request() req,
    @Param('id') fundraiserId: string,
    @Body()
    body: {
      title?: string;
      description?: string;
      goalAmount?: number;
      endsAt?: Date;
      imageUrl?: string;
    },
  ) {
    return this.ngoService.updateFundraiser(fundraiserId, req.user.sub, body);
  }

  @Delete('fundraisers/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete fundraiser' })
  @ApiResponse({ status: 200, description: 'Fundraiser deleted' })
  @ApiResponse({ status: 403, description: 'Not authorized' })
  @ApiResponse({ status: 404, description: 'Fundraiser not found' })
  async deleteFundraiser(@Request() req, @Param('id') fundraiserId: string) {
    return this.ngoService.deleteFundraiser(fundraiserId, req.user.sub);
  }
}
