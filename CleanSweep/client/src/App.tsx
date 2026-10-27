import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { Dashboard } from './pages/Dashboard';
import { Landing } from './pages/Landing';
import { PowerScheduler } from './pages/PowerScheduler';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { CopilotDrawer } from './components/copilot/CopilotDrawer';
import { demoStore } from './services/demoStore';
import { setAccessTokenGetter } from './services/api';
import { useMe } from './hooks/useMe';
import { Toaster } from 'sonner';
import { LayoutDashboard, Clock, LogOut, User, ShieldCheck, Zap, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CopilotProvider, useCopilot } from '@/context/CopilotContext';

function Navigation() {
  const location = useLocation();
  const { logout, isAuthenticated, isLoading, user: kindeUser, getToken } = useKindeAuth();
  const { data: userData, upgrade } = useMe();
  const isDemo = demoStore.isDemoMode();
  const { isOpen, toggleCopilot } = useCopilot();
  
  useEffect(() => {
    if (isAuthenticated) {
      setAccessTokenGetter(async () => {
        const token = await getToken();
        return token || '';
      });
    }
  }, [isAuthenticated, getToken]);
  
  const isActive = (path: string) => location.pathname === path;
  const isPro = isDemo || userData?.subscriptionTier === 'PRO';
  
  // Hide navigation on landing page or when not authenticated (unless in demo mode)
  if ((!isDemo && (isLoading || !isAuthenticated)) || location.pathname === '/') {
    return null;
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-lg border-b border-slate-700/50">
      {isDemo && (
        <div className="bg-gradient-to-r from-amber-500/20 via-indigo-500/20 to-purple-500/20 border-b border-amber-500/30 px-4 py-1 text-center text-xs text-amber-300 flex items-center justify-center gap-2">
          <span className="font-semibold">⚡ Interactive Demo Active:</span>
          <span className="text-slate-300">CleanSweep Copilot & waste scans are fully functional in demo sandbox.</span>
          <button
            onClick={() => {
              demoStore.exitDemoMode();
              window.location.href = '/';
            }}
            className="ml-2 font-bold underline hover:text-amber-200"
          >
            Exit Demo
          </button>
        </div>
      )}
      <div className="max-w-7xl mx-auto px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex flex-col">
            <h2 className="text-xl font-bold text-slate-100 leading-none">CleanSweep</h2>
            <span className="text-[10px] text-indigo-400 font-medium tracking-widest mt-1 uppercase">FinOps Engine</span>
          </Link>
          <div className="flex gap-2">
            <Link
              to="/dashboard"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isActive('/dashboard')
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
            <Link
              to="/scheduler"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isActive('/scheduler')
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Clock className="h-4 w-4" />
              Power Scheduler
            </Link>
          </div>
        </div>
        
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-3">
            {/* Copilot Header Trigger Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleCopilot()}
              className={`h-8 gap-1.5 text-xs transition-all ${
                isOpen
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-900/40'
                  : 'border-indigo-500/40 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{isOpen ? 'Close Copilot' : 'Copilot'}</span>
            </Button>

            {!isPro && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => upgrade()}
                className="border-amber-500/50 text-amber-500 hover:bg-amber-500/10 hover:text-amber-400 h-8 gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                Go PRO
              </Button>
            )}
            <div className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-800/50 rounded-full border border-slate-700/50">
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-emerald-500 flex items-center justify-center">
                <User className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-slate-300 text-sm hidden sm:inline">
                {isDemo ? 'demo@cleansweep.io' : kindeUser?.email}
              </span>
              {isPro && (
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-1.5 py-0">
                  <ShieldCheck className="w-3 h-3" />
                  {isDemo && <span className="ml-1 text-[10px]">DEMO PRO</span>}
                </Badge>
              )}
            </div>
          </div>
          {isDemo ? (
            <button
              onClick={() => {
                demoStore.exitDemoMode();
                window.location.href = '/';
              }}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5"
              title="Exit Demo"
            >
              <LogOut className="h-3.5 w-3.5" />
              Exit Demo
            </button>
          ) : (
            <button
              onClick={() => logout()}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-300 transition-colors"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

function MainLayout() {
  const { isOpen } = useCopilot();
  const location = useLocation();
  const isLanding = location.pathname === '/';

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col relative overflow-x-hidden">
      <Navigation />
      
      {/* Main Content Area - dynamically shrinks horizontally when Copilot is open */}
      <main
        className={`flex-1 min-w-0 transition-all duration-300 ease-in-out ${
          !isLanding && isOpen ? 'mr-0 sm:mr-[460px]' : 'mr-0'
        }`}
      >
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div className="pt-20">
                  <Dashboard />
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/scheduler"
            element={
              <ProtectedRoute>
                <div className="pt-20">
                  <PowerScheduler />
                </div>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Copilot Drawer - docked on the right side */}
      {!isLanding && <CopilotDrawer />}
      
      <Toaster position="bottom-right" theme="dark" closeButton richColors />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <CopilotProvider>
        <MainLayout />
      </CopilotProvider>
    </BrowserRouter>
  );
}

export default App;
