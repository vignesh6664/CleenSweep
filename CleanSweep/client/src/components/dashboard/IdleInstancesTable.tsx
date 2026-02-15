import { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Power, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { stopInstance } from '@/services/api';
import { useQueryClient } from '@tanstack/react-query';

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

  const handleStopInstance = async (instance: IdleInstance) => {
    setStoppingInstances(prev => new Set(prev).add(instance.instanceId));
    
    try {
      await stopInstance(accountId, instance.region, instance.instanceId);
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['idle-instances'] });
    } catch (err) {
      const error = err as Error;
      console.error('Failed to stop instance:', error);
      alert(`Failed to stop instance: ${error.message}`);
    } finally {
      setStoppingInstances(prev => {
        const newSet = new Set(prev);
        newSet.delete(instance.instanceId);
        return newSet;
      });
    }
  };

  if (instances.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-orange-500/20 rounded-lg">
          <Activity className="h-5 w-5 text-orange-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white">Underutilized Instances</h2>
          <p className="text-sm text-slate-400">Instances with &lt;5% CPU utilization (7-day average)</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Instance Name</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Instance ID</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Type</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Region</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Avg CPU</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Monthly Cost</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {instances.map((instance) => {
              const isStopping = stoppingInstances.has(instance.instanceId);
              
              return (
                <tr
                  key={instance.instanceId}
                  className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
                >
                  <td className="py-4 px-4 text-sm text-white font-medium">
                    {instance.instanceName}
                  </td>
                  <td className="py-4 px-4 text-sm text-slate-300 font-mono">
                    {instance.instanceId}
                  </td>
                  <td className="py-4 px-4 text-sm text-slate-300">
                    <span className="px-2 py-1 bg-slate-700 rounded text-xs">
                      {instance.instanceType}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm text-slate-300">
                    {instance.region}
                  </td>
                  <td className="py-4 px-4 text-sm">
                    <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded font-semibold">
                      {instance.avgCpuUtilization.toFixed(2)}%
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm text-emerald-400 font-semibold">
                    ${instance.monthlyCost.toFixed(2)}
                  </td>
                  <td className="py-4 px-4">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleStopInstance(instance)}
                      disabled={isStopping}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {isStopping ? (
                        <>
                          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                          Stopping...
                        </>
                      ) : (
                        <>
                          <Power className="mr-2 h-3 w-3" />
                          Stop Instance
                        </>
                      )}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
        <p className="text-sm text-orange-300">
          💡 <strong>Tip:</strong> These instances are running but barely used. Consider stopping them to save{' '}
          <span className="font-semibold text-emerald-400">
            ${instances.reduce((sum, inst) => sum + inst.monthlyCost, 0).toFixed(2)}/month
          </span>
        </p>
      </div>
    </motion.div>
  );
}
