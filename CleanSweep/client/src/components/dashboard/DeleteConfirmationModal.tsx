import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';

interface DeleteConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  volumeId: string;
  monthlyCost: number;
  onConfirm: () => void;
  isDeleting: boolean;
}

export function DeleteConfirmationModal({
  open,
  onOpenChange,
  volumeId,
  monthlyCost,
  onConfirm,
  isDeleting,
}: DeleteConfirmationModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-slate-800 border-slate-700">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
            <DialogTitle className="text-slate-100">Delete EBS Volume</DialogTitle>
          </div>
          <DialogDescription className="text-slate-400 pt-4">
            Are you sure you want to delete volume <span className="font-mono text-slate-300">{volumeId}</span>?
          </DialogDescription>
        </DialogHeader>

        <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 my-4">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Monthly Savings:</span>
            <span className="text-2xl font-bold text-emerald-400">
              ${monthlyCost.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <p className="text-sm text-red-400">
            ⚠️ This action cannot be undone. The volume will be permanently deleted from AWS.
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Volume
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
