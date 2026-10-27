import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
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
import { Badge } from '@/components/ui/badge';
import { Loader2, ExternalLink, ShieldCheck, Key, Info, Copy, Cloud, Check, AlertTriangle } from 'lucide-react';
import { useCreateAccount } from '@/hooks/useCreateAccount';
import { toast } from 'sonner';

const AWS_REGIONS = [
  { value: 'us-east-1', label: 'US East (N. Virginia)' },
  { value: 'us-east-2', label: 'US East (Ohio)' },
  { value: 'us-west-1', label: 'US West (N. California)' },
  { value: 'us-west-2', label: 'US West (Oregon)' },
  { value: 'eu-west-1', label: 'Europe (Ireland)' },
  { value: 'eu-central-1', label: 'Europe (Frankfurt)' },
  { value: 'ap-south-1', label: 'Asia Pacific (Mumbai)' },
  { value: 'ap-south-2', label: 'Asia Pacific (Hyderabad)' },
  { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
  { value: 'ap-southeast-2', label: 'Asia Pacific (Sydney)' },
];

const accountSchema = z.object({
  accountName: z.string().min(3, 'Account name must be at least 3 characters'),
  provider: z.literal('AWS'),
  region: z.string().min(1, 'Please select a region'),
  accessKey: z.string().optional(),
  secretKey: z.string().optional(),
  roleArn: z.string().optional(),
  externalId: z.string().optional(),
}).refine((data) => {
  const hasKeys = data.accessKey && data.secretKey;
  const hasRole = data.roleArn && data.externalId;
  return hasKeys || hasRole;
}, {
  message: "Either Access Keys or IAM Role information must be fully provided",
  path: ["accessKey"]
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

  useEffect(() => {
    if (open) {
      setGeneratedExternalId(Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));
    }
  }, [open]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue,
    reset,
  } = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      provider: 'AWS',
      region: '',
    },
  });

  useEffect(() => {
    if (useIamRole && generatedExternalId) {
      setValue('externalId', generatedExternalId);
      setValue('accessKey', undefined);
      setValue('secretKey', undefined);
    } else {
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
        toast.success('Cloud account connected successfully');
      },
      onError: (err) => {
        toast.error('Connection failed', { description: err.message });
      }
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const cloudFormationUrl = `https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/new?stackName=CleanSweepRole&templateURL=https://cleansweep-templates.s3.amazonaws.com/cross-account-role.yaml&param_ExternalId=${generatedExternalId}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-slate-950 border-slate-800 p-0 overflow-hidden shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500" />
        
        <div className="p-8">
          <DialogHeader className="mb-8">
            <DialogTitle className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-lg">
                <Cloud className="w-6 h-6 text-indigo-400" />
              </div>
              Connect Cloud Account
            </DialogTitle>
            <DialogDescription className="text-slate-500 font-medium text-base pt-1">
              Select a method to integrate your AWS environment.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl mb-8">
            <button
              type="button"
              onClick={() => setUseIamRole(true)}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl transition-all duration-300 font-bold text-[11px] uppercase tracking-wider ${
                useIamRole 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40 scale-[1.02]' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <ShieldCheck className={`w-4 h-4 ${useIamRole ? 'text-white' : 'text-slate-600'}`} />
              IAM Role
              {useIamRole && <Check className="w-3 h-3 ml-auto" />}
            </button>
            <button
              type="button"
              onClick={() => setUseIamRole(false)}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl transition-all duration-300 font-bold text-[11px] uppercase tracking-wider ${
                !useIamRole 
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/40 scale-[1.02]' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Key className={`w-4 h-4 ${!useIamRole ? 'text-white' : 'text-slate-600'}`} />
              Access Keys
              {!useIamRole && <Check className="w-3 h-3 ml-auto" />}
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="accountName" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                  Friendly Name
                </Label>
                <Input
                  id="accountName"
                  placeholder="e.g. Production AWS"
                  {...register('accountName')}
                  className="bg-slate-900 border-slate-800 text-slate-200 h-11 focus:ring-indigo-500/20 focus:border-indigo-500/50 rounded-xl placeholder:text-slate-700"
                />
                {errors.accountName && (
                  <p className="text-[10px] font-bold text-red-400 ml-1">{errors.accountName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="region" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                  Primary Region
                </Label>
                <Controller
                  name="region"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="bg-slate-900 border-slate-800 text-slate-200 h-11 focus:ring-indigo-500/20 focus:border-indigo-500/50 rounded-xl">
                        <SelectValue placeholder="Select region" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800 text-slate-300">
                        {AWS_REGIONS.map((region) => (
                          <SelectItem key={region.value} value={region.value}>
                            {region.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.region && (
                  <p className="text-[10px] font-bold text-red-400 ml-1">{errors.region.message}</p>
                )}
              </div>
            </div>

            {useIamRole ? (
              <div className="space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 p-1 bg-indigo-500/20 rounded-md">
                      <Info className="w-3.5 h-3.5 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-indigo-200">How to connect (Recommended)</p>
                      <p className="text-[11px] text-indigo-300/70 mt-1 leading-relaxed">
                        The most secure way to connect. Use our CloudFormation template to create a limited-access role.
                      </p>
                    </div>
                  </div>
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full bg-indigo-600 text-white hover:bg-indigo-700 border-none h-10 rounded-xl flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest"
                    onClick={() => window.open(cloudFormationUrl, '_blank')}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Launch Template
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="externalId" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">External ID</Label>
                      <Badge variant="outline" className="text-[9px] border-indigo-500/20 text-indigo-400 bg-indigo-500/5 px-1.5 h-4 font-bold">REQUIRED</Badge>
                    </div>
                    <div className="relative group/id">
                      <Input
                        id="externalId"
                        value={generatedExternalId}
                        readOnly
                        className="bg-slate-950 border-slate-800 text-slate-400 font-mono text-xs cursor-default pr-10 h-11 rounded-xl group-hover/id:border-slate-700 transition-colors"
                      />
                      <button 
                        type="button"
                        onClick={() => copyToClipboard(generatedExternalId)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-600 hover:text-indigo-400 transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="roleArn" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Role ARN</Label>
                    <Input
                      id="roleArn"
                      placeholder="arn:aws:iam::..."
                      {...register('roleArn')}
                      className="bg-slate-900 border-slate-800 text-slate-200 font-mono text-xs h-11 focus:ring-indigo-500/20 focus:border-indigo-500/50 rounded-xl placeholder:text-slate-700"
                    />
                    {errors.roleArn && (
                      <p className="text-[10px] font-bold text-red-400 ml-1">{errors.roleArn.message}</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 flex items-center gap-3 mb-4">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <p className="text-[10px] font-bold text-amber-200/70 leading-tight uppercase tracking-tight">
                    Legacy mode: IAM Role is highly recommended for security.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accessKey" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Access Key ID</Label>
                  <Input
                    id="accessKey"
                    placeholder="AKIA..."
                    {...register('accessKey')}
                    className="bg-slate-900 border-slate-800 text-slate-200 font-mono text-xs h-11 rounded-xl placeholder:text-slate-700"
                  />
                  {errors.accessKey && (
                    <p className="text-[10px] font-bold text-red-400 ml-1">{errors.accessKey.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secretKey" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Secret Access Key</Label>
                  <Input
                    id="secretKey"
                    type="password"
                    placeholder="••••••••••••••••••••••••••••••••"
                    {...register('secretKey')}
                    className="bg-slate-900 border-slate-800 text-slate-200 font-mono text-xs h-11 rounded-xl placeholder:text-slate-700"
                  />
                  {errors.secretKey && (
                    <p className="text-[10px] font-bold text-red-400 ml-1">{errors.secretKey.message}</p>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
                className="flex-1 text-slate-500 hover:text-slate-200 hover:bg-slate-900 h-12 rounded-xl font-bold uppercase tracking-widest text-[10px]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className={`flex-[2] h-12 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg transition-all active:scale-[0.98] ${
                  useIamRole 
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-900/20' 
                    : 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-900/20'
                }`}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    Verify & Connect
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
