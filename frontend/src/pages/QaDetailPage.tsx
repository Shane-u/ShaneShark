import { useEffect, useState, useRef, useCallback, useLayoutEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Spin, message } from 'antd'
import { ArrowLeftOutlined, FireOutlined, ReadOutlined } from '@ant-design/icons'
import { getQaById } from '@/services/qaApi'
import type { QaInfo } from '@/types/qa'
import { useTheme } from '@/providers/ThemeProvider'
import { Canvas, useFrame } from '@react-three/fiber'
import { Points, PointMaterial, Float } from '@react-three/drei'
import * as random from 'maath/random/dist/maath-random.esm'
import gsap from 'gsap'
import './QaDetailPage.css'

declare global {
  interface Window {
    Doc: {
      createOpenViewer?: (
        element: HTMLElement,
        options?: Record<string, unknown>
      ) => {
        setDocument: (format: string, content: string) => void
        destroy?: () => void
      }
      createOpenEditor?: (
        element: HTMLElement,
        options?: Record<string, unknown>
      ) => {
        setDocument: (format: string, content: string) => void
        getDocument: (format: string) => string
        on: (event: string, callback: () => void) => void
      }
    }
  }
}

const EMPTY_LAKE_DOC = '{"ops":[{"insert":"\\n"}]}'

// 3D 粒子背景组件
function ParticleField({ isDark }: { isDark: boolean }) {
  // Three.js Points 组件的 ref 类型较复杂，使用 unknown 类型
  const ref = useRef<unknown>(null)
  const [sphere] = useState(() => random.inSphere(new Float32Array(6000), { radius: 1.8 }))
  
  useFrame((state, delta) => {
    if(ref.current) {
      const points = ref.current as {
        rotation: { x: number; y: number }
        scale: { set: (x: number, y: number, z: number) => void }
      }
      points.rotation.x -= delta / 15
      points.rotation.y -= delta / 20
      const scale = 1 + Math.sin(state.clock.elapsedTime * 0.5) * 0.05
      points.scale.set(scale, scale, scale)
    }
  })

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <Points ref={ref as any} positions={sphere} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color={isDark ? "#8b5cf6" : "#3b82f6"}
          size={0.003}
          sizeAttenuation={true}
          depthWrite={false}
          opacity={isDark ? 0.8 : 0.6}
        />
      </Points>
    </group>
  )
}

export default function QaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [qaInfo, setQaInfo] = useState<QaInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewerError, setViewerError] = useState<string | null>(null)
  const viewerRef = useRef<HTMLDivElement>(null)
  const viewerInstanceRef = useRef<{
    setDocument: (format: string, content: string) => void
    destroy?: () => void
  } | null>(null)
  const viewerReadyRef = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // 加载QA详情
  useEffect(() => {
    const loadQaDetail = async () => {
      if (!id) return
      try {
        setLoading(true)
        const data = await getQaById(id)
        setQaInfo(data)
      } catch (error) {
        console.error('加载QA详情失败:', error)
        message.error('加载QA详情失败')
        navigate('/qa')
      } finally {
        setLoading(false)
      }
    }
    loadQaDetail()
  }, [id, navigate])

  const renderViewerContent = useCallback(
    (
      rawContent?: string,
      targetViewer?: {
        setDocument: (format: string, content: string) => void
        destroy?: () => void
      }
    ) => {
      const viewer = targetViewer ?? viewerInstanceRef.current
      if (!viewer) {
        return
      }
      const normalized = (rawContent ?? '').trim()
      if (!normalized) {
        try {
          // 空内容时同样使用 Lake JSON，保证查看器和编辑器格式一致
          viewer.setDocument('lake', EMPTY_LAKE_DOC)
        } catch {
          // ignore
        }
        setViewerError(null)
        return
      }
      try {
        // 始终按 Lake 原生格式渲染，从后端拿到的是 JSON 字符串
        viewer.setDocument('lake', normalized)
        setViewerError(null)
      } catch (error) {
        console.error('渲染 Lake 文档失败:', error)
        setViewerError('阅读内容损坏，无法正常展示，请在编辑端重新保存该 QA')
        try {
          viewer.setDocument('lake', EMPTY_LAKE_DOC)
        } catch {
          // ignore
        }
      }
    },
    []
  )

  // 初始化语雀阅读器
  useEffect(() => {
    const loadYuqueViewer = () => {
      return new Promise<void>((resolve, reject) => {
        if (window.Doc) {
          resolve()
          return
        }

        const cssLink = document.createElement('link')
        cssLink.rel = 'stylesheet'
        cssLink.href = '/vendor/lakex/doc.css'
        document.head.appendChild(cssLink)

        const antdCssLink = document.createElement('link')
        antdCssLink.rel = 'stylesheet'
        antdCssLink.href = '/vendor/antd-4.24.13.css'
        document.head.appendChild(antdCssLink)

        const reactScript = document.createElement('script')
        reactScript.src = '/vendor/react.production.min.js'
        reactScript.crossOrigin = 'anonymous'
        reactScript.onload = () => {
          const reactDomScript = document.createElement('script')
          reactDomScript.src = '/vendor/react-dom.production.min.js'
          reactDomScript.crossOrigin = 'anonymous'
          reactDomScript.onload = () => {
            const docScript = document.createElement('script')
            docScript.src = '/vendor/lakex/doc.umd.js'
            docScript.onload = () => resolve()
            docScript.onerror = () => reject(new Error('加载语雀阅读器失败'))
            document.body.appendChild(docScript)
          }
          reactDomScript.onerror = () => reject(new Error('加载ReactDOM失败'))
          document.body.appendChild(reactDomScript)
        }
        reactScript.onerror = () => reject(new Error('加载React失败'))
        document.body.appendChild(reactScript)
      })
    }

    let cancelled = false

    if (viewerRef.current && !viewerInstanceRef.current) {
      loadYuqueViewer()
        .then(() => {
          if (cancelled) {
            return
          }
          if (viewerRef.current && window.Doc && window.Doc.createOpenViewer) {
            const viewer = window.Doc.createOpenViewer(viewerRef.current, {})
            viewerInstanceRef.current = viewer
            viewerReadyRef.current = true
            if (qaInfo) {
              renderViewerContent(qaInfo.answer, viewer)
            } else {
              renderViewerContent(undefined, viewer)
            }
          }
        })
        .catch((error) => {
          console.error('初始化语雀阅读器失败:', error)
          message.error('初始化阅读器失败')
        })
    }

    return () => {
      cancelled = true
      viewerInstanceRef.current?.destroy?.()
      viewerInstanceRef.current = null
      viewerReadyRef.current = false
    }
  }, [qaInfo, renderViewerContent])

  useEffect(() => {
    if (!viewerReadyRef.current || !qaInfo || !viewerInstanceRef.current) {
      return
    }
    renderViewerContent(qaInfo.answer)
  }, [qaInfo, renderViewerContent])

  // GSAP 入场动画
  useLayoutEffect(() => {
    if (!containerRef.current || loading) return
    
    const ctx = gsap.context(() => {
      const elements = containerRef.current?.querySelectorAll('.detail-animate')
      if (elements && elements.length > 0) {
        gsap.fromTo(elements,
          { y: 40, opacity: 0 },
          { 
            y: 0, 
            opacity: 1, 
            duration: 0.8, 
            stagger: 0.1, 
            ease: 'power3.out' 
          }
        )
      }
    }, containerRef)
    
    return () => ctx.revert()
  }, [loading, qaInfo])

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
        <Spin size="large" />
      </div>
    )
  }

  if (!qaInfo) {
    return null
  }

  const themeClass = isDark ? 'text-slate-100' : 'text-slate-800'
  const containerBg = isDark ? 'bg-slate-900/80 border-white/10' : 'bg-white/80 border-indigo-100 shadow-xl shadow-indigo-100/50'

  return (
    <div className={`relative min-h-screen transition-colors duration-700 ${isDark ? 'bg-slate-950' : 'bg-slate-50'} ${themeClass} overflow-x-hidden selection:bg-indigo-500 selection:text-white`}>
      
      {/* 3D 背景层 */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-60">
        <Canvas camera={{ position: [0, 0, 1] }}>
          <Float speed={2} rotationIntensity={1.5} floatIntensity={2}>
            <ParticleField isDark={isDark} />
          </Float>
        </Canvas>
      </div>

      {/* 噪点纹理 (仅在暗黑模式下启用) */}
      {isDark && (
        <div className="fixed inset-0 z-[1] pointer-events-none opacity-[0.03] mix-blend-overlay" 
             style={{backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`}}>
        </div>
      )}

      {/* 内容区域 */}
      <div ref={containerRef} className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        
        {/* 返回按钮 - 简洁设计 */}
        <div className="detail-animate mb-6">
          <button
            onClick={() => navigate('/qa')}
            className={`group flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              isDark 
                ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            <ArrowLeftOutlined className="text-xs" />
            <span>返回列表</span>
          </button>
        </div>

        {/* 主容器 */}
        <div className={`detail-animate relative rounded-3xl overflow-hidden backdrop-blur-md transition-colors duration-500 border ${containerBg}`}>
          
          {/* Mac window header style */}
          <div className={`flex items-center px-6 py-4 border-b gap-3 ${isDark ? 'bg-slate-950/50 border-white/5' : 'bg-slate-50/80 border-indigo-100'}`}>
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
            </div>
            <div className="ml-4 text-xs font-mono text-slate-400 flex-1 text-center opacity-60">
              {qaInfo ? `READING_BUFFER :: ID_${qaInfo.id}` : 'SYSTEM_IDLE'}
            </div>
            <ReadOutlined className="text-slate-400" />
          </div>

          <div className="p-8 md:p-12 min-h-[400px]">
            {/* 头部信息 */}
            <div className={`detail-animate mb-8 pb-6 border-b space-y-4 ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-md ${
                  isDark 
                    ? 'bg-indigo-600 text-white shadow-indigo-500/30' 
                    : 'bg-indigo-100 text-indigo-700'
                }`}>
                  {qaInfo.tag}
                </span>
                {qaInfo.isHot === 1 && (
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                    isDark 
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                      : 'bg-red-50 text-red-600 border border-red-200'
                  }`}>
                    <FireOutlined className="animate-pulse" /> 热门推荐
                  </span>
                )}
                <span className={`text-xs font-mono flex items-center gap-1 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  <ReadOutlined /> VIEWS: {qaInfo.viewCount}
                </span>
              </div>
              
              <h1 className={`text-3xl md:text-4xl font-bold leading-tight ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                {qaInfo.question}
              </h1>
              
              <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                发布时间: {new Date(qaInfo.createTime).toLocaleString()}
              </div>
            </div>

            {/* 内容渲染区 */}
            <div className="detail-animate">
              <div 
                ref={viewerRef} 
                className={`ne-doc-major-viewer min-h-[400px] ${
                  isDark ? 'prose-invert' : ''
                }`} 
              />
          {viewerError && (
                <div className={`mt-6 p-4 rounded-lg border ${
                  isDark 
                    ? 'bg-red-500/10 border-red-500/30 text-red-400' 
                    : 'bg-red-50 border-red-200 text-red-600'
                }`}>
                  <div className="font-medium mb-1">内容渲染错误</div>
                  <div className="text-sm opacity-90">{viewerError}</div>
                </div>
          )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


