import { AppSpec } from '../../llm/interfaces/app-spec.interface';

export type AppStatus = 'generating' | 'deploying' | 'live' | 'failed' | 'iterating';

export interface AppIteration {
  id: string;
  prompt: string;
  timestamp: string;
  status: 'success' | 'failed';
}

export interface AppState {
  id: string;
  prompt: string;
  spec: AppSpec;
  status: AppStatus;
  errorMessage?: string;
  locusProjectId?: string;
  workspaceId?: string;
  serviceUrls: Record<string, string>;
  iterations: AppIteration[];
  createdAt: string;
  updatedAt: string;
}
