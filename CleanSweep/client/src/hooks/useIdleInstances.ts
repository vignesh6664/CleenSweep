import { useQuery } from '@tanstack/react-query';
import { getIdleInstances } from '../services/api';

export function useIdleInstances(accountId: string) {
  return useQuery({
    queryKey: ['idle-instances', accountId],
    queryFn: () => getIdleInstances(accountId),
    enabled: !!accountId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
