import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface DemoModeToggleProps {
  demoMode: boolean;
  onToggle: (enabled: boolean) => void;
}

export function DemoModeToggle({ demoMode, onToggle }: DemoModeToggleProps) {
  return (
    <div className="flex items-center space-x-2">
      <Switch
        id="demo-mode"
        checked={demoMode}
        onCheckedChange={onToggle}
      />
      <Label htmlFor="demo-mode" className="text-slate-300 cursor-pointer">
        Demo Mode
      </Label>
    </div>
  );
}
