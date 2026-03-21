import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, AlertTriangle, Cloud, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface HeroStatsProps {
  totalSavings: number;
  resourcesFound: number;
  activeAccounts: number;
  onConnectClick?: () => void;
}

export function HeroStats({ totalSavings, resourcesFound, activeAccounts, onConnectClick }: HeroStatsProps) {
  const stats = [
    {
      title: 'Total Savings',
      value: `$${totalSavings.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-emerald-400',
      accentColor: 'emerald',
      description: 'Per month potential',
    },
    {
      title: 'Potential Waste',
      value: resourcesFound,
      icon: AlertTriangle,
      color: 'text-indigo-400',
      accentColor: 'indigo',
      description: 'Zombie resources detected',
    },
    {
      title: 'Active Accounts',
      value: activeAccounts,
      icon: Cloud,
      color: 'text-blue-400',
      accentColor: 'blue',
      description: 'Connected cloud providers',
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.4, ease: "easeOut" }}
          whileHover={{ y: -4 }}
        >
          <Card className="relative overflow-hidden border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl shadow-slate-950/20 group transition-all duration-300 hover:border-slate-700/50">
            {/* Subtle Gradient Background */}
            <div className={`absolute -right-4 -top-4 w-24 h-24 blur-3xl opacity-10 rounded-full bg-${stat.accentColor}-500 transition-opacity group-hover:opacity-20`} />
            
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-xl bg-slate-950/50 border border-slate-800/50 group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col">
                {stat.title === 'Active Accounts' && activeAccounts === 0 ? (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-3xl font-extrabold text-slate-600">0</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={onConnectClick}
                      className="h-7 px-2 text-[10px] bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300 border border-indigo-500/20 rounded-md gap-1"
                    >
                      <Plus className="w-3 h-3" /> Connect
                    </Button>
                  </div>
                ) : (
                  <div className={`text-3xl font-extrabold tracking-tight ${stat.color} mt-1`}>
                    {stat.value}
                  </div>
                )}
                <p className="text-[11px] font-medium text-slate-500 mt-2 flex items-center gap-1.5">
                  <span className={`w-1 h-1 rounded-full bg-${stat.accentColor}-500/50`} />
                  {stat.description}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
