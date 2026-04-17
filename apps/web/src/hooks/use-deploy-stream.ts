import { useEffect, useRef } from 'react';
import { useGenerationStore } from '@/stores/generation.store';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

/**
 * Custom hook that connects to the SSE stream for a generation job.
 * Updates the Zustand generation store with each event.
 */
export function useDeployStream(jobId: string | null) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const { addStep, setComplete, setError } = useGenerationStore();

  useEffect(() => {
    if (!jobId) return;

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
          setComplete();
          es.close();
        }

        if (data.step === 'error') {
          setError(data.message);
          es.close();
        }
      } catch (err) {
        console.error('Failed to parse SSE event:', err);
      }
    };

    es.onerror = () => {
      // EventSource will auto-reconnect, but if it's closed we're done
      if (es.readyState === EventSource.CLOSED) {
        setComplete();
      }
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [jobId, addStep, setComplete, setError]);
}
