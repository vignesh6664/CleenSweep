import { useState } from 'react';
import { HeroStats } from '../components/dashboard/HeroStats';
import { SavingsChart } from '../components/dashboard/SavingsChart';
import { ZombieTable } from '../components/dashboard/ZombieTable';
import { DemoModeToggle } from '../components/dashboard/DemoModeToggle';
import { useScannerData } from '../hooks/useScannerData';
import { useAccounts } from '../hooks/useAccounts';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export function Dashboard() {
  const [demoMode, setDemoMode] = useState(true);
  const { data: accounts } = useAccounts();
  const accountId = accounts?.[0]?.id || '47ae8755-9041-451b-96bf-4a522b51295d';
  
  const { data: scanData, isLoading, error } = useScannerData(accountId, demoMode);

  if (isLoading) {
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
          <DemoModeToggle demoMode={demoMode} onToggle={setDemoMode} />
        </div>

        {/* Hero Stats */}
        <HeroStats
          totalSavings={scanData?.totalSavings || 0}
          resourcesFound={scanData?.resourcesFound || 0}
          activeAccounts={accounts?.length || 1}
        />

        {/* Savings Chart */}
        <SavingsChart totalSavings={scanData?.totalSavings || 0} />

        {/* Zombie Resources Table */}
        <ZombieTable resources={scanData?.results || []} />
      </motion.div>
    </div>
  );
}
