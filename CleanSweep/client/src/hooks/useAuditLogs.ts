import { useQuery } from '@tanstack/react-query';
import { fetchAuditLogs } from '../services/api';

export function useAuditLogs() {
  return useQuery({
    queryKey: ['audit-logs'],
    queryFn: fetchAuditLogs,
    refetchInterval: 10000, // Refresh every 10 seconds
  });
}
