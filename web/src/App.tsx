import { Suspense, lazy } from 'react'
import { Route, Routes } from 'react-router-dom'

import { RequireAuth } from '@/auth/require-auth'
import { HomePage } from '@/pages/home'
import { LoginPage } from '@/pages/login'

/**
 * 调试页必须懒加载：它渲染全部 127 个 beUI 组件（连同 shiki / 几十个 chart），静态
 * import 会把它们全带进主包，而这一页上线前就要整页删掉。
 */
const ThemeDebugPage = lazy(() =>
  import('@/pages/debug/theme').then((m) => ({ default: m.ThemeDebugPage })),
)

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<RequireAuth />}>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/debug/theme"
          element={
            <Suspense fallback={null}>
              <ThemeDebugPage />
            </Suspense>
          }
        />
      </Route>
    </Routes>
  )
}

export default App
