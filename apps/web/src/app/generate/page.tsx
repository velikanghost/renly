'use client';

import { useRouter } from 'next/navigation';
import { useGenerationStore } from '@/stores/generation.store';
import { DeployProgress } from '@/components/deploy-progress';
import { useAuthStore } from '@/stores/auth.store';
import { useEffect } from 'react';

export default function GeneratePage() {
  const { isAuthed } = useAuthStore();
  const { currentAppId, isComplete, steps } = useGenerationStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthed) {
      router.push('/');
    }
  }, [isAuthed, router]);

  // Find the last "complete" step to get the live URLs
  const completeStep = steps.find((s) => s.step === 'complete');

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-text">
          {isComplete ? '🎉 Your App is Live!' : '✦ Generating Your App'}
        </h1>
        <p className="text-sm text-text-muted mt-2">
          {isComplete
            ? 'Your app has been deployed and is ready to use.'
            : 'Sit back while AI generates and deploys your application...'}
        </p>
      </div>

      <DeployProgress />

      {isComplete && currentAppId && (
        <div className="flex items-center justify-center gap-4 mt-8">
          {completeStep?.data?.serviceUrls && (
            <a
              href={Object.values(completeStep.data.serviceUrls)[0] as string}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-2.5 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent-hover transition-colors"
            >
              Open Live App →
            </a>
          )}
          <button
            onClick={() => router.push(`/app/${currentAppId}`)}
            className="px-6 py-2.5 border border-border text-text text-sm font-medium rounded-lg hover:bg-surface-hover transition-colors"
          >
            View Details
          </button>
          <button
            onClick={() => {
              useGenerationStore.getState().reset();
              router.push('/');
            }}
            className="px-6 py-2.5 text-text-muted text-sm hover:text-text transition-colors"
          >
            Build Another
          </button>
        </div>
      )}
    </div>
  );
}
