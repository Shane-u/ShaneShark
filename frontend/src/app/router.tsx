import { createHashRouter, createRoutesFromElements, Route } from 'react-router-dom'
import { MainLayout } from '@/components/layout/MainLayout'
import { lazy } from 'react'

const HomePage = lazy(() => import('@/pages/HomePage'))
const FavoritesPage = lazy(() => import('@/pages/FavoritesPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))

// 使用 HashRouter 以支持 GitHub Pages（HashRouter 使用 # 号，浏览器不会向服务器发送请求）
export const router = createHashRouter(
  createRoutesFromElements(
    <Route element={<MainLayout />}>
      <Route index element={<HomePage />} />
      <Route path="favorites" element={<FavoritesPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Route>,
  ),
)

