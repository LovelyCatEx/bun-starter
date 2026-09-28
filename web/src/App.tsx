import { Suspense, lazy } from 'react'
import { Route, Routes } from 'react-router-dom'

import { RequireAuth } from '@/auth/require-auth'
import { HomePage } from '@/pages/home'
import { LoginPage } from '@/pages/login'

/**
 * 调试页**必须**懒加载，不要改成静态 import。
 *
 * 这一页把全部 127 个 beUI 组件（连同 shiki 的语法高亮、几十个 chart）都渲染一遍，
 * 静态 import 会让它们全部进主包 —— 首页用户的下载量翻好几倍，换来的却是一个
 * 上线前就要整页删掉的开发工具。拆出去之后它自成一个 chunk，只有真的访问
 * `/debug/theme` 才会去取。
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
