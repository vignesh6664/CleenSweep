import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { KindeProvider } from '@kinde-oss/kinde-auth-react'
import { queryClient } from './lib/queryClient'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <KindeProvider
      clientId={import.meta.env.VITE_KINDE_CLIENT_ID}
      domain={import.meta.env.VITE_KINDE_DOMAIN}
      redirectUri={import.meta.env.VITE_KINDE_REDIRECT_URI}
      logoutUri={import.meta.env.VITE_KINDE_LOGOUT_REDIRECT_URI}
    >
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </KindeProvider>
  </StrictMode>,
)
