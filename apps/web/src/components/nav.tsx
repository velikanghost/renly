'use client';

import Link from 'next/link';
import { useAuthStore } from '@/stores/auth.store';
import { useBalance } from '@/hooks/queries/use-balance';

export function Nav() {
  const { isAuthed, disconnect } = useAuthStore();
  const { data: balance } = useBalance();

  return (
    <nav className="border-b border-border bg-surface/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
              <span className="text-white text-sm font-bold">R</span>
            </div>
            <span className="text-lg font-semibold text-text">Renly</span>
          </Link>

          {isAuthed && (
            <div className="hidden sm:flex items-center gap-6">
              <Link
                href="/dashboard"
                className="text-sm text-text-muted hover:text-text transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/settings"
                className="text-sm text-text-muted hover:text-text transition-colors"
              >
                Settings
              </Link>
            </div>
          )}
        </div>

        {isAuthed && (
          <div className="flex items-center gap-4">
            {balance !== undefined && (
              <span className="text-xs text-text-muted bg-surface px-3 py-1.5 rounded-full border border-border">
                ${balance.toFixed(2)} credits
              </span>
            )}
            <button
              onClick={disconnect}
              className="text-xs text-text-muted hover:text-error transition-colors"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
