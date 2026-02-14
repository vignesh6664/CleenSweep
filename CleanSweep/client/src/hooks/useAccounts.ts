import { useQuery } from '@tanstack/react-query';
import { fetchAccounts } from '../services/api';

export function useAccounts() {
  return useQuery({
    queryKey: ['accounts'],
    queryFn: fetchAccounts,
  });
}
