'use client'

import { useGenerationStore, GenerationStep } from '@/stores/generation.store'
import { useDeployStream } from '@/hooks/use-deploy-stream'

const STEP_ICONS: Record<string, string> = {
  thinking: '🧠',
  spec: '📋',
  codegen: '⚡',
  billing: '💳',
  project: '📁',
  environment: '🌐',
  pushing: '📤',
  building: '🔨',
  live: '🚀',
  complete: '✅',
  error: '❌',
}

const STEP_COLORS: Record<string, string> = {
  thinking: 'text-accent',
  spec: 'text-accent',
  codegen: 'text-warning',
  billing: 'text-text-muted',
  project: 'text-text-muted',
  pushing: 'text-warning',
  building: 'text-warning',
  live: 'text-success',
  complete: 'text-success',
  error: 'text-error',
}

export function DeployProgress() {
  const { currentJobId, steps, isGenerating, isComplete, error } =
    useGenerationStore()

  // Connect to SSE stream
  useDeployStream(currentJobId)

  if (!currentJobId && steps.length === 0) {
    return null
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="border border-border rounded-xl bg-surface overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <span className="text-sm font-medium text-text">
            {isGenerating
              ? 'Generating your app...'
              : isComplete
                ? 'Deployment complete'
                : 'Generation failed'}
          </span>
          {isGenerating && (
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          )}
          {isComplete && <span className="w-2 h-2 rounded-full bg-success" />}
          {error && <span className="w-2 h-2 rounded-full bg-error" />}
        </div>

        <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
          {steps.map((step, i) => (
            <StepItem key={i} step={step} isLast={i === steps.length - 1} />
          ))}

          {isGenerating && (
            <div className="flex items-center gap-3 text-text-muted">
              <span className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
              <span className="text-sm">Processing...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StepItem({ step, isLast }: { step: GenerationStep; isLast: boolean }) {
  const icon = STEP_ICONS[step.step] || '•'
  const color = STEP_COLORS[step.step] || 'text-text-muted'

  return (
    <div
      className={`flex items-start gap-3 ${isLast ? 'opacity-100' : 'opacity-70'}`}
    >
      <span className="text-base mt-0.5 shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${color}`}>{step.message}</p>
        {step.data?.serviceUrls && (
          <div className="mt-2 space-y-1">
            {Object.entries(step.data.serviceUrls).map(([name, url]) => (
              <a
                key={name}
                href={
                  (url as string).startsWith('http')
                    ? (url as string)
                    : `https://${url}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="block text-xs text-accent hover:underline truncate"
              >
                {name}: {url as string}
              </a>
            ))}
          </div>
        )}
      </div>
      <span className="text-xs text-text-subtle shrink-0">
        {new Date(step.timestamp).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })}
      </span>
    </div>
  )
}
