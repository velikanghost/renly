import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

export function useAppDetail(appId: string | null) {
  const { isAuthed } = useAuthStore();

  return useQuery({
    queryKey: ['apps', appId],
    queryFn: () => api.get<{ success: boolean; app: any }>(`/apps/${appId}`),
    enabled: !!appId && isAuthed,
    refetchInterval: (query) => {
      const app = query.state.data?.app;
      // Poll more frequently while deploying/iterating
      if (app?.status === 'deploying' || app?.status === 'iterating') {
        return 10 * 1000;
      }
      return false;
    },
    select: (data) => data.app,
  });
}
