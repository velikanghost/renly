'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { useApps } from '@/hooks/queries/use-apps';
import { useGenerate } from '@/hooks/mutations/use-generate';
import { AppCard } from '@/components/app-card';
import { PromptInput } from '@/components/prompt-input';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { isAuthed } = useAuthStore();
  const router = useRouter();
  const { data: apps, isLoading } = useApps();
  const generate = useGenerate();

  useEffect(() => {
    if (!isAuthed) {
      router.push('/');
    }
  }, [isAuthed, router]);

  const handleGenerate = (prompt: string) => {
    generate.mutate(prompt, {
      onSuccess: () => router.push('/generate'),
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text">Your Apps</h1>
          <p className="text-sm text-text-muted mt-1">
            {apps?.length || 0} apps deployed
          </p>
        </div>
      </div>

      {/* Quick prompt */}
      <div className="mb-8">
        <PromptInput
          onSubmit={handleGenerate}
          isLoading={generate.isPending}
          placeholder="Build something new... e.g. 'CRM for freelancers'"
          buttonText="Create App"
        />
      </div>

      {/* Apps grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="border border-border rounded-xl bg-surface p-5 animate-pulse"
            >
              <div className="h-5 w-2/3 bg-border rounded mb-3" />
              <div className="h-4 w-full bg-border rounded mb-2" />
              <div className="h-4 w-1/2 bg-border rounded" />
            </div>
          ))}
        </div>
      ) : apps && apps.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {apps.map((app: any) => (
            <AppCard key={app.id} app={app} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 border border-dashed border-border rounded-xl">
          <span className="text-4xl mb-4 block">✦</span>
          <h2 className="text-lg font-medium text-text mb-2">No apps yet</h2>
          <p className="text-sm text-text-muted">
            Describe your first app above to get started
          </p>
        </div>
      )}
    </div>
  );
}
