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
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Clock, Play, Square, Calendar, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAccounts } from '@/hooks/useAccounts';
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
  const accountId = accounts?.[0]?.id || '';

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
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/50';
      case 'stopped':
        return 'bg-red-500/10 text-red-400 border-red-500/50';
      case 'stopping':
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/50';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/50';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-4xl font-bold text-slate-100 flex items-center gap-3">
              <Clock className="h-10 w-10 text-indigo-400" />
              Power Scheduler
            </h1>
            <p className="text-slate-400 mt-2">
              Automate EC2 instance start/stop schedules to reduce costs
            </p>
          </div>
          
          {/* Region Selector */}
          <div className="flex items-center gap-3">
            <Globe className="h-5 w-5 text-slate-400" />
            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger className="w-[280px] bg-slate-800 border-slate-700 text-slate-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {AWS_REGIONS.map((region) => (
                  <SelectItem key={region.value} value={region.value} className="text-slate-300">
                    {region.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Instances Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="glass border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-slate-200 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                EC2 Instances
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingInstances ? (
                <div className="text-center py-8 text-slate-400">
                  Loading instances...
                </div>
              ) : instances.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  No EC2 instances found
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead className="text-slate-300">Instance ID</TableHead>
                      <TableHead className="text-slate-300">Name</TableHead>
                      <TableHead className="text-slate-300">Type</TableHead>
                      <TableHead className="text-slate-300">State</TableHead>
                      <TableHead className="text-slate-300">Zone</TableHead>
                      <TableHead className="text-slate-300">Schedule</TableHead>
                      <TableHead className="text-slate-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {instances.map((instance: EC2Instance, index: number) => {
                      const schedule = getScheduleForInstance(instance.instanceId);
                      return (
                        <motion.tr
                          key={instance.instanceId}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + index * 0.05 }}
                          className="border-slate-700 hover:bg-slate-800/50 transition-colors"
                        >
                          <TableCell className="font-mono text-sm text-slate-300">
                            {instance.instanceId}
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {instance.tags?.Name || '-'}
                          </TableCell>
                          <TableCell className="text-slate-400">
                            {instance.instanceType}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={getStateColor(instance.state)}
                            >
                              {instance.state === 'running' && (
                                <Play className="h-3 w-3 mr-1" />
                              )}
                              {instance.state === 'stopped' && (
                                <Square className="h-3 w-3 mr-1" />
                              )}
                              {instance.state}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-400">
                            {instance.availabilityZone}
                          </TableCell>
                          <TableCell>
                            {schedule ? (
                              <div className="text-sm">
                                <div className="text-emerald-400">
                                  ⏰ {schedule.startTime} - {schedule.stopTime}
                                </div>
                                <div className="text-slate-500 text-xs">
                                  {schedule.timezone}
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-500">No schedule</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              onClick={() => handleScheduleClick(instance)}
                              className="bg-indigo-600 hover:bg-indigo-700"
                            >
                              <Clock className="h-4 w-4 mr-2" />
                              {schedule ? 'Edit' : 'Schedule'}
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
