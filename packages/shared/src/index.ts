export type AppStatus = 'generating' | 'deploying' | 'live' | 'failed' | 'iterating';

export interface AppSummary {
  id: string;
  appName: string;
  description: string;
  status: AppStatus;
  serviceUrls: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}
