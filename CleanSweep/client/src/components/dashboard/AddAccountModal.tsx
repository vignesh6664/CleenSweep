import { useState, useEffect } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { Loader2, Plus, HelpCircle, ExternalLink, ShieldCheck, Key } from 'lucide-react';
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
  region: z.string().min(1, 'Please select a region'),
  
  // Method 1: Access Keys
  accessKey: z.string().optional(),
  secretKey: z.string().optional(),
  
  // Method 2: IAM Role
  roleArn: z.string().optional(),
  externalId: z.string().optional(),
}).refine((data) => {
  // Check if either keys or role info is provided
  const hasKeys = data.accessKey && data.secretKey;
  const hasRole = data.roleArn && data.externalId;
  return hasKeys || hasRole;
}, {
  message: "Either Access Keys or IAM Role information must be fully provided",
  path: ["accessKey"] // just a default path for the error
});

type AccountFormData = z.infer<typeof accountSchema>;

interface AddAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddAccountModal({ open, onOpenChange }: AddAccountModalProps) {
  const { mutate: createAccount, isPending } = useCreateAccount();
  const [useIamRole, setUseIamRole] = useState(true);
  const [generatedExternalId, setGeneratedExternalId] = useState('');

  // Generate a random External ID when the modal opens
  useEffect(() => {
    if (open && !generatedExternalId) {
      setGeneratedExternalId(Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));
    }
  }, [open, generatedExternalId]);

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

  // Watch for externalId to pre-fill it
  useEffect(() => {
    if (useIamRole && generatedExternalId) {
      setValue('externalId', generatedExternalId);
      // Clear keys when switching to role
      setValue('accessKey', undefined);
      setValue('secretKey', undefined);
    } else {
      // Clear role info when switching to keys
      setValue('roleArn', undefined);
      setValue('externalId', undefined);
    }
  }, [useIamRole, generatedExternalId, setValue]);

  const onSubmit = (data: AccountFormData) => {
    createAccount(data, {
      onSuccess: () => {
        reset();
        setGeneratedExternalId('');
        onOpenChange(false);
      },
    });
  };

  const cloudFormationUrl = `https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/new?stackName=CleanSweepRole&templateURL=https://cleansweep-templates.s3.amazonaws.com/cross-account-role.yaml&param_ExternalId=${generatedExternalId}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] bg-slate-800 border-slate-700 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-slate-100 flex items-center gap-2">
            Connect Cloud Account
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Connect your AWS account securely to scan for waste.
          </DialogDescription>
        </DialogHeader>

        {/* Connection Method Toggle */}
        <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-700/50 mb-4">
          <div className="flex items-center gap-3">
            {useIamRole ? (
              <div className="p-2 bg-indigo-500/10 rounded-md">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
              </div>
            ) : (
              <div className="p-2 bg-amber-500/10 rounded-md">
                <Key className="w-5 h-5 text-amber-400" />
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-slate-200">
                {useIamRole ? 'Secure IAM Role (Recommended)' : 'AWS Access Keys (Legacy)'}
              </p>
              <p className="text-xs text-slate-500">
                {useIamRole ? 'Uses temporary security tokens' : 'Stores long-term credentials'}
              </p>
            </div>
          </div>
          <Switch 
            checked={useIamRole} 
            onCheckedChange={setUseIamRole}
            className="data-[state=checked]:bg-indigo-600"
          />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Account Name */}
          <div className="space-y-2">
            <Label htmlFor="accountName" className="text-slate-200">
              Account Name
            </Label>
            <Input
              id="accountName"
              placeholder="Production AWS"
              {...register('accountName')}
              className="bg-slate-900 border-slate-600 text-slate-100"
            />
            {errors.accountName && (
              <p className="text-sm text-red-400">{errors.accountName.message}</p>
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

          {useIamRole ? (
            <div className="space-y-4 pt-2 border-t border-slate-700 mt-2">
              <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-md p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <HelpCircle className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm text-indigo-200 font-medium">How to connect via IAM Role</p>
                    <ol className="text-xs text-indigo-300/80 mt-1 space-y-1 list-decimal list-inside">
                      <li>Use the External ID provided below.</li>
                      <li>Deploy a Role in your AWS account with a Trust Policy.</li>
                      <li>Paste the generated Role ARN back here.</li>
                    </ol>
                  </div>
                </div>
                
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="w-full bg-indigo-500/10 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20 flex items-center gap-2"
                  onClick={() => window.open(cloudFormationUrl, '_blank')}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Launch CloudFormation Template
                </Button>
              </div>

              {/* External ID (Read only) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="externalId" className="text-slate-200">External ID</Label>
                  <span className="text-[10px] text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">Required for Trust</span>
                </div>
                <Input
                  id="externalId"
                  value={generatedExternalId}
                  readOnly
                  className="bg-slate-900/50 border-slate-700 text-slate-300 font-mono text-sm cursor-not-allowed"
                />
                <p className="text-[10px] text-slate-500">Copy this ID to your IAM Trust Policy if not using the template.</p>
              </div>

              {/* Role ARN */}
              <div className="space-y-2">
                <Label htmlFor="roleArn" className="text-slate-200">Role ARN</Label>
                <Input
                  id="roleArn"
                  placeholder="arn:aws:iam::123456789012:role/CleanSweepRole"
                  {...register('roleArn')}
                  className="bg-slate-900 border-slate-600 text-slate-100 font-mono text-sm"
                />
                {errors.roleArn && (
                  <p className="text-sm text-red-400">{errors.roleArn.message}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4 pt-2 border-t border-slate-700 mt-2">
              <div className="space-y-2">
                <Label htmlFor="accessKey" className="text-slate-200">Access Key ID</Label>
                <Input
                  id="accessKey"
                  placeholder="AKIA..."
                  {...register('accessKey')}
                  className="bg-slate-900 border-slate-600 text-slate-100 font-mono text-sm"
                />
                {errors.accessKey && (
                  <p className="text-sm text-red-400">{errors.accessKey.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="secretKey" className="text-slate-200">Secret Access Key</Label>
                <Input
                  id="secretKey"
                  type="password"
                  placeholder="wJalr..."
                  {...register('secretKey')}
                  className="bg-slate-900 border-slate-600 text-slate-100 font-mono text-sm"
                />
                {errors.secretKey && (
                  <p className="text-sm text-red-400">{errors.secretKey.message}</p>
                )}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className="text-slate-400 hover:text-slate-100 hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-indigo-600 hover:bg-indigo-700 min-w-[140px]"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
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
