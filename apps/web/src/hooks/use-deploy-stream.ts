import { useEffect, useRef } from 'react';
import { useGenerationStore } from '@/stores/generation.store';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

/**
 * Custom hook that connects to the SSE stream for a generation job.
 * Updates the Zustand generation store with each event.
 * Handles reconnection when connection drops during long builds.
 */
export function useDeployStream(jobId: string | null) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const completedRef = useRef(false);
  const { addStep, setComplete, setError } = useGenerationStore();

  useEffect(() => {
    if (!jobId) return;
    completedRef.current = false;

    function connect() {
      if (completedRef.current) return;

      const es = new EventSource(`${API_BASE}/generate/${jobId}/stream`);
      eventSourceRef.current = es;

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          addStep({
            step: data.step,
            message: data.message,
            timestamp: new Date().toISOString(),
            data: data.data,
          });

          if (data.step === 'complete') {
            completedRef.current = true;
            setComplete();
            es.close();
          }

          if (data.step === 'error') {
            completedRef.current = true;
            setError(data.message);
            es.close();
          }
        } catch (err) {
          console.error('Failed to parse SSE event:', err);
        }
      };

      es.onerror = () => {
        es.close();
        // Don't auto-complete on error — the job is likely still running.
        // Try to reconnect after a short delay.
        if (!completedRef.current) {
          console.log('[SSE] Connection lost, reconnecting in 3s...');
          setTimeout(connect, 3000);
        }
      };
    }

    connect();

    return () => {
      completedRef.current = true;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [jobId, addStep, setComplete, setError]);
}
