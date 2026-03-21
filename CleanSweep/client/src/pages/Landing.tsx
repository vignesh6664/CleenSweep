import { motion } from 'framer-motion';
import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { 
  Zap, 
  ShieldCheck, 
  BarChart3, 
  Clock, 
  ChevronRight, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle,
  Lock,
  Search,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Landing() {
  const { login, register, isAuthenticated } = useKindeAuth();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-indigo-500/30">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white">CS</div>
            <span className="text-xl font-bold text-white tracking-tight">CleanSweep</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#security" className="hover:text-white transition-colors">Security</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Button onClick={() => window.location.href = '/dashboard'} className="bg-indigo-600 hover:bg-indigo-700">
                Go to Dashboard
              </Button>
            ) : (
              <>
                <button onClick={() => login()} className="text-sm font-medium hover:text-white transition-colors">Log in</button>
                <Button onClick={() => register()} className="bg-indigo-600 hover:bg-indigo-700">Get Started</Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-6"
          >
            <Zap className="w-3 h-3 fill-current" />
            <span>FINOPS ENGINE FOR MODERN TEAMS</span>
          </motion.div>
          
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-6"
          >
            Stop Burning Your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">AWS Budget</span>
          </motion.h1>
          
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10"
          >
            CleanSweep finds orphaned EBS volumes and idle instances in 3 minutes. Secure, automated, and built to save you money instantly.
          </motion.p>
          
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button size="lg" onClick={() => register()} className="bg-indigo-600 hover:bg-indigo-700 text-lg px-8 py-6 h-auto">
              Start Free Scan <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline" className="border-slate-700 hover:bg-slate-800 text-lg px-8 py-6 h-auto">
              View Demo
            </Button>
          </motion.div>

          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-16 relative"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-2xl blur opacity-20" />
            <img 
              src="https://images.unsplash.com/photo-1551288049-bbbda5366391?auto=format&fit=crop&q=80&w=2000" 
              alt="Dashboard Preview" 
              className="relative rounded-xl border border-slate-800 shadow-2xl"
            />
          </motion.div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-24 bg-slate-900/50" id="features">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Why FinOps Matters</h2>
            <p className="text-slate-400 max-w-xl mx-auto">Cloud waste isn't just a technical issue—it's a massive hole in your organization's bottom line.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card icon={<AlertTriangle className="text-amber-500" />} title="Forgotten Resources" description="Unattached EBS volumes accrue charges every hour. Most teams have 15% disk waste." />
            <Card icon={<Clock className="text-indigo-500" />} title="Idle Instances" description="Development environments running 24/7 when they are only used 8 hours a day." />
            <Card icon={<BarChart3 className="text-emerald-500" />} title="Complex Pricing" description="AWS makes it easy to spin things up, but hard to find out exactly what is burning money." />
          </div>
        </div>
      </section>

      {/* Trust/Architecture Section */}
      <section className="py-24" id="security">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1 space-y-6">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-md w-fit">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <h2 className="text-4xl font-bold text-white">We Don't Want Your Master Keys.</h2>
            <p className="text-lg text-slate-400">
              CleanSweep is built with a <strong>Zero-Trust Architecture</strong>. Unlike legacy tools that ask for your Secret Keys, we use AWS Cross-Account IAM Roles.
            </p>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-slate-300">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span>One-click CloudFormation deployment</span>
              </li>
              <li className="flex items-center gap-3 text-slate-300">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span>External ID protection (Confused Deputy defense)</span>
              </li>
              <li className="flex items-center gap-3 text-slate-300">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span>Full Audit Logging of all destructive actions</span>
              </li>
            </ul>
            <div className="pt-4">
              <Button className="bg-slate-800 hover:bg-slate-700 border border-slate-700">Read Security Whitepaper</Button>
            </div>
          </div>
          <div className="flex-1 relative">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-inner">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
              </div>
              <pre className="text-xs md:text-sm font-mono text-indigo-300 overflow-x-auto">
{`{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::cleansweep:root"
      },
      "Action": "sts:AssumeRole",
      "Condition": {
        "StringEquals": {
          "sts:ExternalId": "user_2p8X...9jK"
        }
      }
    }
  ]
}`}
              </pre>
            </div>
            <div className="absolute -bottom-6 -right-6 p-4 bg-slate-800 rounded-xl border border-slate-700 shadow-xl flex items-center gap-3">
              <Lock className="w-5 h-5 text-indigo-400" />
              <span className="text-xs font-bold text-slate-200">IAM ROLE SECURE</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-24 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12">
          <div className="space-y-4">
            <div className="p-3 bg-indigo-500/10 rounded-lg w-fit"><Search className="text-indigo-400 w-6 h-6" /></div>
            <h3 className="text-2xl font-bold text-white">Smart Waste Discovery</h3>
            <p className="text-slate-400">Our scanner checks all global AWS regions simultaneously. We find the unattached disks and idle staging servers you forgot existed.</p>
          </div>
          <div className="space-y-4">
            <div className="p-3 bg-emerald-500/10 rounded-lg w-fit"><Clock className="text-emerald-400 w-6 h-6" /></div>
            <h3 className="text-2xl font-bold text-white">Automated Power Scheduling</h3>
            <p className="text-slate-400">Stop paying for dev servers at night. CleanSweep shuts them down at 6 PM and brings them back at 9 AM automatically.</p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24" id="pricing">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Simple, Transparent Pricing</h2>
            <p className="text-slate-400">Scan for free. Pay only to fix and automate.</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Tier */}
            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col">
              <h3 className="text-xl font-bold text-white mb-2">Discovery</h3>
              <p className="text-slate-500 text-sm mb-6">Perfect for auditing your spend.</p>
              <div className="text-4xl font-bold text-white mb-8">$0<span className="text-lg text-slate-500 font-normal">/mo</span></div>
              <ul className="space-y-4 mb-10 flex-1">
                <PricingItem label="Unlimited AWS Account Scans" />
                <PricingItem label="Zombie Resource Detection" />
                <PricingItem label="Monthly Savings Estimator" />
                <PricingItem label="Manual Reporting" disabled />
                <PricingItem label="One-Click Remediation" disabled />
              </ul>
              <Button variant="outline" onClick={() => register()} className="w-full border-slate-700">Get Started</Button>
            </div>
            
            {/* Pro Tier */}
            <div className="p-8 rounded-2xl bg-indigo-600/10 border-2 border-indigo-600 flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">POPULAR</div>
              <h3 className="text-xl font-bold text-white mb-2">Automate (PRO)</h3>
              <p className="text-indigo-300 text-sm mb-6">Everything you need to save money.</p>
              <div className="text-4xl font-bold text-white mb-8">$29<span className="text-lg text-indigo-400 font-normal">/mo</span></div>
              <ul className="space-y-4 mb-10 flex-1">
                <PricingItem label="Unlimited AWS Account Scans" />
                <PricingItem label="One-Click Zombie Deletion" />
                <PricingItem label="Automated Power Scheduling" />
                <PricingItem label="Full Audit & Compliance Logs" />
                <PricingItem label="Weekly Savings Reports" />
              </ul>
              <Button onClick={() => register()} className="w-full bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-900/40">Start Free Trial</Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-3xl p-12 text-center text-white relative overflow-hidden shadow-2xl shadow-indigo-900/40">
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <h2 className="text-4xl font-bold mb-6 relative z-10">Start Saving in 3 Minutes</h2>
            <p className="text-indigo-100 mb-10 max-w-lg mx-auto relative z-10">Connect your account today and find your first $100 in savings before lunch.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
              <Button size="lg" onClick={() => register()} className="bg-white text-indigo-900 hover:bg-slate-100 px-10">Get Started for Free</Button>
              <Button size="lg" variant="ghost" className="text-white hover:bg-white/10">Schedule a Demo</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center font-bold text-white text-xs">CS</div>
            <span className="font-bold text-white">CleanSweep</span>
          </div>
          <p className="text-slate-500 text-sm">© 2026 CleanSweep FinOps Inc. All rights reserved.</p>
          <div className="flex gap-6 text-sm text-slate-400">
            <a href="#" className="hover:text-white transition-colors">Twitter</a>
            <a href="#" className="hover:text-white transition-colors">GitHub</a>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Card({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-8 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-colors">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

function PricingItem({ label, disabled }: { label: string, disabled?: boolean }) {
  return (
    <li className={`flex items-center gap-3 text-sm ${disabled ? 'text-slate-600' : 'text-slate-300'}`}>
      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${disabled ? 'bg-slate-800' : 'bg-indigo-500/20'}`}>
        <Check className={`w-2.5 h-2.5 ${disabled ? 'text-slate-700' : 'text-indigo-400'}`} />
      </div>
      <span className={disabled ? 'line-through' : ''}>{label}</span>
    </li>
  );
}
