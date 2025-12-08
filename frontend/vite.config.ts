import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 加载项目本地环境变量（frontend/.env, frontend/.env.production 等）
  const projectEnv = loadEnv(mode, __dirname, '')
  
  // 加载外部环境变量（/root/envFiles/.env, /root/envFiles/.env.production 等）
  // 注意：在 GitHub Actions 中，/root/envFiles 不存在，会失败但不影响构建
  // GitHub Actions 会通过 process.env 传递环境变量，loadEnv 会自动读取
  let externalEnv: Record<string, string> = {}
  try {
    // loadEnv 会自动读取 .env, .env.local, .env.[mode], .env.[mode].local
    // 第三个参数为空字符串会读取所有变量，但 Vite 只会暴露 VITE_ 开头的变量给客户端
    externalEnv = loadEnv(mode, '/root/envFiles', '')
    console.log(`[环境变量] 从 /root/envFiles 读取到 ${Object.keys(externalEnv).length} 个变量`)
  } catch (err) {
    // 在 GitHub Actions 或本地没有 /root/envFiles 时，这是正常的，不输出警告
    if (process.env.GITHUB_ACTIONS) {
      console.log('[环境变量] GitHub Actions 环境，跳过 /root/envFiles（使用 GitHub Secrets）')
    } else {
      console.warn('[环境变量] 无法加载 /root/envFiles 环境变量:', err)
    }
  }
  
  // 合并环境变量优先级：process.env（GitHub Actions）> externalEnv（/root/envFiles）> projectEnv（frontend/.env）
  // loadEnv 已经自动包含了 process.env，所以这里只需要合并文件中的变量
  const env: Record<string, string> = { ...projectEnv, ...externalEnv }
  
  // 在 GitHub Actions 中，process.env 中的变量会被 loadEnv 自动读取并覆盖文件中的变量
  // 所以 GitHub Secrets 传递的变量优先级最高
  
  // 输出关键环境变量状态（用于调试，不输出实际值）
  console.log('[环境变量] 合并后的关键变量状态:')
  console.log('  VITE_HUGGINGFACE_API_TOKEN:', env.VITE_HUGGINGFACE_API_TOKEN ? `✓ 已设置 (长度: ${env.VITE_HUGGINGFACE_API_TOKEN.length})` : '✗ 未设置')
  console.log('  VITE_HUGGINGFACE_ASR_MODEL:', env.VITE_HUGGINGFACE_ASR_MODEL || '使用默认值')
  console.log('  VITE_HF_PROXY_BASE_URL:', env.VITE_HF_PROXY_BASE_URL || '使用默认值')
  
  // 检查所有以 VITE_HUGGINGFACE 开头的变量（用于调试）
  const hfVars = Object.keys(env).filter(key => key.startsWith('VITE_HUGGINGFACE'))
  if (hfVars.length > 0) {
    console.log(`[环境变量] 找到 ${hfVars.length} 个 VITE_HUGGINGFACE 变量:`, hfVars.join(', '))
  }

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    define: {
      // SiliconFlow 相关变量：不在 GitHub Actions 中设置，优先从服务器 /root/envFiles/.env 读取
      // 如果都不存在则为空字符串，前端代码会处理缺失情况
      'import.meta.env.SILICON_FLOW_API_KEY': JSON.stringify(env.SILICON_FLOW_API_KEY || ''),
      'import.meta.env.SILICON_FLOW_MODEL': JSON.stringify(env.SILICON_FLOW_MODEL || ''),
      // Hugging Face 相关变量：从 GitHub Secrets 或 /root/envFiles/.env 读取
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
