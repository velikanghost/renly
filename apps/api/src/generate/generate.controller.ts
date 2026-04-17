import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Sse,
  UseGuards,
  Req,
  NotFoundException,
} from '@nestjs/common';
import { Observable, map, finalize } from 'rxjs';
import { Request } from 'express';
import { GenerateService, GenerationEvent } from './generate.service';
import { CreateAppDto } from './dto/create-app.dto';
import { IterateAppDto } from './dto/iterate-app.dto';
import { LocusAuthGuard } from '../auth/guards/locus-auth.guard';
import { AuthService } from '../auth/auth.service';

@Controller('generate')
export class GenerateController {
  constructor(
    private readonly generateService: GenerateService,
    private readonly authService: AuthService,
  ) {}

  /**
   * POST /generate — Start a new app generation pipeline.
   * Returns a jobId that the frontend subscribes to via SSE.
   */
  @Post()
  @UseGuards(LocusAuthGuard)
  async generate(@Body() dto: CreateAppDto, @Req() req: Request) {
    const token = (req as any).locusToken;

    // Get workspace ID from whoami
    const whoami = await this.authService.whoami(token);
    const workspaceId = whoami.workspaceId;

    const { jobId, appId } = await this.generateService.startGeneration(
      dto.prompt,
      token,
      workspaceId,
    );

    return { success: true, jobId, appId };
  }

  /**
   * POST /generate/:appId/iterate — Start an iteration on an existing app.
   */
  @Post(':appId/iterate')
  @UseGuards(LocusAuthGuard)
  async iterate(
    @Param('appId') appId: string,
    @Body() dto: IterateAppDto,
    @Req() req: Request,
  ) {
    const token = (req as any).locusToken;
    const whoami = await this.authService.whoami(token);

    const { jobId } = await this.generateService.startIteration(
      appId,
      dto.prompt,
      token,
      whoami.workspaceId,
    );

    return { success: true, jobId };
  }

  /**
   * GET /generate/:jobId/stream — SSE endpoint for real-time pipeline events.
   */
  @Sse(':jobId/stream')
  stream(@Param('jobId') jobId: string): Observable<MessageEvent> {
    const subject = this.generateService.getJobStream(jobId);
    if (!subject) {
      throw new NotFoundException(`Job not found: ${jobId}`);
    }

    return subject.pipe(
      map((event: GenerationEvent) => ({
        data: JSON.stringify(event),
      })) as any,
    );
  }
}
