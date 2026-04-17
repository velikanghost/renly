import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { BillingService } from './billing.service';
import { LocusAuthGuard } from '../auth/guards/locus-auth.guard';

@Controller('billing')
@UseGuards(LocusAuthGuard)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('balance')
  async getBalance(@Req() req: Request) {
    const token = (req as any).locusToken;
    const result = await this.billingService.getBalance(token);
    return { success: true, ...result };
  }

  @Get('transactions')
  async getTransactions(@Req() req: Request) {
    const token = (req as any).locusToken;
    const transactions = await this.billingService.getTransactions(token);
    return { success: true, transactions };
  }
}
