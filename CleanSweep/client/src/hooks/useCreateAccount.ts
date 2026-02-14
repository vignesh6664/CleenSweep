import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createAccount, triggerScan } from '../services/api';
import type { CreateAccountData } from '../services/api';
import { toast } from 'sonner';

export function useCreateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAccountData) => {
      // Create the account
      const account = await createAccount(data);
      
      // Automatically trigger a scan for the new account
      await triggerScan(account.id);
      
      return account;
    },
    onSuccess: () => {
      // Invalidate and refetch accounts
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      // Invalidate scan results to trigger refresh
      queryClient.invalidateQueries({ queryKey: ['scanResults'] });
      
      toast.success('Account connected successfully!', {
        description: 'Scanning for orphaned resources...',
      });
    },
    onError: (error: Error) => {
      toast.error('Failed to connect account', {
        description: error.message,
      });
    },
  });
}
