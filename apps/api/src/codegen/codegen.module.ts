import { Module } from '@nestjs/common';
import { CodegenService } from './codegen.service';
import { OpenApiParserService } from './openapi-parser.service';

@Module({
  providers: [CodegenService, OpenApiParserService],
  exports: [CodegenService, OpenApiParserService],
})
export class CodegenModule {}
