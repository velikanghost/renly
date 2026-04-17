import { Module } from '@nestjs/common';
import { DeployService } from './deploy.service';
import { LocusApiService } from './locus-api.service';
import { GitPushService } from './git-push.service';

@Module({
  providers: [DeployService, LocusApiService, GitPushService],
  exports: [DeployService, LocusApiService],
})
export class DeployModule {}
