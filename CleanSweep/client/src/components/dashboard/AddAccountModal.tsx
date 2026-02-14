import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Loader2, Plus } from 'lucide-react';
import { useCreateAccount } from '@/hooks/useCreateAccount';

const AWS_REGIONS = [
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'eu-west-1',
  'eu-west-2',
  'eu-central-1',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-northeast-1',
];

const accountSchema = z.object({
  accountName: z.string().min(3, 'Account name must be at least 3 characters'),
  provider: z.literal('AWS'),
  accessKey: z
    .string()
    .regex(/^AKIA[A-Z0-9]{16}$/, 'Invalid AWS Access Key format (must start with AKIA)'),
  secretKey: z.string().min(40, 'Secret key must be at least 40 characters'),
  region: z.string().min(1, 'Please select a region'),
});

type AccountFormData = z.infer<typeof accountSchema>;

interface AddAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddAccountModal({ open, onOpenChange }: AddAccountModalProps) {
  const { mutate: createAccount, isPending } = useCreateAccount();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      provider: 'AWS',
    },
  });

  const onSubmit = (data: AccountFormData) => {
    createAccount(data, {
      onSuccess: () => {
        reset();
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-slate-800 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-slate-100">Connect Cloud Account</DialogTitle>
          <DialogDescription className="text-slate-400">
            Add your AWS account credentials to start scanning for orphaned resources.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          {/* Account Name */}
          <div className="space-y-2">
            <Label htmlFor="accountName" className="text-slate-200">
              Account Name
            </Label>
            <Input
              id="accountName"
              placeholder="My AWS Account"
              {...register('accountName')}
              className="bg-slate-900 border-slate-600 text-slate-100"
            />
            {errors.accountName && (
              <p className="text-sm text-red-400">{errors.accountName.message}</p>
            )}
          </div>

          {/* Provider */}
          <div className="space-y-2">
            <Label htmlFor="provider" className="text-slate-200">
              Provider
            </Label>
            <Select defaultValue="AWS" disabled>
              <SelectTrigger className="bg-slate-900 border-slate-600 text-slate-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AWS">AWS</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Access Key */}
          <div className="space-y-2">
            <Label htmlFor="accessKey" className="text-slate-200">
              Access Key ID
            </Label>
            <Input
              id="accessKey"
              placeholder="AKIAIOSFODNN7EXAMPLE"
              {...register('accessKey')}
              className="bg-slate-900 border-slate-600 text-slate-100 font-mono text-sm"
            />
            {errors.accessKey && (
              <p className="text-sm text-red-400">{errors.accessKey.message}</p>
            )}
          </div>

          {/* Secret Key */}
          <div className="space-y-2">
            <Label htmlFor="secretKey" className="text-slate-200">
              Secret Access Key
            </Label>
            <Input
              id="secretKey"
              type="password"
              placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
              {...register('secretKey')}
              className="bg-slate-900 border-slate-600 text-slate-100 font-mono text-sm"
            />
            {errors.secretKey && (
              <p className="text-sm text-red-400">{errors.secretKey.message}</p>
            )}
          </div>

          {/* Region */}
          <div className="space-y-2">
            <Label htmlFor="region" className="text-slate-200">
              Default Region
            </Label>
            <Select onValueChange={(value) => setValue('region', value)}>
              <SelectTrigger className="bg-slate-900 border-slate-600 text-slate-100">
                <SelectValue placeholder="Select a region" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {AWS_REGIONS.map((region) => (
                  <SelectItem
                    key={region}
                    value={region}
                    className="text-slate-100 focus:bg-slate-700"
                  >
                    {region}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.region && (
              <p className="text-sm text-red-400">{errors.region.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Connect Account
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
