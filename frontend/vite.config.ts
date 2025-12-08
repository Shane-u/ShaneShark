import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 加载项目本地环境变量（frontend/.env, frontend/.env.production 等）
  const projectEnv = loadEnv(mode, __dirname, '')
  
  // 加载外部环境变量（/root/envFiles/.env, /root/envFiles/.env.production 等）
  // 第三个参数为空字符串表示读取所有变量（不限制 VITE_ 前缀）
  let externalEnv: Record<string, string> = {}
  try {
    // 先尝试读取 mode 特定的文件（如 .env.production），再读取通用 .env
    const modeSpecificEnv = loadEnv(mode, '/root/envFiles', '')
    const generalEnv = loadEnv('', '/root/envFiles', '') // 空 mode 读取 .env
    externalEnv = { ...generalEnv, ...modeSpecificEnv } // mode 特定文件优先级更高
  } catch (err) {
    console.warn('无法加载 /root/envFiles 环境变量:', err)
    // 如果失败，尝试只读取通用 .env
    try {
      externalEnv = loadEnv('', '/root/envFiles', '')
    } catch (fallbackErr) {
      console.warn('无法加载 /root/envFiles/.env:', fallbackErr)
    }
  }
  
  // 合并环境变量，外部变量优先级更高
  const env: Record<string, string> = { ...projectEnv, ...externalEnv }
  
  // 构建时输出关键环境变量状态（不输出实际值）
  if (mode === 'production') {
    console.log('[构建] 环境变量检查:')
    console.log('  VITE_HUGGINGFACE_API_TOKEN:', env.VITE_HUGGINGFACE_API_TOKEN ? '✓ 已设置' : '✗ 未设置')
    console.log('  VITE_HUGGINGFACE_ASR_MODEL:', env.VITE_HUGGINGFACE_ASR_MODEL || '使用默认值')
    console.log('  VITE_HF_PROXY_BASE_URL:', env.VITE_HF_PROXY_BASE_URL || '使用默认值')
  }

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    define: {
      'import.meta.env.SILICON_FLOW_API_KEY': JSON.stringify(env.SILICON_FLOW_API_KEY || ''),
      'import.meta.env.SILICON_FLOW_MODEL': JSON.stringify(env.SILICON_FLOW_MODEL || ''),
      'import.meta.env.VITE_HUGGINGFACE_API_TOKEN': JSON.stringify(env.VITE_HUGGINGFACE_API_TOKEN || ''),
      'import.meta.env.VITE_HUGGINGFACE_ASR_MODEL': JSON.stringify(env.VITE_HUGGINGFACE_ASR_MODEL || ''),
      'import.meta.env.VITE_HF_PROXY_BASE_URL': JSON.stringify(env.VITE_HF_PROXY_BASE_URL || ''),
    },
    base: process.env.VITE_BASE_URL
      ? process.env.VITE_BASE_URL
      : (process.env.GITHUB_ACTIONS ? '/ShaneShark/' : '/'),
    server: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: true,
      proxy: {
        // 避免浏览器跨域，开发环境将 /hf-api 代理到 Hugging Face Inference API
        '/hf-api': {
          target: 'https://router.huggingface.co',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/hf-api/, ''),
        },
      },
    },
  }
})
