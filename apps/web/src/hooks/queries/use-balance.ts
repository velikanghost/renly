import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

export function useBalance() {
  const { isAuthed } = useAuthStore();

  return useQuery({
    queryKey: ['billing', 'balance'],
    queryFn: () => api.get<{ success: boolean; creditBalance: number }>('/billing/balance'),
    enabled: isAuthed,
    staleTime: 60 * 1000,
    select: (data) => data.creditBalance,
  });
}
