import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useGenerationStore } from '@/stores/generation.store';

export function useGenerate() {
  const { startJob } = useGenerationStore();

  return useMutation({
    mutationFn: async (prompt: string) => {
      return api.post<{
        success: boolean;
        jobId: string;
        appId: string;
      }>('/generate', { prompt });
    },
    onSuccess: (data) => {
      startJob(data.jobId, data.appId);
    },
  });
}
