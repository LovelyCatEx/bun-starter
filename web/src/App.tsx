import { Route, Routes } from 'react-router-dom'

import { RequireAuth } from '@/auth/require-auth'
import { ThemeDebugPage } from '@/pages/debug/theme'
import { HomePage } from '@/pages/home'
import { LoginPage } from '@/pages/login'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<RequireAuth />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/debug/theme" element={<ThemeDebugPage />} />
      </Route>
    </Routes>
  )
}

export default App
