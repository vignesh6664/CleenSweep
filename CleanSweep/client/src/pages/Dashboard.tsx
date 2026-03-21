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
import { Loader2, Plus, Zap, ShieldCheck, History, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
            <div className="flex items-center gap-2 mt-2">
              <p className="text-slate-400">FinOps Dashboard - Cloud Waste Detection</p>
              {isPro ? (
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> PRO PLAN
                </Badge>
              ) : (
                <Badge variant="outline" className="text-slate-500 border-slate-700">FREE PLAN</Badge>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            {!isPro && (
              <Button
                onClick={() => upgrade()}
                disabled={isUpgrading}
                className="bg-amber-600 hover:bg-amber-700 text-white border-none shadow-lg shadow-amber-900/20"
              >
                {isUpgrading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4 fill-current" />}
                Upgrade to PRO
              </Button>
            )}
            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Connect Account
            </Button>
          </div>
        </div>

        {/* PRO Banner for Free Users */}
        {!isPro && (
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-gradient-to-r from-indigo-600/20 to-emerald-600/20 border border-indigo-500/30 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-500/20 rounded-lg">
                <Zap className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Unlock One-Click Savings</h3>
                <p className="text-slate-400 text-sm">Free accounts can only view waste. Upgrade to PRO to delete resources and automate schedules.</p>
              </div>
            </div>
            <Button onClick={() => upgrade()} className="bg-white text-indigo-900 hover:bg-slate-100 whitespace-nowrap">
              Start Free Trial of PRO
            </Button>
          </motion.div>
        )}

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

        {/* Audit Logs / Activity Section */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-slate-100 flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-400" />
                Audit Logs
              </CardTitle>
              <CardDescription className="text-slate-400">Track all destructive actions for compliance and accountability.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {auditLogs && auditLogs.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700 hover:bg-transparent">
                    <TableHead className="text-slate-400">Action</TableHead>
                    <TableHead className="text-slate-400">Resource</TableHead>
                    <TableHead className="text-slate-400">Account</TableHead>
                    <TableHead className="text-slate-400">Date</TableHead>
                    <TableHead className="text-slate-400 text-right">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log: any) => (
                    <TableRow key={log.id} className="border-slate-700 hover:bg-slate-700/50 transition-colors">
                      <TableCell className="font-medium text-slate-200">
                        <Badge variant="outline" className="bg-slate-900/50 border-slate-700 text-slate-400">
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-400 font-mono text-xs">{log.resourceId}</TableCell>
                      <TableCell className="text-slate-400">{log.account?.accountName}</TableCell>
                      <TableCell className="text-slate-400 text-xs">
                        {new Date(log.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="text-slate-500 hover:text-indigo-400">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-12 text-center">
                <p className="text-slate-500 italic">No activity recorded yet.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Add Account Modal */}
      <AddAccountModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </div>
  );
}
