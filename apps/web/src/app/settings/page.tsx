'use client';

import { useAuthStore } from '@/stores/auth.store';
import { useBalance } from '@/hooks/queries/use-balance';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SettingsPage() {
  const { isAuthed, workspaceId, disconnect } = useAuthStore();
  const router = useRouter();
  const { data: balance, isLoading: balanceLoading } = useBalance();

  useEffect(() => {
    if (!isAuthed) router.push('/');
  }, [isAuthed, router]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text">Settings</h1>
        <p className="text-sm text-text-muted mt-1">
          Manage your Locus connection and billing.
        </p>
      </div>

      {/* Connection */}
      <div className="border border-border rounded-xl bg-surface p-5 space-y-4">
        <h3 className="text-sm font-medium text-text">Locus Connection</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-success" />
            <span className="text-sm text-text">Connected</span>
          </div>
          <span className="text-xs text-text-subtle font-mono">
            {workspaceId || '—'}
          </span>
        </div>
        <button
          onClick={() => {
            disconnect();
            router.push('/');
          }}
          className="text-xs text-error hover:underline"
        >
          Disconnect
        </button>
      </div>

      {/* Billing */}
      <div className="border border-border rounded-xl bg-surface p-5 space-y-4">
        <h3 className="text-sm font-medium text-text">Billing</h3>
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-muted">Credit Balance</span>
          {balanceLoading ? (
            <span className="h-5 w-16 bg-border rounded animate-pulse" />
          ) : (
            <span className="text-lg font-semibold text-text">
              ${(balance ?? 0).toFixed(2)}
            </span>
          )}
        </div>
        <p className="text-xs text-text-subtle">
          Credits are managed through your Locus workspace.
          Top up at{' '}
          <a
            href="https://app.paywithlocus.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            app.paywithlocus.com
          </a>
        </p>
      </div>

      {/* Info */}
      <div className="border border-border rounded-xl bg-surface p-5 space-y-4">
        <h3 className="text-sm font-medium text-text">About Renly</h3>
        <p className="text-sm text-text-muted">
          Renly is an AI-powered platform that generates and deploys full-stack
          applications using Anthropic Claude and BuildWithLocus.
        </p>
        <div className="flex items-center gap-4 text-xs text-text-subtle">
          <span>Version 0.1.0</span>
          <a
            href="https://docs.paywithlocus.com/build"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            Locus Docs
          </a>
        </div>
      </div>
    </div>
  );
}
