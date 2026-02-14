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
import { Trash2, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { useDeleteVolume } from '@/hooks/useDeleteVolume';
import { useAccounts } from '@/hooks/useAccounts';

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
  const accountId = accounts?.[0]?.id || '';
  
  const { mutate: deleteVolume, isPending: isDeleting } = useDeleteVolume();

  const handleDeleteClick = (resource: ZombieResource) => {
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
          },
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
          <CardHeader>
            <CardTitle className="text-slate-200">Zombie Resources</CardTitle>
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
                {resources.map((resource, index) => (
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
                          variant="destructive"
                          className="h-8 w-8 p-0"
                          title="Delete"
                          onClick={() => handleDeleteClick(resource)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0 border-slate-600 hover:bg-slate-700"
                          title="Ignore"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
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
