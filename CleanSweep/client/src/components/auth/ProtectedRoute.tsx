import { type ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  // In demo mode, no authentication is required - full access to demo data
  return <>{children}</>;
}
