import { useQuery } from '@tanstack/react-query';
import { fetchScanResults } from '../services/api';

export function useScannerData(accountId: string, _demoMode: boolean) {
  return useQuery({
    queryKey: ['scanResults', accountId],
    queryFn: () => fetchScanResults(accountId),
    enabled: !!accountId,
  });
}
