import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchMe, upgradeToPro } from '../services/api';

export function useMe() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['me'],
    queryFn: fetchMe,
  });

  const upgradeMutation = useMutation({
    mutationFn: upgradeToPro,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });

  return {
    ...query,
    upgrade: upgradeMutation.mutate,
    isUpgrading: upgradeMutation.isPending,
  };
}
