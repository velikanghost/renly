import { Injectable } from '@nestjs/common';
import { LocusApiService } from '../deploy/locus-api.service';

@Injectable()
export class BillingService {
  constructor(private readonly locusApi: LocusApiService) {}

  async getBalance(token: string) {
    return this.locusApi.getBalance(token);
  }

  async getTransactions(token: string) {
    return this.locusApi.getTransactions(token);
  }
}
