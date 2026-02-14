import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteVolume, triggerScan } from '../services/api';
import { toast } from 'sonner';

export function useDeleteVolume() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ accountId, region, volumeId }: { accountId: string; region: string; volumeId: string }) => {
      // Delete the volume
      await deleteVolume(accountId, region, volumeId);
      
      // Automatically trigger a scan to refresh the dashboard
      await triggerScan(accountId);
    },
    onSuccess: () => {
      // Invalidate and refetch scan results
      queryClient.invalidateQueries({ queryKey: ['scanResults'] });
      
      toast.success('Volume deleted successfully!', {
        description: 'Dashboard will refresh automatically.',
      });
    },
    onError: (error: Error) => {
      toast.error('Failed to delete volume', {
        description: error.message,
      });
    },
  });
}
