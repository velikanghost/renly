'use client';

import Link from 'next/link';
import { formatDate, truncate } from '@/lib/utils';

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  generating: { label: 'Generating', color: 'text-accent', bg: 'bg-accent-muted' },
  deploying: { label: 'Deploying', color: 'text-warning', bg: 'bg-warning-muted' },
  live: { label: 'Live', color: 'text-success', bg: 'bg-success-muted' },
  failed: { label: 'Failed', color: 'text-error', bg: 'bg-error-muted' },
  iterating: { label: 'Updating', color: 'text-warning', bg: 'bg-warning-muted' },
};

interface AppCardProps {
  app: {
    id: string;
    prompt: string;
    spec: { appName: string; description: string; pages: any[] };
    status: string;
    serviceUrls: Record<string, string>;
    iterations: any[];
    createdAt: string;
  };
}

export function AppCard({ app }: AppCardProps) {
  const status = STATUS_MAP[app.status] || STATUS_MAP.generating;
  const primaryUrl = Object.values(app.serviceUrls)[0];

  return (
    <Link
      href={`/app/${app.id}`}
      className="block border border-border rounded-xl bg-surface hover:border-border-hover hover:bg-surface-hover transition-all group"
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-base font-semibold text-text group-hover:text-accent transition-colors">
            {app.spec.appName || 'Untitled'}
          </h3>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${status.color} ${status.bg}`}>
            {status.label}
          </span>
        </div>

        <p className="text-sm text-text-muted mb-4 line-clamp-2">
          {truncate(app.spec.description || app.prompt, 120)}
        </p>

        <div className="flex items-center justify-between text-xs text-text-subtle">
          <div className="flex items-center gap-3">
            <span>{app.spec.pages?.length || 0} pages</span>
            <span>•</span>
            <span>{app.iterations?.length || 0} iterations</span>
          </div>
          <span>{formatDate(app.createdAt)}</span>
        </div>

        {primaryUrl && app.status === 'live' && (
          <div className="mt-3 pt-3 border-t border-border">
            <span className="text-xs text-accent truncate block">
              {primaryUrl}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
