import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Clock, Loader2, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { createSchedule, updateSchedule, deleteSchedule } from '@/services/api';
import { convertToUTC, convertToLocal, getUserTimezone, COMMON_TIMEZONES } from '@/utils/timezone';

interface ScheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instance: {
    instanceId: string;
    instanceType: string;
    tags: Record<string, string>;
  };
  existingSchedule: {
    id: string;
    stopTime: string;
    startTime: string;
    timezone: string;
    isEnabled: boolean;
  } | null;
  accountId: string;
  region: string;
}

export function ScheduleModal({
  open,
  onOpenChange,
  instance,
  existingSchedule,
  accountId,
  region,
}: ScheduleModalProps) {
  const queryClient = useQueryClient();
  const userTimezone = getUserTimezone();

  const [startTime, setStartTime] = useState('08:00');
  const [stopTime, setStopTime] = useState('20:00');
  const [timezone, setTimezone] = useState(userTimezone);

  useEffect(() => {
    if (existingSchedule) {
      // Convert UTC times to local timezone for display
      setStartTime(convertToLocal(existingSchedule.startTime, existingSchedule.timezone));
      setStopTime(convertToLocal(existingSchedule.stopTime, existingSchedule.timezone));
      setTimezone(existingSchedule.timezone);
    } else {
      setStartTime('08:00');
      setStopTime('20:00');
      setTimezone(userTimezone);
    }
  }, [existingSchedule, userTimezone, open]);

  const createMutation = useMutation({
    mutationFn: (data: any) => createSchedule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      toast.success('Schedule created successfully!');
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error('Failed to create schedule', { description: error.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateSchedule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      toast.success('Schedule updated successfully!');
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error('Failed to update schedule', { description: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSchedule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      toast.success('Schedule deleted successfully!');
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error('Failed to delete schedule', { description: error.message });
    },
  });

  const handleSave = () => {
    // Convert local times to UTC before saving
    const startTimeUTC = convertToUTC(startTime, timezone);
    const stopTimeUTC = convertToUTC(stopTime, timezone);

    if (existingSchedule) {
      updateMutation.mutate({
        id: existingSchedule.id,
        data: {
          startTime: startTimeUTC,
          stopTime: stopTimeUTC,
          timezone,
          isEnabled: true,
        },
      });
    } else {
      createMutation.mutate({
        instanceId: instance.instanceId,
        accountId,
        region,
        startTime: startTimeUTC,
        stopTime: stopTimeUTC,
        timezone,
      });
    }
  };

  const handleDelete = () => {
    if (existingSchedule) {
      deleteMutation.mutate(existingSchedule.id);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-slate-800 border-slate-700">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg">
              <Clock className="h-6 w-6 text-indigo-400" />
            </div>
            <div>
              <DialogTitle className="text-slate-100">
                {existingSchedule ? 'Edit Schedule' : 'Create Schedule'}
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                {instance.tags?.Name || instance.instanceId}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="timezone" className="text-slate-300">
              Timezone
            </Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger className="bg-slate-900 border-slate-700 text-slate-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {COMMON_TIMEZONES.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value} className="text-slate-300">
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime" className="text-slate-300">
                Start Time
              </Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="bg-slate-900 border-slate-700 text-slate-300"
              />
              <p className="text-xs text-slate-500">Instance will start at this time</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stopTime" className="text-slate-300">
                Stop Time
              </Label>
              <Input
                id="stopTime"
                type="time"
                value={stopTime}
                onChange={(e) => setStopTime(e.target.value)}
                className="bg-slate-900 border-slate-700 text-slate-300"
              />
              <p className="text-xs text-slate-500">Instance will stop at this time</p>
            </div>
          </div>

          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-3">
            <p className="text-sm text-indigo-300">
              💡 Times are stored in UTC and will execute at the correct local time based on your
              selected timezone.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          {existingSchedule && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
              className="mr-auto"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </>
              )}
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isLoading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {isLoading && !deleteMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Schedule
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
