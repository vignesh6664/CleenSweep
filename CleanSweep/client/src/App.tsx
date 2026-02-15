import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { Dashboard } from './pages/Dashboard';
import { PowerScheduler } from './pages/PowerScheduler';
import { Toaster } from 'sonner';
import { LayoutDashboard, Clock, LogIn, LogOut, User } from 'lucide-react';
import { setAccessTokenGetter } from './services/api';

function Navigation() {
  const location = useLocation();
  const { login, logout, isAuthenticated, isLoading, user, getToken } = useKindeAuth();
  
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
  
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-lg border-b border-slate-700/50">
      <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <h2 className="text-xl font-bold text-slate-100">CleanSweep</h2>
          <div className="flex gap-2">
            <Link
              to="/"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isActive('/')
                  ? 'bg-indigo-600 text-white'
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
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Clock className="h-4 w-4" />
              Power Scheduler
            </Link>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {isLoading ? (
            <div className="text-slate-400 text-sm">Loading...</div>
          ) : isAuthenticated ? (
            <>
              <div className="flex items-center gap-2 text-slate-300 text-sm">
                <User className="h-4 w-4" />
                <span>{user?.email}</span>
              </div>
              <button
                onClick={() => logout()}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={() => login()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
            >
              <LogIn className="h-4 w-4" />
              Sign In
            </button>
          )}
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
          <Route path="/" element={<Dashboard />} />
          <Route path="/scheduler" element={<PowerScheduler />} />
        </Routes>
      </div>
      <Toaster position="top-right" theme="dark" />
    </BrowserRouter>
  );
}

export default App;
