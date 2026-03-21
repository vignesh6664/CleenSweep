import { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Power, Loader2, Lock, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { stopInstance } from '@/services/api';
import { useQueryClient } from '@tanstack/react-query';
import { useMe } from '@/hooks/useMe';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface IdleInstance {
  instanceId: string;
  instanceName: string;
  instanceType: string;
  region: string;
  avgCpuUtilization: number;
  monthlyCost: number;
}

interface Props {
  instances: IdleInstance[];
  accountId: string;
}

export function IdleInstancesTable({ instances, accountId }: Props) {
  const [stoppingInstances, setStoppingInstances] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();
  const { data: user, upgrade } = useMe();

  const isPro = user?.subscriptionTier === 'PRO';

  const handleStopInstance = async (instance: IdleInstance) => {
    if (!isPro) {
      toast('Upgrade Required', {
        description: 'Automated remediation is a PRO feature.',
        action: {
          label: 'Upgrade',
          onClick: () => upgrade(),
        },
      });
      return;
    }

    setStoppingInstances(prev => new Set(prev).add(instance.instanceId));
    
    try {
      await stopInstance(accountId, instance.region, instance.instanceId);
      queryClient.invalidateQueries({ queryKey: ['idle-instances'] });
      toast.success('Instance stop command sent');
    } catch (err) {
      const error = err as Error;
      console.error('Failed to stop instance:', error);
      toast.error('Failed to stop instance', { description: error.message });
    } finally {
      setStoppingInstances(prev => {
        const newSet = new Set(prev);
        newSet.delete(instance.instanceId);
        return newSet;
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-800"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-500/10 border border-orange-500/20 rounded-xl">
            <Activity className="h-5 w-5 text-orange-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Underutilized Instances</h2>
            <p className="text-xs text-slate-500 font-medium">Flagged for &lt;5% CPU utilization over 7 days</p>
          </div>
        </div>
        {!isPro && instances.length > 0 && (
          <Badge variant="outline" className="text-amber-500/80 border-amber-500/20 bg-amber-500/5 gap-1.5 h-6">
            <Lock className="w-3 h-3" /> Actions Locked
          </Badge>
        )}
      </div>

      <div className="overflow-x-auto">
        {instances.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="p-4 bg-slate-800/50 rounded-full border border-slate-700/50">
              <Search className="w-8 h-8 text-slate-600" />
            </div>
            <div className="max-w-xs space-y-1">
              <p className="text-sm font-semibold text-slate-400">No idle instances found</p>
              <p className="text-xs text-slate-600">Great job! All your running instances seem to be actively working.</p>
            </div>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800 text-left">
                <th className="pb-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Instance</th>
                <th className="pb-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Specs</th>
                <th className="pb-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Region</th>
                <th className="pb-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Utilization</th>
                <th className="pb-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Cost/mo</th>
                <th className="pb-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {instances.map((instance) => {
                const isStopping = stoppingInstances.has(instance.instanceId);
                
                return (
                  <tr
                    key={instance.instanceId}
                    className="group hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div className="flex flex-col">
                        <span className="text-sm text-slate-200 font-bold">{instance.instanceName}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{instance.instanceId}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-400 bg-slate-800/50">
                        {instance.instanceType}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-xs text-slate-400">
                      {instance.region}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-col gap-1.5 w-24">
                        <div className="flex justify-between text-[10px] font-bold">
                          <span className="text-orange-400">{instance.avgCpuUtilization.toFixed(1)}% CPU</span>
                        </div>
                        <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-orange-500 rounded-full" 
                            style={{ width: `${Math.max(instance.avgCpuUtilization, 5)}%` }} 
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-emerald-400 font-black tracking-tight">
                      ${instance.monthlyCost.toFixed(2)}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Button
                        size="sm"
                        variant={isPro ? "destructive" : "outline"}
                        onClick={() => handleStopInstance(instance)}
                        disabled={isStopping}
                        className={`h-8 px-3 text-[10px] font-bold uppercase tracking-wider ${!isPro ? 'border-amber-500/20 text-amber-500/60 hover:bg-amber-500/10' : ''}`}
                      >
                        {isStopping ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : isPro ? (
                          <>Stop</>
                        ) : (
                          <Lock className="w-3 h-3" />
                        )}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {instances.length > 0 && (
        <div className="mt-6 p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl flex items-center justify-between">
          <p className="text-xs text-slate-400 font-medium italic">
            💡 Stopping these {instances.length} instances will reduce your bill by <span className="text-emerald-400 font-bold">${instances.reduce((sum, inst) => sum + inst.monthlyCost, 0).toFixed(2)}</span> this month.
          </p>
          {!isPro && (
            <Button variant="ghost" size="sm" onClick={() => upgrade()} className="text-[10px] font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-tighter">
              Automate with Pro
            </Button>
          )}
        </div>
      )}
    </motion.div>
  );
}
