import { Module } from '@nestjs/common';
import { GenerateController } from './generate.controller';
import { GenerateService } from './generate.service';
import { LlmModule } from '../llm/llm.module';
import { CodegenModule } from '../codegen/codegen.module';
import { DeployModule } from '../deploy/deploy.module';
import { AppsModule } from '../apps/apps.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [LlmModule, CodegenModule, DeployModule, AppsModule, AuthModule],
  controllers: [GenerateController],
  providers: [GenerateService],
})
export class GenerateModule {}
