import { createBrowserRouter, createRoutesFromElements, Route } from 'react-router-dom'
import { MainLayout } from '@/components/layout/MainLayout'
import { lazy } from 'react'

const HomePage = lazy(() => import('@/pages/HomePage'))
const FavoritesPage = lazy(() => import('@/pages/FavoritesPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))

export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<MainLayout />}>
      <Route index element={<HomePage />} />
      <Route path="favorites" element={<FavoritesPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Route>,
  ),
)

