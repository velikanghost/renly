'use client';

import { useState } from 'react';

interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  buttonText?: string;
}

export function PromptInput({
  onSubmit,
  isLoading = false,
  placeholder = 'Describe your app... e.g. "A habit tracker for students with daily streaks"',
  buttonText = 'Generate & Deploy',
}: PromptInputProps) {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isLoading) {
      onSubmit(prompt.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full px-4 py-4 bg-surface border border-border rounded-xl text-sm text-text placeholder:text-text-subtle resize-none focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              handleSubmit(e);
            }
          }}
        />
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-text-subtle">
            ⌘ + Enter to submit
          </span>
          <button
            type="submit"
            disabled={!prompt.trim() || isLoading}
            className="px-6 py-2.5 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <span>✦</span>
                {buttonText}
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
