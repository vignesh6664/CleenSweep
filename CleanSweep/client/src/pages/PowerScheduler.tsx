import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Clock, Calendar, Globe, Zap, Search, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAccounts } from '@/hooks/useAccounts';
import { useMe } from '@/hooks/useMe';
import { listInstances, listSchedules } from '@/services/api';
import { ScheduleModal } from '@/components/scheduler/ScheduleModal';

interface EC2Instance {
  instanceId: string;
  instanceType: string;
  state: string;
  launchTime: Date;
  availabilityZone: string;
  tags: Record<string, string>;
}

interface Schedule {
  id: string;
  instanceId: string;
  stopTime: string;
  startTime: string;
  timezone: string;
  isEnabled: boolean;
}

const AWS_REGIONS = [
  { value: 'us-east-1', label: 'US East (N. Virginia)' },
  { value: 'us-west-2', label: 'US West (Oregon)' },
  { value: 'ap-south-1', label: 'Asia Pacific (Mumbai)' },
  { value: 'ap-south-2', label: 'Asia Pacific (Hyderabad)' },
  { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
  { value: 'ap-southeast-2', label: 'Asia Pacific (Sydney)' },
  { value: 'eu-west-1', label: 'Europe (Ireland)' },
  { value: 'eu-central-1', label: 'Europe (Frankfurt)' },
];

export function PowerScheduler() {
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState<EC2Instance | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [selectedRegion, setSelectedRegion] = useState('ap-south-1');

  const { data: accounts } = useAccounts();
  const { data: user, upgrade, isUpgrading } = useMe();
  const accountId = accounts?.[0]?.id || '';

  const isPro = user?.subscriptionTier === 'PRO';

  const { data: instances = [], isLoading: loadingInstances } = useQuery({
    queryKey: ['instances', accountId, selectedRegion],
    queryFn: () => listInstances(accountId, selectedRegion),
    enabled: !!accountId,
  });

  const { data: schedules = [] } = useQuery({
    queryKey: ['schedules', accountId],
    queryFn: () => listSchedules(accountId),
    enabled: !!accountId,
  });

  const getScheduleForInstance = (instanceId: string) => {
    return schedules.find((s: Schedule) => s.instanceId === instanceId);
  };

  const handleScheduleClick = (instance: EC2Instance) => {
    const existingSchedule = getScheduleForInstance(instance.instanceId);
    setSelectedInstance(instance);
    setSelectedSchedule(existingSchedule || null);
    setScheduleModalOpen(true);
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case 'running':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'stopped':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'stopping':
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Consistent Header Card */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/40 p-6 rounded-2xl border border-slate-800/50 backdrop-blur-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                <Clock className="h-8 w-8 text-indigo-400" />
                Power Scheduler
              </h1>
              {isPro ? (
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold">
                  PRO
                </Badge>
              ) : (
                <Badge variant="outline" className="text-slate-500 border-slate-800 text-[10px] font-bold">FREE</Badge>
              )}
            </div>
            <p className="text-slate-500 text-sm font-medium">Automated start/stop policies for cost optimization</p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Region Selector */}
            <div className="flex items-center gap-2 bg-slate-950/50 border border-slate-800 px-3 py-1.5 rounded-xl">
              <Globe className="h-3.5 w-3.5 text-slate-500" />
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger className="w-[200px] bg-transparent border-none text-slate-300 h-auto p-0 focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-slate-300">
                  {AWS_REGIONS.map((region) => (
                    <SelectItem key={region.value} value={region.value}>
                      {region.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!isPro && (
              <Button
                onClick={() => upgrade()}
                disabled={isUpgrading}
                variant="outline"
                className="border-amber-500/20 bg-amber-500/5 text-amber-500 hover:bg-amber-500/10 h-10 px-4 gap-2"
              >
                {isUpgrading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="w-4 h-4 fill-current" />}
                Upgrade
              </Button>
            )}
          </div>
        </div>

        {/* Instances Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="border-b border-slate-800/50">
              <CardTitle className="text-sm font-bold text-slate-300 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-indigo-400" />
                EC2 Resource Inventory
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loadingInstances ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                  <p className="text-slate-500 text-sm animate-pulse">Querying AWS resources...</p>
                </div>
              ) : instances.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="p-4 bg-slate-800/50 rounded-full border border-slate-700/50">
                    <Search className="w-8 h-8 text-slate-600" />
                  </div>
                  <div className="max-w-xs space-y-1">
                    <p className="text-sm font-semibold text-slate-400">No instances found in this region</p>
                    <p className="text-xs text-slate-600">Try selecting a different region or connecting an account with active resources.</p>
                  </div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800 hover:bg-transparent">
                      <th className="py-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-left">Instance Details</th>
                      <th className="py-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-left">Type & Zone</th>
                      <th className="py-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-left">Current State</th>
                      <th className="py-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-left">Active Schedule</th>
                      <th className="py-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {instances.map((instance: EC2Instance, index: number) => {
                      const schedule = getScheduleForInstance(instance.instanceId);
                      return (
                        <motion.tr
                          key={instance.instanceId}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 + index * 0.03 }}
                          className="border-slate-800/50 hover:bg-slate-800/30 transition-colors group"
                        >
                          <TableCell className="py-4 px-6">
                            <div className="flex flex-col">
                              <span className="text-sm text-slate-200 font-bold">{instance.tags?.Name || 'Unnamed Instance'}</span>
                              <span className="text-[10px] text-slate-500 font-mono tracking-tighter">{instance.instanceId}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4 px-6">
                            <div className="flex flex-col gap-1">
                              <Badge variant="outline" className="w-fit text-[10px] border-slate-800 text-slate-400 bg-slate-950/50 px-1.5 py-0">
                                {instance.instanceType}
                              </Badge>
                              <span className="text-[10px] text-slate-600">{instance.availabilityZone}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4 px-6">
                            <Badge
                              variant="outline"
                              className={`${getStateColor(instance.state)} px-2 py-0.5 text-[10px] font-bold flex items-center w-fit gap-1`}
                            >
                              {instance.state === 'running' ? <div className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" /> : <div className="w-1 h-1 rounded-full bg-red-400" />}
                              {instance.state.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-4 px-6">
                            {schedule ? (
                              <div className="flex flex-col">
                                <div className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                                  <div className="w-1 h-1 rounded-full bg-indigo-400" />
                                  {schedule.startTime} — {schedule.stopTime}
                                </div>
                                <div className="text-[10px] text-slate-600 font-medium pl-2.5">
                                  {schedule.timezone}
                                </div>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-600 font-bold italic">No active policy</span>
                            )}
                          </TableCell>
                          <TableCell className="py-4 px-6 text-right">
                            <Button
                              size="sm"
                              variant={schedule ? "outline" : "default"}
                              onClick={() => handleScheduleClick(instance)}
                              className={`h-8 px-4 text-[10px] font-bold uppercase tracking-wider transition-all ${
                                schedule 
                                  ? 'border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10' 
                                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/20'
                              }`}
                            >
                              {schedule ? 'Edit Policy' : 'Set Schedule'}
                            </Button>
                          </TableCell>
                        </motion.tr>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {selectedInstance && (
        <ScheduleModal
          open={scheduleModalOpen}
          onOpenChange={setScheduleModalOpen}
          instance={selectedInstance}
          existingSchedule={selectedSchedule}
          accountId={accountId}
          region={selectedRegion}
        />
      )}
    </div>
  );
}
