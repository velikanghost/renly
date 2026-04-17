'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { useGenerate } from '@/hooks/mutations/use-generate';
import { ApiKeyInput } from '@/components/api-key-input';
import { PromptInput } from '@/components/prompt-input';

export default function HomePage() {
  const { isAuthed } = useAuthStore();
  const router = useRouter();
  const generate = useGenerate();

  const handleGenerate = (prompt: string) => {
    generate.mutate(prompt, {
      onSuccess: () => {
        router.push('/generate');
      },
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] px-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Hero */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-accent-muted rounded-full text-xs font-medium text-accent">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            Powered by BuildWithLocus
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-text tracking-tight">
            Prompt → Live SaaS
            <br />
            <span className="text-accent">in 60 seconds</span>
          </h1>

          <p className="text-base text-text-muted max-w-lg mx-auto">
            Describe your app in plain English. Renly generates the code,
            deploys it on Locus, and gives you a live URL — instantly.
          </p>
        </div>

        {/* Auth or Prompt */}
        <div className="flex justify-center">
          {isAuthed ? (
            <div className="w-full max-w-xl">
              <PromptInput
                onSubmit={handleGenerate}
                isLoading={generate.isPending}
              />
              {generate.isError && (
                <p className="text-xs text-error mt-2 text-left">
                  {generate.error?.message || 'Something went wrong'}
                </p>
              )}
            </div>
          ) : (
            <ApiKeyInput />
          )}
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 pt-8 border-t border-border">
          <div className="text-center space-y-2">
            <span className="text-2xl">⚡</span>
            <h3 className="text-sm font-medium text-text">AI-Powered</h3>
            <p className="text-xs text-text-subtle">
              Claude generates specs and code from your description
            </p>
          </div>
          <div className="text-center space-y-2">
            <span className="text-2xl">🚀</span>
            <h3 className="text-sm font-medium text-text">Auto-Deploy</h3>
            <p className="text-xs text-text-subtle">
              Instantly deployed on Locus with SSL and routing
            </p>
          </div>
          <div className="text-center space-y-2">
            <span className="text-2xl">🔄</span>
            <h3 className="text-sm font-medium text-text">Iterate Live</h3>
            <p className="text-xs text-text-subtle">
              Add features with follow-up prompts — auto-redeploy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
