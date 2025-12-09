import { createHashRouter, createRoutesFromElements, Route } from 'react-router-dom'
import { MainLayout } from '@/components/layout/MainLayout'
import { lazy } from 'react'

const HomePage = lazy(() => import('@/pages/HomePage'))
const FavoritesPage = lazy(() => import('@/pages/FavoritesPage'))
const QaPage = lazy(() => import('@/pages/QaPage'))
const QaDetailPage = lazy(() => import('@/pages/QaDetailPage'))
const QaEditPage = lazy(() => import('@/pages/QaEditPage'))
const ReviewCheckPage = lazy(() => import('@/pages/ReviewCheckPage'))
const SandboxPage = lazy(() => import('@/pages/SandboxPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))

// 支持的锚点路由
const anchorRoutes = ['home', 'projects', 'skills', 'blog', 'footprint', 'books']

// 使用 HashRouter 以支持 GitHub Pages（HashRouter 使用 # 号，浏览器不会向服务器发送请求）
export const router = createHashRouter(
  createRoutesFromElements(
    <Route element={<MainLayout />}>
      <Route index element={<HomePage />} />
      <Route path="favorites" element={<FavoritesPage />} />
      <Route path="qa" element={<QaPage />} />
      <Route path="qa/:id" element={<QaDetailPage />} />
      <Route path="qa/edit/:id" element={<QaEditPage />} />
      <Route path="review" element={<ReviewCheckPage />} />
      <Route path="sandbox" element={<SandboxPage />} />
      {/* 锚点路由直接渲染 HomePage，HomePage 会根据路径滚动到对应锚点 */}
      {anchorRoutes.map((anchor) => (
        <Route key={anchor} path={anchor} element={<HomePage />} />
      ))}
      <Route path="*" element={<NotFoundPage />} />
    </Route>,
  ),
)

