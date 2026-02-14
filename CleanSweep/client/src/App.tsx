import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { Dashboard } from './pages/Dashboard';
import { Toaster } from 'sonner';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Dashboard />
      <Toaster position="top-right" theme="dark" />
    </QueryClientProvider>
  );
}

export default App;
