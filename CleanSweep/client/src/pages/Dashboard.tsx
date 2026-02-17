import { useState } from 'react';
import { HeroStats } from '../components/dashboard/HeroStats';
import { SavingsChart } from '../components/dashboard/SavingsChart';
import { ZombieTable } from '../components/dashboard/ZombieTable';
import { IdleInstancesTable } from '../components/dashboard/IdleInstancesTable';
import { AddAccountModal } from '../components/dashboard/AddAccountModal';
import { useScannerData } from '../hooks/useScannerData';
import { useAccounts } from '../hooks/useAccounts';
import { useIdleInstances } from '../hooks/useIdleInstances';
import { motion } from 'framer-motion';
import { Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: accounts } = useAccounts();
  const accountId = accounts?.[0]?.id || '47ae8755-9041-451b-96bf-4a522b51295d';
  
  const { data: scanData, isLoading, error } = useScannerData(accountId, false);
  const { data: idleData, isLoading: idleLoading } = useIdleInstances(accountId);

  // Calculate total potential waste (orphaned volumes + idle instances)
  const orphanedVolumeCost = scanData?.totalSavings || 0;
  const idleInstanceCost = idleData?.totalMonthlyCost || 0;
  const totalPotentialWaste = orphanedVolumeCost + idleInstanceCost;
  const totalResourcesFound = (scanData?.resourcesFound || 0) + (idleData?.resourcesFound || 0);

  if (isLoading || idleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-400">Error loading data: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-7xl mx-auto space-y-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">
              CleanSweep
            </h1>
            <p className="text-slate-400 mt-2">FinOps Dashboard - Cloud Waste Detection</p>
          </div>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Connect Account
          </Button>
        </div>

        {/* Hero Stats */}
        <HeroStats
          totalSavings={totalPotentialWaste}
          resourcesFound={totalResourcesFound}
          activeAccounts={accounts?.length || 0}
        />

        {/* Savings Chart */}
        <SavingsChart totalSavings={totalPotentialWaste} />

        {/* Underutilized Instances Table */}
        <IdleInstancesTable 
          instances={idleData?.instances || []} 
          accountId={accountId}
        />

        {/* Zombie Resources Table */}
        <ZombieTable resources={scanData?.results || []} />
      </motion.div>

      {/* Add Account Modal */}
      <AddAccountModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </div>
  );
}
