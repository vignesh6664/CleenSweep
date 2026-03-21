import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, X, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { useDeleteVolume } from '@/hooks/useDeleteVolume';
import { useAccounts } from '@/hooks/useAccounts';
import { useMe } from '@/hooks/useMe';
import { toast } from 'sonner';

interface ZombieResource {
  id: string;
  resourceId: string;
  resourceType: string;
  sizeGb: number;
  region: string;
  monthlyCost: number;
}

interface ZombieTableProps {
  resources: ZombieResource[];
}

export function ZombieTable({ resources }: ZombieTableProps) {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedVolume, setSelectedVolume] = useState<ZombieResource | null>(null);
  
  const { data: accounts } = useAccounts();
  const { data: user, upgrade } = useMe();
  const accountId = accounts?.[0]?.id || '';
  
  const { mutate: deleteVolume, isPending: isDeleting } = useDeleteVolume();

  const isPro = user?.subscriptionTier === 'PRO';

  const handleDeleteClick = (resource: ZombieResource) => {
    if (!isPro) {
      toast('Upgrade Required', {
        description: 'You need a PRO account to delete resources directly. Scans are free, but actions require a subscription.',
        action: {
          label: 'Upgrade Now',
          onClick: () => upgrade(),
        },
      });
      return;
    }
    setSelectedVolume(resource);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedVolume) {
      deleteVolume(
        {
          accountId,
          region: selectedVolume.region,
          volumeId: selectedVolume.resourceId,
        },
        {
          onSuccess: () => {
            setDeleteModalOpen(false);
            setSelectedVolume(null);
            toast.success('Volume deletion initiated');
          },
          onError: (error) => {
            toast.error('Failed to delete volume', {
              description: error.message
            });
          }
        }
      );
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="glass border-slate-700/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-slate-200">Zombie Resources</CardTitle>
            {!isPro && (
              <Badge variant="outline" className="text-amber-400 border-amber-500/30 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Actions Locked (FREE)
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="text-slate-300">Resource ID</TableHead>
                  <TableHead className="text-slate-300">Type</TableHead>
                  <TableHead className="text-slate-300">Size (GB)</TableHead>
                  <TableHead className="text-slate-300">Region</TableHead>
                  <TableHead className="text-slate-300">Monthly Cost</TableHead>
                  <TableHead className="text-slate-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resources.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-slate-500 italic">
                      No zombie resources found.
                    </TableCell>
                  </TableRow>
                ) : (
                  resources.map((resource, index) => (
                    <motion.tr
                      key={resource.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.05 }}
                      className="border-slate-700 hover:bg-slate-800/50 transition-colors"
                    >
                      <TableCell className="font-mono text-sm text-slate-300">
                        {resource.resourceId}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-indigo-500/50 text-indigo-400">
                          {resource.resourceType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-300">{resource.sizeGb}</TableCell>
                      <TableCell className="text-slate-400">{resource.region}</TableCell>
                      <TableCell className="text-emerald-400 font-semibold">
                        ${resource.monthlyCost.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={isPro ? "destructive" : "outline"}
                            className={`h-8 w-8 p-0 ${!isPro ? 'border-amber-500/30 text-amber-500/70 hover:bg-amber-500/10' : ''}`}
                            title={isPro ? "Delete" : "Upgrade to Delete"}
                            onClick={() => handleDeleteClick(resource)}
                          >
                            {isPro ? <Trash2 className="h-4 w-4" /> : <Lock className="h-3.5 w-3.5" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0 border-slate-600 hover:bg-slate-700 text-slate-500"
                            title="Ignore"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>

      {selectedVolume && (
        <DeleteConfirmationModal
          open={deleteModalOpen}
          onOpenChange={setDeleteModalOpen}
          volumeId={selectedVolume.resourceId}
          monthlyCost={selectedVolume.monthlyCost}
          onConfirm={handleConfirmDelete}
          isDeleting={isDeleting}
        />
      )}
    </>
  );
}
