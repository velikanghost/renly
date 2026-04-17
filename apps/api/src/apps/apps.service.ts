import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { AppState, AppStatus, AppIteration } from './interfaces/app-state.interface';
import { AppSpec } from '../llm/interfaces/app-spec.interface';

/**
 * In-memory app state management.
 * For hackathon speed — no database needed.
 */
@Injectable()
export class AppsService {
  private readonly logger = new Logger(AppsService.name);
  private readonly apps = new Map<string, AppState>();

  createApp(prompt: string, spec: AppSpec): AppState {
    const app: AppState = {
      id: uuidv4(),
      prompt,
      spec,
      status: 'generating',
      serviceUrls: {},
      iterations: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.apps.set(app.id, app);
    this.logger.log(`Created app: ${app.id} (${spec.appName})`);
    return app;
  }

  getApp(id: string): AppState {
    const app = this.apps.get(id);
    if (!app) {
      throw new NotFoundException(`App not found: ${id}`);
    }
    return app;
  }

  getAllApps(): AppState[] {
    return Array.from(this.apps.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  updateStatus(id: string, status: AppStatus, errorMessage?: string): void {
    const app = this.getApp(id);
    app.status = status;
    app.updatedAt = new Date().toISOString();
    if (errorMessage) {
      app.errorMessage = errorMessage;
    }
  }

  setLocusProject(id: string, projectId: string, workspaceId: string): void {
    const app = this.getApp(id);
    app.locusProjectId = projectId;
    app.workspaceId = workspaceId;
    app.updatedAt = new Date().toISOString();
  }

  setServiceUrls(id: string, urls: Record<string, string>): void {
    const app = this.getApp(id);
    app.serviceUrls = urls;
    app.updatedAt = new Date().toISOString();
  }

  updateSpec(id: string, spec: AppSpec): void {
    const app = this.getApp(id);
    app.spec = spec;
    app.updatedAt = new Date().toISOString();
  }

  addIteration(id: string, prompt: string, status: 'success' | 'failed'): void {
    const app = this.getApp(id);
    app.iterations.push({
      id: uuidv4(),
      prompt,
      timestamp: new Date().toISOString(),
      status,
    });
    app.updatedAt = new Date().toISOString();
  }
}
