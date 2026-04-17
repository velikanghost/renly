import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

export function useApps() {
  const { isAuthed } = useAuthStore();

  return useQuery({
    queryKey: ['apps'],
    queryFn: () => api.get<{ success: boolean; apps: any[] }>('/apps'),
    enabled: isAuthed,
    staleTime: 30 * 1000,
    select: (data) => data.apps,
  });
}
