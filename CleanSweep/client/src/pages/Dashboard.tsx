import { useState } from 'react';
import { HeroStats } from '../components/dashboard/HeroStats';
import { SavingsChart } from '../components/dashboard/SavingsChart';
import { ZombieTable } from '../components/dashboard/ZombieTable';
import { IdleInstancesTable } from '../components/dashboard/IdleInstancesTable';
import { AddAccountModal } from '../components/dashboard/AddAccountModal';
import { useScannerData } from '../hooks/useScannerData';
import { useAccounts } from '../hooks/useAccounts';
import { useIdleInstances } from '../hooks/useIdleInstances';
import { useMe } from '../hooks/useMe';
import { useAuditLogs } from '../hooks/useAuditLogs';
import { motion } from 'framer-motion';
import { Loader2, Plus, Zap, History, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: accounts } = useAccounts();
  const { data: user, upgrade, isUpgrading } = useMe();
  const { data: auditLogs } = useAuditLogs();
  
  const accountId = accounts?.[0]?.id || '';
  
  const { data: scanData, isLoading: scanLoading } = useScannerData(accountId, false);
  const { data: idleData, isLoading: idleLoading } = useIdleInstances(accountId);

  const isPro = user?.subscriptionTier === 'PRO';
  const hasAccounts = accounts && accounts.length > 0;

  // Calculate total potential waste
  const orphanedVolumeCost = scanData?.totalSavings || 0;
  const idleInstanceCost = idleData?.totalMonthlyCost || 0;
  const totalPotentialWaste = orphanedVolumeCost + idleInstanceCost;
  const totalResourcesFound = (scanData?.resourcesFound || 0) + (idleData?.resourcesFound || 0);

  if (scanLoading || idleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-7xl mx-auto space-y-6"
      >
        {/* Tightened Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/40 p-6 rounded-2xl border border-slate-800/50 backdrop-blur-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-white tracking-tight">
                CleanSweep
              </h1>
              {isPro ? (
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold">
                  PRO
                </Badge>
              ) : (
                <Badge variant="outline" className="text-slate-500 border-slate-800 text-[10px] font-bold">FREE</Badge>
              )}
            </div>
            <p className="text-slate-500 text-sm font-medium">Cloud Financial Operations Control Center</p>
          </div>
          
          <div className="flex items-center gap-3">
            {!isPro && (
              <Button
                onClick={() => upgrade()}
                disabled={isUpgrading}
                variant="outline"
                className="border-amber-500/20 bg-amber-500/5 text-amber-500 hover:bg-amber-500/10 h-10 px-4"
              >
                {isUpgrading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4 fill-current" />}
                Upgrade
              </Button>
            )}
            
            <motion.div
              animate={!hasAccounts ? { scale: [1, 1.05, 1] } : {}}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <Button
                onClick={() => setIsModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/20 h-10 px-6 gap-2"
              >
                <Plus className="w-4 h-4" />
                Connect Account
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Hero Stats with Connect CTA logic */}
        <HeroStats
          totalSavings={totalPotentialWaste}
          resourcesFound={totalResourcesFound}
          activeAccounts={accounts?.length || 0}
          onConnectClick={() => setIsModalOpen(true)}
        />

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Savings Chart - Occupies 2/3 on large screens */}
          <div className="lg:col-span-2">
            <SavingsChart totalSavings={totalPotentialWaste} />
          </div>

          {/* Activity Feed - Occupies 1/3 */}
          <Card className="bg-slate-900/50 border-slate-800 overflow-hidden flex flex-col">
            <CardHeader className="pb-4 border-b border-slate-800/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-slate-300 flex items-center gap-2">
                  <History className="w-4 h-4 text-indigo-400" />
                  Recent Activity
                </CardTitle>
                <Badge variant="outline" className="text-[10px] border-slate-800 text-slate-500">Live</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-y-auto max-h-[350px]">
              {auditLogs && auditLogs.length > 0 ? (
                <div className="divide-y divide-slate-800/50">
                  {auditLogs.slice(0, 6).map((log: any) => (
                    <div key={log.id} className="p-4 hover:bg-slate-800/30 transition-colors space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-tighter">{log.action.replace(/_/g, ' ')}</span>
                        <span className="text-[10px] text-slate-600">{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-xs text-slate-300 font-mono truncate">{log.resourceId}</p>
                      <p className="text-[10px] text-slate-500">{log.account?.accountName}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-3">
                  <div className="p-3 bg-slate-800/50 rounded-full">
                    <History className="w-6 h-6 text-slate-700" />
                  </div>
                  <p className="text-xs text-slate-600 italic">Waiting for actions...</p>
                </div>
              )}
            </CardContent>
            {auditLogs && auditLogs.length > 0 && (
              <div className="p-3 bg-slate-900/80 border-t border-slate-800/50 text-center">
                <Button variant="ghost" size="sm" className="text-[10px] text-slate-500 hover:text-indigo-400 h-6">View Full Audit Trail <ArrowRight className="w-3 h-3 ml-1" /></Button>
              </div>
            )}
          </Card>
        </div>

        {/* Action Tables */}
        <div className="space-y-6">
          <IdleInstancesTable 
            instances={idleData?.instances || []} 
            accountId={accountId}
          />
          <ZombieTable resources={scanData?.results || []} />
        </div>
      </motion.div>

      {/* Add Account Modal */}
      <AddAccountModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </div>
  );
}
