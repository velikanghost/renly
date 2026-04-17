import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useGenerationStore } from '@/stores/generation.store';

export function useIterate(appId: string) {
  const queryClient = useQueryClient();
  const { startJob } = useGenerationStore();

  return useMutation({
    mutationFn: async (prompt: string) => {
      return api.post<{
        success: boolean;
        jobId: string;
      }>(`/generate/${appId}/iterate`, { prompt });
    },
    onSuccess: (data) => {
      startJob(data.jobId, appId);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['apps', appId] });
    },
  });
}
