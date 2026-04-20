import { Injectable, Logger } from '@nestjs/common';
import { Subject } from 'rxjs';
import { LlmService } from '../llm/llm.service';
import { CodegenService } from '../codegen/codegen.service';
import { DeployService } from '../deploy/deploy.service';
import { AppsService } from '../apps/apps.service';
import { OpenApiParserService } from '../codegen/openapi-parser.service';

export interface GenerationEvent {
  step: string;
  message: string;
  data?: any;
}

@Injectable()
export class GenerateService {
  private readonly logger = new Logger(GenerateService.name);
  private readonly jobs = new Map<string, Subject<GenerationEvent>>();

  constructor(
    private readonly llmService: LlmService,
    private readonly codegenService: CodegenService,
    private readonly deployService: DeployService,
    private readonly appsService: AppsService,
    private readonly openApiParser: OpenApiParserService,
  ) {}

  /**
   * Start a new generation pipeline. Returns a job ID
   * that the frontend can subscribe to via SSE.
   */
  async startGeneration(
    prompt: string | undefined,
    token: string,
    workspaceId: string,
    openApiContent?: string,
  ): Promise<{ jobId: string; appId: string }> {
    // Create SSE subject for this job
    const subject = new Subject<GenerationEvent>();
    const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    this.jobs.set(jobId, subject);

    // Initial placeholder spec
    const tempSpec = {
      appName: 'preparing...',
      description: prompt || 'Generating from API spec',
      type: (openApiContent ? 'frontend-only' : 'fullstack') as any,
      pages: [],
      dataModels: [],
      apiEndpoints: [],
      features: [],
      needsDatabase: false,
    };
    const app = this.appsService.createApp(prompt || 'API to App', tempSpec);

    // Store appId in subject metadata
    (subject as any)._appId = app.id;

    // Run the pipeline asynchronously
    this.runPipeline(jobId, prompt, token, workspaceId, subject, openApiContent).catch((error) => {
      this.logger.error(`Pipeline failed: ${error.message}`);
      subject.next({ step: 'error', message: error.message });
      subject.complete();
    });

    return { jobId, appId: app.id };
  }

  /**
   * Start an iteration pipeline for an existing app.
   */
  async startIteration(
    appId: string,
    iterationPrompt: string,
    token: string,
    workspaceId: string,
  ): Promise<{ jobId: string }> {
    const subject = new Subject<GenerationEvent>();
    const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    this.jobs.set(jobId, subject);

    this.runIterationPipeline(
      jobId,
      appId,
      iterationPrompt,
      token,
      workspaceId,
      subject,
    ).catch((error) => {
      this.logger.error(`Iteration pipeline failed: ${error.message}`);
      subject.next({ step: 'error', message: error.message });
      subject.complete();
    });

    return { jobId };
  }

  /**
   * Get the SSE subject for a job so the controller can stream events.
   */
  getJobStream(jobId: string): Subject<GenerationEvent> | undefined {
    return this.jobs.get(jobId);
  }

  // ─── PIPELINE ──────────────────────────────────────────────

  private async runPipeline(
    jobId: string,
    prompt: string | undefined,
    token: string,
    workspaceId: string,
    subject: Subject<GenerationEvent>,
    openApiContent?: string,
  ): Promise<void> {
    const appId = (subject as any)._appId;

    try {
      let spec;
      if (openApiContent) {
        // Step 1: Parse OpenAPI spec directly
        subject.next({ step: 'parsing', message: 'Parsing your API specification...' });
        spec = this.openApiParser.parse(openApiContent);
        subject.next({
          step: 'spec',
          message: `Identified: ${spec.appName} — ${spec.pages.length} pages, ${spec.apiEndpoints.length} endpoints`,
          data: { spec },
        });
      } else {
        // Step 1: Generate spec with Claude
        subject.next({ step: 'thinking', message: 'AI is understanding your app...' });
        spec = await this.llmService.generateSpec(prompt!);
        subject.next({
          step: 'spec',
          message: `Designed: ${spec.appName} — ${spec.pages.length} pages, ${spec.dataModels.length} models`,
          data: { spec },
        });
      }

      // Update app with real spec
      this.appsService.updateSpec(appId, spec);

      // Step 2: Generate code
      subject.next({ step: 'codegen', message: 'Generating code...' });
      const files = await this.codegenService.generateProject(spec);
      subject.next({
        step: 'codegen',
        message: `Generated ${files.length} files`,
        data: { fileCount: files.length },
      });

      // Step 3: Deploy to Locus
      this.appsService.updateStatus(appId, 'deploying');
      const result = await this.deployService.deploy(
        token,
        workspaceId,
        spec.appName,
        files,
        (step, message) => subject.next({ step, message }),
      );

      // Step 4: Update app state
      this.appsService.setLocusProject(appId, result.projectId, workspaceId);
      this.appsService.setServiceUrls(appId, result.serviceUrls);
      this.appsService.updateStatus(appId, 'live');

      subject.next({
        step: 'complete',
        message: 'Your app is live!',
        data: {
          appId,
          serviceUrls: result.serviceUrls,
        },
      });
    } catch (error) {
      this.appsService.updateStatus(appId, 'failed', error.message);
      subject.next({ step: 'error', message: error.message });
    } finally {
      subject.complete();
      // Clean up after a delay
      setTimeout(() => this.jobs.delete(jobId), 60_000);
    }
  }

  private async runIterationPipeline(
    jobId: string,
    appId: string,
    iterationPrompt: string,
    token: string,
    workspaceId: string,
    subject: Subject<GenerationEvent>,
  ): Promise<void> {
    try {
      const app = this.appsService.getApp(appId);
      this.appsService.updateStatus(appId, 'iterating');

      // Step 1: Generate updated spec
      subject.next({ step: 'thinking', message: 'AI is planning changes...' });
      const updatedSpec = await this.llmService.iterateSpec(app.spec, iterationPrompt);
      subject.next({
        step: 'spec',
        message: `Updated: ${updatedSpec.pages.length} pages, ${updatedSpec.dataModels.length} models`,
        data: { spec: updatedSpec },
      });

      // Step 2: Regenerate code
      subject.next({ step: 'codegen', message: 'Regenerating code...' });
      const files = await this.codegenService.generateProject(updatedSpec);
      subject.next({
        step: 'codegen',
        message: `Regenerated ${files.length} files`,
      });

      // Step 3: Push update and redeploy
      const result = await this.deployService.deployIteration(
        token,
        workspaceId,
        app.locusProjectId!,
        files,
        iterationPrompt,
        (step, message) => subject.next({ step, message }),
      );

      // Step 4: Update state
      this.appsService.updateSpec(appId, updatedSpec);
      this.appsService.setServiceUrls(appId, result.serviceUrls);
      this.appsService.updateStatus(appId, 'live');
      this.appsService.addIteration(appId, iterationPrompt, 'success');

      subject.next({
        step: 'complete',
        message: 'Changes deployed!',
        data: { serviceUrls: result.serviceUrls },
      });
    } catch (error) {
      this.appsService.updateStatus(appId, 'live'); // Revert to live if iteration fails
      this.appsService.addIteration(appId, iterationPrompt, 'failed');
      subject.next({ step: 'error', message: error.message });
    } finally {
      subject.complete();
      setTimeout(() => this.jobs.delete(jobId), 60_000);
    }
  }
}
