import { useQuery } from '@tanstack/react-query';
import { fetchScanResults } from '../services/api';
import { mockScanResults } from '../data/mockData';

export function useScannerData(accountId: string, demoMode: boolean) {
  return useQuery({
    queryKey: ['scanResults', accountId],
    queryFn: () => fetchScanResults(accountId),
    enabled: !demoMode && !!accountId,
    select: (data) => {
      // Use mock data if demo mode is on or API returns 0 results
      if (demoMode || data.resourcesFound === 0) {
        return mockScanResults;
      }
      return data;
    },
  });
}
