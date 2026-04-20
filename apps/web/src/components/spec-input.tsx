'use client';

import { useState } from 'react';

interface SpecInputProps {
  onSubmit: (params: { prompt?: string; openApiContent?: string }) => void;
  isLoading?: boolean;
}

export function SpecInput({ onSubmit, isLoading = false }: SpecInputProps) {
  const [mode, setMode] = useState<'paste' | 'url'>('paste');
  const [content, setContent] = useState('');
  const [isValid, setIsValid] = useState(false);

  const handleValidate = (val: string) => {
    setContent(val);
    if (mode === 'paste') {
      try {
        // Basic check for JSON/YAML structure
        const trimmed = val.trim();
        const isJson = (trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'));
        const isYaml = trimmed.includes('openapi:') || trimmed.includes('swagger:') || trimmed.includes(': ');
        setIsValid(trimmed.length > 20 && (isJson || isYaml));
      } catch {
        setIsValid(false);
      }
    } else {
      setIsValid(val.startsWith('http') && val.length > 10);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isLoading) return;

    if (mode === 'url') {
      try {
        const res = await fetch(content);
        const text = await res.text();
        onSubmit({ openApiContent: text });
      } catch (err) {
        alert('Failed to fetch spec from URL');
      }
    } else {
      onSubmit({ openApiContent: content });
    }
  };

  return (
    <div className="w-full bg-surface border border-border rounded-2xl overflow-hidden">
      <div className="flex border-b border-border">
        <button
          onClick={() => setMode('paste')}
          className={`px-6 py-3 text-sm font-medium transition-colors ${
            mode === 'paste' ? 'text-accent border-b-2 border-accent' : 'text-text-muted hover:text-text'
          }`}
        >
          Paste JSON/YAML
        </button>
        <button
          onClick={() => setMode('url')}
          className={`px-6 py-3 text-sm font-medium transition-colors ${
            mode === 'url' ? 'text-accent border-b-2 border-accent' : 'text-text-muted hover:text-text'
          }`}
        >
          Fetch from URL
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {mode === 'paste' ? (
          <textarea
            value={content}
            onChange={(e) => handleValidate(e.target.value)}
            placeholder="Paste your Swagger/OpenAPI specification here..."
            rows={10}
            className="w-full p-4 bg-bg border border-border rounded-xl text-xs font-mono text-text placeholder:text-text-subtle resize-none focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
          />
        ) : (
          <input
            type="url"
            value={content}
            onChange={(e) => handleValidate(e.target.value)}
            placeholder="https://api.example.com/swagger.json"
            className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-sm text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
          />
        )}

        <div className="flex items-center justify-between">
          <p className="text-xs text-text-muted italic">
            {mode === 'paste' ? 'Supports OpenAPI 3.x and Swagger 2.0' : 'Direct link to raw JSON or YAML'}
          </p>
          <button
            type="submit"
            disabled={!isValid || isLoading}
            className="px-8 py-2.5 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating Dashboard...
              </>
            ) : (
              'Generate & Deploy →'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
