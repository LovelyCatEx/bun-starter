import { ThemeProvider } from 'next-themes'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import './i18n/config'
import App from './App.tsx'
import { AuthProvider } from './auth/auth-provider'
import { Toaster } from './components/ui/sonner'
import { ThemeSettingsProvider } from './hooks/theme-settings-provider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <ThemeSettingsProvider>
        <BrowserRouter>
          <AuthProvider>
            <App />
            <Toaster />
          </AuthProvider>
        </BrowserRouter>
      </ThemeSettingsProvider>
    </ThemeProvider>
  </StrictMode>,
)
