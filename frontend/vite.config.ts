import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const projectEnv = loadEnv(mode, __dirname, '')
  const externalEnv = loadEnv(mode, '/home/envFiles', '')
  const env = { ...projectEnv, ...externalEnv }

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
