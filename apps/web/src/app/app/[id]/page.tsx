'use client';

import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { useAppDetail } from '@/hooks/queries/use-app-detail';
import { useIterate } from '@/hooks/mutations/use-iterate';
import { useGenerationStore } from '@/stores/generation.store';
import { DeployProgress } from '@/components/deploy-progress';
import { PromptInput } from '@/components/prompt-input';
import { formatDate } from '@/lib/utils';
import { useEffect } from 'react';

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  generating: { label: 'Generating', color: 'text-accent', bg: 'bg-accent-muted' },
  deploying: { label: 'Deploying', color: 'text-warning', bg: 'bg-warning-muted' },
  live: { label: 'Live', color: 'text-success', bg: 'bg-success-muted' },
  failed: { label: 'Failed', color: 'text-error', bg: 'bg-error-muted' },
  iterating: { label: 'Updating', color: 'text-warning', bg: 'bg-warning-muted' },
};

export default function AppDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthed } = useAuthStore();
  const appId = params.id as string;
  const { data: app, isLoading } = useAppDetail(appId);
  const iterate = useIterate(appId);
  const { isGenerating } = useGenerationStore();

  useEffect(() => {
    if (!isAuthed) router.push('/');
  }, [isAuthed, router]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-1/3 bg-border rounded" />
          <div className="h-4 w-2/3 bg-border rounded" />
          <div className="h-64 bg-border rounded-xl" />
        </div>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p className="text-text-muted">App not found</p>
      </div>
    );
  }

  const status = STATUS_MAP[app.status] || STATUS_MAP.generating;
  let primaryUrl = Object.values(app.serviceUrls || {})[0] as string;
  if (primaryUrl && !primaryUrl.startsWith('http://') && !primaryUrl.startsWith('https://')) {
    primaryUrl = `https://${primaryUrl}`;
  }

  const handleIterate = (prompt: string) => {
    iterate.mutate(prompt, {
      onSuccess: () => {
        router.push('/generate');
      },
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-text">{app.spec?.appName || 'Untitled'}</h1>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${status.color} ${status.bg}`}>
              {status.label}
            </span>
          </div>
          <p className="text-sm text-text-muted">{app.spec?.description || app.prompt}</p>
        </div>

        {primaryUrl && app.status === 'live' && (
          <a
            href={primaryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent-hover transition-colors flex-shrink-0"
          >
            Open App →
          </a>
        )}
      </div>

      {/* Live URLs */}
      {Object.keys(app.serviceUrls || {}).length > 0 && (
        <div className="border border-border rounded-xl bg-surface p-4">
          <h3 className="text-sm font-medium text-text mb-3">Service URLs</h3>
          <div className="space-y-2">
            {Object.entries(app.serviceUrls).map(([name, url]) => (
              <div key={name} className="flex items-center justify-between">
                <span className="text-sm text-text-muted">{name}</span>
                <a
                  href={(url as string).startsWith('http') ? (url as string) : `https://${url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-accent hover:underline truncate ml-4"
                >
                  {url as string}
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Spec info */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="border border-border rounded-lg bg-surface p-4">
          <span className="text-xs text-text-subtle">Pages</span>
          <p className="text-xl font-semibold text-text mt-1">{app.spec?.pages?.length || 0}</p>
        </div>
        <div className="border border-border rounded-lg bg-surface p-4">
          <span className="text-xs text-text-subtle">Data Models</span>
          <p className="text-xl font-semibold text-text mt-1">{app.spec?.dataModels?.length || 0}</p>
        </div>
        <div className="border border-border rounded-lg bg-surface p-4">
          <span className="text-xs text-text-subtle">Endpoints</span>
          <p className="text-xl font-semibold text-text mt-1">{app.spec?.apiEndpoints?.length || 0}</p>
        </div>
        <div className="border border-border rounded-lg bg-surface p-4">
          <span className="text-xs text-text-subtle">Iterations</span>
          <p className="text-xl font-semibold text-text mt-1">{app.iterations?.length || 0}</p>
        </div>
      </div>

      {/* Iterate */}
      {app.status === 'live' && !isGenerating && (
        <div className="border border-border rounded-xl bg-surface p-5">
          <h3 className="text-sm font-medium text-text mb-3">Iterate on this app</h3>
          <PromptInput
            onSubmit={handleIterate}
            isLoading={iterate.isPending}
            placeholder='Add a feature... e.g. "Add a weekly progress chart"'
            buttonText="Update & Redeploy"
          />
        </div>
      )}

      {/* Deploy progress (if iterating) */}
      {isGenerating && <DeployProgress />}

      {/* Iteration history */}
      {app.iterations && app.iterations.length > 0 && (
        <div className="border border-border rounded-xl bg-surface p-5">
          <h3 className="text-sm font-medium text-text mb-3">Iteration History</h3>
          <div className="space-y-3">
            {app.iterations.map((iter: any) => (
              <div
                key={iter.id}
                className="flex items-start justify-between py-2 border-b border-border last:border-0"
              >
                <div>
                  <p className="text-sm text-text">{iter.prompt}</p>
                  <span className="text-xs text-text-subtle">{formatDate(iter.timestamp)}</span>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    iter.status === 'success'
                      ? 'text-success bg-success-muted'
                      : 'text-error bg-error-muted'
                  }`}
                >
                  {iter.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Meta info */}
      <div className="text-xs text-text-subtle flex items-center gap-4">
        <span>Created: {formatDate(app.createdAt)}</span>
        <span>Updated: {formatDate(app.updatedAt)}</span>
        {app.locusProjectId && <span>Project: {app.locusProjectId}</span>}
      </div>
    </div>
  );
}
