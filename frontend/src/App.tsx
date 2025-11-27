import { Suspense } from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from '@/app/router'

export function App() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-slate-500">Loading...</div>}>
      <RouterProvider router={router} />
    </Suspense>
  )
}

export default App
