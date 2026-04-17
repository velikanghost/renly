'use client';

import { useState } from 'react';
import { useConnect } from '@/hooks/mutations/use-auth';

export function ApiKeyInput() {
  const [key, setKey] = useState('');
  const connect = useConnect();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (key.trim()) {
      connect.mutate(key.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md">
      <div className="flex flex-col gap-3">
        <label htmlFor="api-key" className="text-sm font-medium text-text">
          Locus API Key
        </label>
        <div className="flex gap-2">
          <input
            id="api-key"
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="claw_..."
            className="flex-1 px-4 py-2.5 bg-surface border border-border rounded-lg text-sm text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={!key.trim() || connect.isPending}
            className="px-5 py-2.5 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {connect.isPending ? 'Connecting...' : 'Connect'}
          </button>
        </div>
        {connect.isError && (
          <p className="text-xs text-error">
            {connect.error?.message || 'Failed to connect. Check your API key.'}
          </p>
        )}
        <p className="text-xs text-text-subtle">
          Get your API key from{' '}
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
    </form>
  );
}
