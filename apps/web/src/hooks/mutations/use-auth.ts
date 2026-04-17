import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

export function useConnect() {
  const { setCredentials, setConnecting } = useAuthStore();

  return useMutation({
    mutationFn: async (apiKey: string) => {
      setConnecting(true);
      return api.post<{
        success: boolean;
        token: string;
        workspaceId: string;
      }>('/auth/connect', { apiKey });
    },
    onSuccess: (data, apiKey) => {
      setCredentials(apiKey, data.token, data.workspaceId);
    },
    onError: () => {
      useAuthStore.getState().disconnect();
    },
  });
}
