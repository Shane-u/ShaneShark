import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// 引入 antd 全局样式，保证 Modal 等组件以浮层形式展示
import 'antd/dist/antd.css'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from '@/providers/ThemeProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)
