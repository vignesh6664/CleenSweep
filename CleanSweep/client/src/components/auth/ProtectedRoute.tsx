import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { type ReactNode } from 'react';
import { LogIn } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, login } = useKindeAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-slate-400">Loading authentication...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100 p-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="flex flex-col items-center justify-center">
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent mb-4">
              CleanSweep
            </h1>
            <p className="text-lg text-slate-400 mb-8">
              Sign in to manage your cloud resources and reduce waste.
            </p>
          </div>
          
          <div className="bg-slate-900/50 p-8 rounded-2xl border border-slate-800 backdrop-blur-sm shadow-xl">
            <button
              onClick={() => login()}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-all duration-200 font-medium text-lg shadow-lg hover:shadow-indigo-500/25"
            >
              <LogIn className="h-5 w-5" />
              Sign In to Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
