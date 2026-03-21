import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { Dashboard } from './pages/Dashboard';
import { PowerScheduler } from './pages/PowerScheduler';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { setAccessTokenGetter } from './services/api';
import { useMe } from './hooks/useMe';
import { Toaster } from 'sonner';
import { LayoutDashboard, Clock, LogOut, User, ShieldCheck, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

function Navigation() {
  const location = useLocation();
  const { logout, isAuthenticated, isLoading, user: kindeUser, getToken } = useKindeAuth();
  const { data: userData, upgrade } = useMe();
  
  // Set up the access token getter for API calls
  useEffect(() => {
    if (isAuthenticated) {
      setAccessTokenGetter(async () => {
        const token = await getToken();
        return token || '';
      });
    }
  }, [isAuthenticated, getToken]);
  
  const isActive = (path: string) => location.pathname === path;
  const isPro = userData?.subscriptionTier === 'PRO';
  
  // Conditionally render Navigation only when authenticated
  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-lg border-b border-slate-700/50">
      <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-slate-100 leading-none">CleanSweep</h2>
            <span className="text-[10px] text-indigo-400 font-medium tracking-widest mt-1">FINOPS ENGINE</span>
          </div>
          <div className="flex gap-2">
            <Link
              to="/"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isActive('/')
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
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
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
              <span className="text-slate-300 text-sm hidden sm:inline">{kindeUser?.email}</span>
              {isPro && (
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-1.5 py-0">
                  <ShieldCheck className="w-3 h-3" />
                </Badge>
              )}
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-300 transition-colors"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Navigation />
      <div className="pt-20">
        <Routes>
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/scheduler" element={
            <ProtectedRoute>
              <PowerScheduler />
            </ProtectedRoute>
          } />
        </Routes>
      </div>
      <Toaster position="bottom-right" theme="dark" closeButton richColors />
    </BrowserRouter>
  );
}

export default App;
