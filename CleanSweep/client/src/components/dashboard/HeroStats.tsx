import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, AlertTriangle, Cloud } from 'lucide-react';
import { motion } from 'framer-motion';

interface HeroStatsProps {
  totalSavings: number;
  resourcesFound: number;
  activeAccounts: number;
}

export function HeroStats({ totalSavings, resourcesFound, activeAccounts }: HeroStatsProps) {
  const stats = [
    {
      title: 'Total Savings',
      value: `$${totalSavings.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
    {
      title: 'Potential Waste',
      value: resourcesFound,
      icon: AlertTriangle,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-500/10',
    },
    {
      title: 'Active Accounts',
      value: activeAccounts,
      icon: Cloud,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="glass border-slate-700/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stat.color}`}>
                {stat.value}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {stat.title === 'Total Savings' && 'Per month'}
                {stat.title === 'Potential Waste' && 'Resources detected'}
                {stat.title === 'Active Accounts' && 'Cloud providers'}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
