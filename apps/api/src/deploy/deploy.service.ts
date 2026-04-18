import { Injectable, Logger } from '@nestjs/common';
import { LocusApiService } from './locus-api.service';
import { GitPushService } from './git-push.service';
import { GeneratedFile } from '../codegen/codegen.service';

export interface DeployResult {
  projectId: string;
  environmentId: string;
  serviceIds: string[];
  serviceUrls: Record<string, string>;
}

@Injectable()
export class DeployService {
  private readonly logger = new Logger(DeployService.name);

  constructor(
    private readonly locusApi: LocusApiService,
    private readonly gitPush: GitPushService,
  ) {}

  /**
   * Full deploy pipeline:
   * 1. Check billing balance
   * 2. Create project
   * 3. Create environment
   * 4. Push code via git
   * 5. Wait for deployment to complete
   * 6. Return service URLs
   */
  async deploy(
    token: string,
    workspaceId: string,
    appName: string,
    files: GeneratedFile[],
    onProgress?: (step: string, message: string) => void,
  ): Promise<DeployResult> {
    const notify = onProgress || (() => {});

    // Step 1: Check balance
    notify('billing', 'Checking deployment credits...');
    const { creditBalance } = await this.locusApi.getBalance(token);
    this.logger.log(`Credit balance: $${creditBalance}`);

    if (creditBalance < 0.25) {
      throw new Error(
        `Insufficient Locus credits ($${creditBalance}). You need at least $0.25. Top up at app.paywithlocus.com`,
      );
    }
    notify('billing', `Credits available: $${creditBalance.toFixed(2)}`);

    // Step 2: Create project
    notify('project', 'Creating project on Locus...');
    const project = await this.locusApi.createProject(token, appName);
    this.logger.log(`Created project: ${project.id}`);

    // Step 3: Create environment (or use default)
    let environmentId = project.defaultEnvironmentId;
    if (!environmentId) {
      notify('environment', 'Setting up development environment...');
      const env = await this.locusApi.createEnvironment(token, project.id, 'development');
      environmentId = env.id;
    }

    // Step 4: Create service(s) — required before git push
    const hasBackend = files.some((f) => f.path.startsWith('backend/'));

    notify('service', 'Creating web service...');
    const webService = await this.locusApi.createService(token, {
      projectId: project.id,
      environmentId,
      name: 'web',
      source: { 
        type: 's3',
        rootDir: hasBackend ? 'frontend' : '.',
      },
      buildConfig: {
        method: 'dockerfile',
        dockerfile: 'Dockerfile',
      },
      runtime: {
        port: 8080,
        cpu: 256,
        memory: 512,
        minInstances: 1,
        maxInstances: 1,
      },
      healthCheckPath: '/',
      autoDeploy: true,
    });
    this.logger.log(`Created web service: ${webService.id}`);

    // Check if generated code included a backend
    if (hasBackend) {
      notify('service', 'Creating API service...');
      const apiService = await this.locusApi.createService(token, {
        projectId: project.id,
        environmentId,
        name: 'api',
        source: {
          type: 's3',
          rootDir: 'backend',
        },
        buildConfig: {
          method: 'dockerfile',
          dockerfile: 'Dockerfile',
        },
        runtime: {
          port: 8080,
          cpu: 256,
          memory: 512,
          minInstances: 1,
          maxInstances: 1,
        },
        healthCheckPath: '/health',
        autoDeploy: true,
      });
      this.logger.log(`Created API service: ${apiService.id}`);
    }

    // Step 5: Push code
    notify('pushing', 'Pushing code to Locus...');
    await this.gitPush.pushToLocus(files, token, workspaceId, project.id);
    notify('pushing', 'Code pushed successfully');

    // Step 6: Poll for deployment status
    notify('building', 'Locus is building your app... (this may take 3-7 minutes)');
    const result = await this.waitForDeployment(token, project.id, notify);

    return {
      projectId: project.id,
      environmentId,
      ...result,
    };
  }

  /**
   * Deploy an iteration: push updated code and wait for redeploy.
   */
  async deployIteration(
    token: string,
    workspaceId: string,
    projectId: string,
    files: GeneratedFile[],
    changeDescription: string,
    onProgress?: (step: string, message: string) => void,
  ): Promise<{ serviceUrls: Record<string, string> }> {
    const notify = onProgress || (() => {});

    notify('pushing', 'Pushing updated code...');
    await this.gitPush.pushUpdate(files, token, workspaceId, projectId, changeDescription);

    notify('building', 'Rebuilding your app...');
    const result = await this.waitForDeployment(token, projectId, notify);

    return { serviceUrls: result.serviceUrls };
  }

  /**
   * Poll the Locus API until all services are healthy or one fails.
   * Uses 30-second intervals as recommended by Locus docs.
   */
  private async waitForDeployment(
    token: string,
    projectId: string,
    notify: (step: string, message: string) => void,
  ): Promise<{ serviceIds: string[]; serviceUrls: Record<string, string> }> {
    const maxAttempts = 30; // 30 * 30s = 15 minutes max
    const pollInterval = 30_000; // 30 seconds

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      await this.sleep(pollInterval);

      try {
        const project = await this.locusApi.getProject(token, projectId);
        const services = project.services || [];

        const statuses = services.map((s: any) => ({
          name: s.name,
          status: s.latestDeployment?.status || 'unknown',
          url: s.url,
        }));

        const allHealthy = statuses.every((s: any) => s.status === 'healthy');
        const anyFailed = statuses.some((s: any) => s.status === 'failed');

        this.logger.log(
          `Poll ${attempt}/${maxAttempts}: ${statuses.map((s: any) => `${s.name}=${s.status}`).join(', ')}`,
        );
        notify(
          'building',
          `Build progress: ${statuses.map((s: any) => `${s.name}: ${s.status}`).join(', ')}`,
        );

        if (anyFailed) {
          throw new Error(
            `Deployment failed: ${statuses.filter((s: any) => s.status === 'failed').map((s: any) => s.name).join(', ')}`,
          );
        }

        if (allHealthy) {
          const serviceUrls: Record<string, string> = {};
          const serviceIds: string[] = [];
          for (const s of services) {
            // Normalize URL: Locus may return bare hostnames without protocol
            let url = s.url || '';
            if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
              url = `https://${url}`;
            }
            serviceUrls[s.name] = url;
            serviceIds.push(s.id);
          }

          notify('live', `App is live! ${Object.values(serviceUrls).join(', ')}`);
          return { serviceIds, serviceUrls };
        }
      } catch (error) {
        if (error.message?.includes('Deployment failed')) {
          throw error;
        }
        this.logger.warn(`Poll error (attempt ${attempt}): ${error.message}`);
      }
    }

    throw new Error('Deployment timed out after 15 minutes');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
