import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { LlmModule } from './llm/llm.module';
import { CodegenModule } from './codegen/codegen.module';
import { DeployModule } from './deploy/deploy.module';
import { GenerateModule } from './generate/generate.module';
import { AppsModule } from './apps/apps.module';
import { BillingModule } from './billing/billing.module';
import configuration from './common/config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    AuthModule,
    LlmModule,
    CodegenModule,
    DeployModule,
    GenerateModule,
    AppsModule,
    BillingModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
