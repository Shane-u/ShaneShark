/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-empty */
import { useState, useEffect, useRef, useLayoutEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pagination, Button, Modal, Input, message, Empty, notification, Tooltip } from 'antd'
import { 
  PlusOutlined, 
  FireOutlined, 
  LockOutlined, 
  ReadOutlined, 
  EditOutlined, 
  SearchOutlined,
  CloseOutlined,
  AppstoreOutlined
} from '@ant-design/icons'
import { useTheme } from '@/providers/ThemeProvider'
import { Sparkles } from 'lucide-react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Points, PointMaterial, Float } from '@react-three/drei'
import * as random from 'maath/random/dist/maath-random.esm'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// --- 原始业务导入 ---
import { getQaList, deleteAdminQa, loginQaAdmin, fetchAdminSession } from '@/services/qaApi'
import type { QaInfo } from '@/types/qa'
import { QA_TAGS } from '@/types/qa'
import { useSse } from '@/hooks/useSse'
import './QaPage.css' // 建议保留这个引入，主要用于处理Antd的样式覆盖

// 注册GSAP插件
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

// --- 辅助函数 ---
const ensureYuqueAssets = (): Promise<void> => {
  if (typeof window === 'undefined') return Promise.resolve()
  if ((window as unknown as { Doc?: unknown }).Doc) return Promise.resolve()
  const globalAny = window as unknown as { __yuqueAssetsPromise__?: Promise<void> }
  if (globalAny.__yuqueAssetsPromise__) return globalAny.__yuqueAssetsPromise__

  globalAny.__yuqueAssetsPromise__ = new Promise<void>((resolve, reject) => {
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
        docScript.onerror = () => reject(new Error('加载语雀文档核心脚本失败'))
        document.body.appendChild(docScript)
      }
      reactDomScript.onerror = () => reject(new Error('加载 ReactDOM 失败'))
      document.body.appendChild(reactDomScript)
    }
    reactScript.onerror = () => reject(new Error('加载 React 失败'))
    document.body.appendChild(reactScript)
  })
  return globalAny.__yuqueAssetsPromise__
}

const goToQaEdit = (id: string) => {
  const { origin, pathname } = window.location
  const base = `${origin}${pathname.replace(/\/$/, '')}`
  window.location.href = `${base}#/qa/edit/${id}`
}

const convertAnswerToHtml = (content: string) => {
  if (!content) return '<p class="text-gray-400 italic">暂时没有答案内容。</p>'
  const trimmed = content.trim()
  if (!trimmed) return '<p class="text-gray-400 italic">暂时没有答案内容。</p>'

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed)
      const blocks = parsed?.blocks || parsed?.body || parsed?.nodes || []
      const renderNode = (node: unknown): string => {
        if (!node) return ''
        if (Array.isArray(node)) return node.map((child) => renderNode(child)).join('')
        if (typeof node === 'string') return node
        const anyNode = node as any
        if (anyNode.text) return anyNode.text
        const childrenHtml = renderNode(anyNode.children || anyNode.body || anyNode.content)
        const type = anyNode.type || anyNode.name
        if (!type) return childrenHtml
        const tagMap: Record<string, string> = {
          paragraph: 'p',
          heading: anyNode.props?.level ? `h${anyNode.props.level}` : 'h2',
          heading1: 'h1', heading2: 'h2', heading3: 'h3', heading4: 'h4',
          bulletList: 'ul', orderedList: 'ol', listItem: 'li',
          quote: 'blockquote', table: 'table', tableHead: 'thead',
          tableBody: 'tbody', tableRow: 'tr', tableCell: 'td', codeBlock: 'pre',
        }
        const tag = tagMap[type] || (type.startsWith('heading') ? `h${type.slice(-1)}` : 'p')
        return `<${tag}>${childrenHtml}</${tag}>`
      }
      if (Array.isArray(blocks)) return blocks.map((block: unknown) => `<p>${renderNode(block)}</p>`).join('')
      if (typeof blocks === 'object') return `<p>${renderNode(blocks)}</p>`
    } catch { }
  }
  if (trimmed.includes('<')) return trimmed
  return `<p>${trimmed.replace(/\n+/g, '<br />')}</p>`
}

// 提取纯文本，用于“检验复盘”预填，去掉 Lake/HTML 元信息
const extractPlainText = (raw: string) => {
  if (!raw) return ''
  return raw
    // 去掉 Lake/HTML 标签
    .replace(/<[^>]+>/g, ' ')
    // 解码常见实体
    .replace(/&nbsp;/g, ' ')
    // 收敛多余空白
    .replace(/\s+/g, ' ')
    .trim()
}

// --- Visual Component: Three.js Particles ---
function ParticleField({ isDark }: { isDark: boolean }) {
  const ref = useRef<any>()
  const [sphere] = useState(() => random.inSphere(new Float32Array(6000), { radius: 1.8 }))
  
  // 每一帧旋转
  useFrame((state, delta) => {
    if(ref.current) {
      ref.current.rotation.x -= delta / 15
      ref.current.rotation.y -= delta / 20
      // 呼吸效果
      const scale = 1 + Math.sin(state.clock.elapsedTime * 0.5) * 0.05
      ref.current.scale.set(scale, scale, scale)
    }
  })

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color={isDark ? "#8b5cf6" : "#3b82f6"} // 夜间紫色，白天蓝色
          size={0.003}
          sizeAttenuation={true}
          depthWrite={false}
          opacity={isDark ? 0.8 : 0.6}
        />
      </Points>
    </group>
  )
}

// --- Main Component ---
export default function QaPage() {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  
  // --- 状态定义 ---
  const [qaList, setQaList] = useState<QaInfo[]>([])
  const [total, setTotal] = useState(0)
  const [current, setCurrent] = useState(1)
  const [pageSize] = useState(12)
  const [selectedTag, setSelectedTag] = useState<string>('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminModalVisible, setAdminModalVisible] = useState(false)
  const [adminPassword, setAdminPassword] = useState('')
  const [selectedQa, setSelectedQa] = useState<QaInfo | null>(null)
  
  // Refs
  const gridRef = useRef<HTMLDivElement>(null)
  const answerPanelRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)

  // SSE 接收
  const { data: hotQaStream } = useSse<QaInfo>('/qa/hot/sse')

  // --- 逻辑: Scroll To ---
  const scrollToRead = (qa: QaInfo, withAnimation = true) => {
    setSelectedQa(qa)
    if (withAnimation) {
      setTimeout(() => {
        if (answerPanelRef.current) {
          // 添加视觉反馈：高亮阅读面板
          gsap.fromTo(answerPanelRef.current, 
            { scale: 0.98, opacity: 0.8 },
            { scale: 1, opacity: 1, duration: 0.3, ease: 'power2.out' }
          )
          // 使用原生scrollTo方法，避免GSAP ScrollToPlugin未注册的问题
          const elementTop = answerPanelRef.current.getBoundingClientRect().top + window.pageYOffset
          const offset = 80
          window.scrollTo({
            top: elementTop - offset,
            behavior: 'smooth'
          })
        }
      }, 100)
    }
  }

  // --- 逻辑: SSE 数据处理与交互弹窗 ---
  const hotQaList = useMemo(() => {
    if (!hotQaStream?.length) return []
    const dedupeMap = new Map<string, QaInfo>()
    ;[...hotQaStream].reverse().forEach((item) => {
      if (item?.id) dedupeMap.set(item.id, item)
    })
    return Array.from(dedupeMap.values()).slice(0, 4)
  }, [hotQaStream])

  useEffect(() => {
    if (hotQaStream && hotQaStream.length > 0) {
      const latestQa = hotQaStream[hotQaStream.length - 1]
      
      const key = `open${Date.now()}`
      notification.open({
        message: (
          <div className="flex items-center gap-2 text-indigo-500 font-bold font-sans">
            <FireOutlined className="text-red-500 animate-pulse"/> 实时热门提问
          </div>
        ),
        description: (
          <div 
            className="group cursor-pointer mt-1" 
            onClick={() => {
              notification.close(key)
              // 添加点击反馈动画
              gsap.to('.notification-click-feedback', {
                scale: 0.95,
                duration: 0.1,
                yoyo: true,
                repeat: 1,
                ease: 'power2.inOut'
              })
              // 跳转到独立阅读界面
              setTimeout(() => {
                navigate(`/qa/${latestQa.id}`)
              }, 200)
            }}
          >
            <div className={`font-semibold text-base transition-all duration-300 ${
              isDark 
                ? 'text-slate-200 group-hover:text-indigo-400 group-hover:translate-x-1' 
                : 'text-slate-800 group-hover:text-indigo-600 group-hover:translate-x-1'
            }`}>
              {latestQa.question}
            </div>
            <div className={`text-xs mt-1 flex items-center gap-1 transition-all duration-300 ${
              isDark 
                ? 'text-slate-400 group-hover:text-indigo-400 group-hover:translate-x-2' 
                : 'text-slate-500 group-hover:text-indigo-500 group-hover:translate-x-2'
            }`}>
              点击立即阅读答案 <ReadOutlined className="group-hover:scale-125 transition-transform" />
            </div>
          </div>
        ),
        key,
        placement: 'bottomRight',
        className: `notification-click-feedback ${isDark ? 'dark-glass-notification' : 'light-glass-notification'}`,
        duration: 8,
        icon: <FireOutlined style={{ color: '#ef4444' }} className="animate-pulse" />,
        style: isDark ? {
          backdropFilter: 'blur(16px)',
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        } : {
          backdropFilter: 'blur(16px)',
          background: 'rgba(255, 255, 255, 0.9)',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.05)',
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        },
        onClick: () => {
          notification.close(key)
          gsap.to('.notification-click-feedback', {
            scale: 0.95,
            duration: 0.1,
            yoyo: true,
            repeat: 1,
            ease: 'power2.inOut'
          })
          setTimeout(() => {
            navigate(`/qa/${latestQa.id}`)
          }, 200)
        }
      })
    }
  }, [hotQaStream?.length, isDark])

  // --- API 加载 ---
  const loadQaList = useCallback(async () => {
    try {
      const result = await getQaList({ current, pageSize, tag: selectedTag || undefined })
      // 确保所有ID都是字符串格式，避免精度丢失
      const normalizedRecords = (result.records || []).map(qa => ({
        ...qa,
        id: String(qa.id)
      }))
      setQaList(normalizedRecords)
      setTotal(result.total || 0)
    } catch (error) { console.error(error) }
  }, [current, pageSize, selectedTag])

  useEffect(() => { void loadQaList() }, [loadQaList])

  // --- Admin Session ---
  const syncAdminSession = useCallback(async () => {
    try {
      const hasSession = await fetchAdminSession()
      setIsAdmin(hasSession)
      return hasSession
    } catch { setIsAdmin(false); return false }
  }, [])

  useEffect(() => {
    void syncAdminSession()
    const handleFocus = () => void syncAdminSession()
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [syncAdminSession])

  // --- GSAP 动画 ---
  useLayoutEffect(() => {
    if (!headerRef.current) return
    
    const ctx = gsap.context(() => {
      const heroTexts = headerRef.current?.querySelectorAll('.hero-text')
      const tagBtns = headerRef.current?.querySelectorAll('.tag-btn')
      
      // 确保元素存在且设置初始状态
      if (heroTexts && heroTexts.length > 0) {
        gsap.fromTo(heroTexts, 
          { y: 60, opacity: 0 },
          { 
            y: 0, 
            opacity: 1, 
            duration: 1, 
            stagger: 0.1, 
            ease: 'power3.out',
            clearProps: 'y'
          }
        )
      }
      
      if (tagBtns && tagBtns.length > 0) {
        // 先设置初始状态
        gsap.set(tagBtns, { scale: 0, opacity: 0 })
        
        // 执行动画
        const tl = gsap.timeline({ delay: 0.5 })
        tl.to(tagBtns, {
          scale: 1,
          opacity: 1,
          duration: 0.5,
          stagger: 0.02,
          ease: 'back.out(1.5)',
          clearProps: 'scale',
          onComplete: () => {
            // 动画完成后确保所有元素可见
            tagBtns.forEach((btn) => {
              gsap.set(btn, { opacity: 1, scale: 1, clearProps: 'all' })
            })
          }
        })
        
        // 安全保护：如果动画在 2 秒内未完成，强制显示元素
        setTimeout(() => {
          tagBtns.forEach((btn) => {
            const computedStyle = window.getComputedStyle(btn)
            if (computedStyle.opacity === '0') {
              gsap.set(btn, { opacity: 1, scale: 1, clearProps: 'all' })
            }
          })
        }, 2000)
      }
    }, headerRef)
    
    return () => {
      // 清理时确保元素可见
      if (headerRef.current) {
        const tagBtns = headerRef.current.querySelectorAll('.tag-btn')
        tagBtns.forEach((btn) => {
          gsap.set(btn, { scale: 1, opacity: 1, clearProps: 'all' })
        })
      }
      ctx.revert()
    }
  }, [])

  useLayoutEffect(() => {
    const grid = gridRef.current
    if (!grid) return
    const cards = grid.querySelectorAll('.qa-card-item')
    if (cards.length === 0) return
    ScrollTrigger.batch(cards, {
      onEnter: (elements) => {
        gsap.fromTo(elements, 
          { y: 60, opacity: 0, scale: 0.9 },
          { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: 'power3.out', stagger: 0.08 }
        )
      },
      start: 'top 95%',
    })
    return () => ScrollTrigger.getAll().forEach(t => t.kill())
  }, [qaList])

  useEffect(() => {
    if (qaList.length === 0 && selectedQa) return
    if (qaList.length > 0 && !selectedQa) setSelectedQa(qaList[0])
    // 保持选中状态逻辑
    setSelectedQa((prev) => {
      if (!prev) return qaList[0]
      const exists = qaList.some(q => q.id === prev.id) || hotQaList.some(q => q.id === prev.id)
      return exists ? prev : qaList[0]
    })
  }, [qaList, hotQaList])

  // --- Event Handlers ---
  const handleTagChange = (tag: string) => {
    setSelectedTag(tag)
    setCurrent(1)
  }

  const handlePageChange = (page: number) => {
    setCurrent(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleAdminLogin = async () => {
    if (!adminPassword.trim()) return
    const isValid = await loginQaAdmin(adminPassword.trim())
    if (isValid) {
      await syncAdminSession()
      setAdminModalVisible(false)
      message.success('权限已解锁')
    } else { message.error('口令错误') }
  }

  const handleAction = async (action: 'delete' | 'edit' | 'add', id?: string) => {
    if (action === 'delete' && id) {
      Modal.confirm({
        title: '确认删除',
        content: '数据删除后不可恢复',
        okType: 'danger',
        onOk: async () => {
          await deleteAdminQa(id)
          message.success('已删除')
          loadQaList()
        }
      })
    } else if (action === 'edit' && id) {
      await ensureYuqueAssets()
      goToQaEdit(id)
    } else if (action === 'add') {
      await ensureYuqueAssets()
      goToQaEdit('new')
    }
  }

  const getAnswerPreview = (answer: string) => {
    const text = answer.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ')
    return text.length <= 80 ? text : text.substring(0, 80) + '...'
  }

  const handleQuickReview = (qa: QaInfo) => {
    const topic = encodeURIComponent(qa.question)
    const answerPlain = extractPlainText(qa.answer || '')
    const answer = encodeURIComponent(answerPlain)
    navigate(`/review?topic=${topic}&answer=${answer}`)
  }

  const mergedTags = useMemo(() => {
    const all = new Set<string>([...QA_TAGS])
    const data = [...qaList, ...hotQaList]
    data.forEach(i => i.tag && all.add(i.tag))
    return Array.from(all)
  }, [qaList, hotQaList])

  // 动态样式类
  const themeClass = isDark ? 'text-slate-100' : 'text-slate-800'
  const cardBg = isDark ? 'bg-slate-900/50 border-white/10 hover:border-indigo-500/50' : 'bg-white/60 border-indigo-100 hover:border-indigo-400 hover:shadow-indigo-100'
  const panelBg = isDark ? 'bg-slate-900/80 border-white/10' : 'bg-white/80 border-indigo-100 shadow-xl shadow-indigo-100/50'

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

      {/* 噪点纹理 (仅在暗黑模式下启用增强质感) */}
      {isDark && (
        <div className="fixed inset-0 z-[1] pointer-events-none opacity-[0.03] mix-blend-overlay" 
             style={{backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`}}>
        </div>
      )}

      {/* Admin Modal */}
      <Modal
        open={adminModalVisible}
        onCancel={() => setAdminModalVisible(false)}
        footer={null}
        centered
        width={400}
        className="admin-modal-custom"
        style={{
          padding: 0
        }}
      >
        <div className={`${isDark ? 'bg-slate-900 border-indigo-500/30' : 'bg-white border-indigo-100'} border rounded-2xl p-8 shadow-2xl backdrop-blur-md`}>
          <div className="text-center mb-6">
            <LockOutlined className="text-4xl text-indigo-500 mb-3" />
            <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Security Access</h3>
          </div>
          <Input.Password
            placeholder="请输入管理员口令"
            value={adminPassword}
            onChange={e => setAdminPassword(e.target.value)}
            onPressEnter={handleAdminLogin}
            autoFocus
            className={`h-12 rounded-lg mb-4 ${
              isDark 
                ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500' 
                : 'bg-white border-slate-200'
            }`}
            style={{ 
              pointerEvents: 'auto',
              zIndex: 1000
            }}
          />
          <Button 
            type="primary" 
            block 
            size="large" 
            onClick={handleAdminLogin} 
            className="bg-indigo-600 hover:bg-indigo-500 border-none h-10 font-bold"
          >
            解锁权限
          </Button>
        </div>
      </Modal>

      {/* 内容区域 */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 flex flex-col gap-12">
        
        {/* Header */}
        <header ref={headerRef} className="flex flex-col gap-8">
          <div className="flex justify-between items-start">
            <div className="space-y-4 max-w-2xl">
              <div className="hero-text inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 text-xs font-mono tracking-widest uppercase">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                Shane's Brain Network
              </div>
              <h1 className={`hero-text text-5xl md:text-6xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                QA Knowledge <span className="text-indigo-500">Base</span>
              </h1>
              <p className={`hero-text text-lg ${isDark ? 'text-slate-400' : 'text-slate-500'} font-light leading-relaxed`}>
                这是一个聚合了面试、技术栈、简历细节的数据中枢。支持 SSE 实时热点推送与 Markdown/Lake 渲染。
              </p>
            </div>
          </div>

          {/* 筛选与工具栏 */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-8 border-b border-indigo-500/10">
            {/* Tag Filter - 修复布局，标签从头开始往后布局 */}
            <div className="flex-1 w-full">
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1 shrink-0">
                  <AppstoreOutlined /> Filters
                </div>
                {/* "全部"按钮 */}
                <button
                  onClick={() => handleTagChange('')}
                  className={`tag-btn px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-300 shrink-0 ${
                    selectedTag === '' 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/40 scale-105' 
                      : `${isDark ? 'bg-slate-800 text-slate-400' : 'bg-white text-slate-500 border border-slate-200'} hover:scale-105`
                  }`}
                >
                  全部
                </button>
                {/* 标签列表 */}
                {mergedTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => handleTagChange(tag)}
                    className={`tag-btn px-3 py-1.5 rounded-lg text-sm transition-all duration-300 shrink-0 ${
                      selectedTag === tag 
                        ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 scale-105' 
                        : `${isDark ? 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-indigo-400' : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600'}`
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Admin Actions - 美化按钮 */}
            <div className="hero-text flex gap-3 shrink-0">
               <Button
                className={`flex items-center gap-2 h-11 px-5 rounded-xl border-0 font-medium transition-all ${
                  isAdmin 
                    ? 'bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20' 
                    : `${isDark ? 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`
                }`}
                icon={<LockOutlined />}
                onClick={() => isAdmin ? null : setAdminModalVisible(true)}
              >
                {isAdmin ? 'ADMIN UNLOCKED' : 'ADMIN LOGIN'}
              </Button>
              {isAdmin && (
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />} 
                  onClick={() => handleAction('add')} 
                  className="h-11 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 border-none shadow-lg shadow-indigo-500/30 font-bold tracking-wide hover:scale-105 transition-transform"
                >
                  NEW ENTRY
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* 列表 Grid */}
        <section ref={gridRef} className="min-h-[300px]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {qaList.length > 0 ? (
              qaList.map((qa) => {
                const isHot = qa.isHot === 1
                
                return (
                  <div
                    key={qa.id}
                    onClick={() => scrollToRead(qa)}
                    className={`qa-card-item group relative p-6 rounded-2xl backdrop-blur-sm cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl flex flex-col justify-between overflow-hidden border ${cardBg} ${selectedQa?.id === qa.id ? 'ring-2 ring-indigo-500' : ''}`}
                  >
                    {/* Hover Light Effect */}
                    <div className={`absolute -top-20 -right-20 w-40 h-40 rounded-full blur-[60px] transition-colors duration-500 opacity-0 group-hover:opacity-100 ${isDark ? 'bg-indigo-600/30' : 'bg-indigo-400/20'}`} />
                    
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium ${isDark ? 'bg-white/5 text-indigo-300' : 'bg-indigo-50 text-indigo-600'}`}>
                          {qa.tag}
                        </span>
                        {isHot && <Tooltip title="热门"><FireOutlined className="text-red-500 animate-pulse text-lg" /></Tooltip>}
                      </div>
                      
                      <h3 className={`text-lg font-bold mb-3 leading-snug group-hover:text-indigo-500 transition-colors line-clamp-2 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                        {qa.question}
                      </h3>
                      
                      <p className={`text-sm line-clamp-3 mb-4 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {getAnswerPreview(qa.answer)}
                      </p>
                    </div>

                    <div className={`relative z-10 flex items-center justify-between pt-4 border-t mt-2 ${isDark ? 'border-white/5' : 'border-indigo-50'}`}>
                      <span className="text-xs text-slate-500 font-mono">
                        {new Date(qa.createTime).toLocaleDateString()}
                      </span>
                      
                      <div className="flex items-center gap-2">
                        <Button 
                          type="text" 
                          size="small" 
                          icon={<ReadOutlined className="text-indigo-400" />} 
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/qa/${qa.id}`)
                          }}
                          className={`opacity-0 group-hover:opacity-100 transition-opacity ${
                            isDark 
                              ? 'hover:bg-indigo-500/20 text-indigo-300' 
                              : 'hover:bg-indigo-50 text-indigo-600'
                          }`}
                        />
                        <Tooltip title="检验复盘">
                          <Button
                            type="primary"
                            size="small"
                            icon={<Sparkles size={16} />}
                            onClick={(e) => { e.stopPropagation(); handleQuickReview(qa) }}
                            className="!flex !items-center !gap-2 !px-3 !py-2 !h-auto rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 border-none shadow-lg shadow-indigo-200/40 text-white font-semibold tracking-tight hover:opacity-90 hover:scale-[1.02] transition-all"
                          >
                            检验复盘
                          </Button>
                        </Tooltip>
                        {isAdmin && (
                          <>
                            <Button 
                              type="text" 
                              size="small" 
                              icon={<EditOutlined />} 
                              onClick={(e) => {e.stopPropagation(); handleAction('edit', qa.id)}} 
                              className={`${
                                isDark 
                                  ? 'text-sky-400 hover:bg-sky-500/20 hover:text-sky-300' 
                                  : 'text-sky-500 hover:bg-sky-50 hover:text-sky-600'
                              } transition-all`}
                            />
                            <Button 
                              type="text" 
                              size="small" 
                              icon={<CloseOutlined />} 
                              onClick={(e) => {e.stopPropagation(); handleAction('delete', qa.id)}} 
                              className={`${
                                isDark 
                                  ? 'text-rose-400 hover:bg-rose-500/20 hover:text-rose-300' 
                                  : 'text-rose-500 hover:bg-rose-50 hover:text-rose-600'
                              } transition-all`}
                            />
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="col-span-full py-24 flex flex-col items-center justify-center border-2 border-dashed border-slate-700/30 rounded-3xl bg-slate-500/5">
                <Empty description={<span className="text-slate-500">该分类下暂无数据</span>} />
              </div>
            )}
          </div>

          {total > 0 && (
            <div className="mt-12 flex justify-center">
              <Pagination
                current={current}
                pageSize={pageSize}
                total={total}
                onChange={handlePageChange}
                showSizeChanger={false}
                className={isDark ? "dark-pagination" : ""}
              />
            </div>
          )}
        </section>

        {/* 阅读终端面板 */}
        <section ref={answerPanelRef} className={`relative rounded-3xl overflow-hidden backdrop-blur-md transition-colors duration-500 border ${panelBg}`}>
          {/* Mac window header style */}
          <div className={`flex items-center px-6 py-4 border-b gap-3 ${isDark ? 'bg-slate-950/50 border-white/5' : 'bg-slate-50/80 border-indigo-100'}`}>
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
            </div>
            <div className="ml-4 text-xs font-mono text-slate-400 flex-1 text-center opacity-60">
              {selectedQa ? `READING_BUFFER :: ID_${selectedQa.id}` : 'SYSTEM_IDLE'}
            </div>
            <ReadOutlined className="text-slate-400" />
          </div>

          <div className="p-8 md:p-12 min-h-[400px]">
            {selectedQa ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className={`mb-8 pb-6 border-b space-y-4 ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full bg-indigo-600 text-white text-xs font-bold shadow-md shadow-indigo-500/30">
                      {selectedQa.tag}
                    </span>
                    <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                      <SearchOutlined /> VIEWS: {selectedQa.viewCount}
                    </span>
                  </div>
                  <h2 className={`text-3xl md:text-4xl font-bold leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {selectedQa.question}
                  </h2>
                </div>
                
                {/* 内容渲染区 - 适配日夜模式 */}
                <div 
                  className={`prose max-w-none 
                    ${isDark 
                      ? 'prose-invert prose-indigo prose-p:text-slate-300 prose-headings:text-indigo-100 prose-code:text-rose-300 prose-pre:bg-slate-950' 
                      : 'prose-slate prose-headings:text-indigo-900 prose-p:text-slate-600 prose-a:text-indigo-600 prose-pre:bg-slate-100'}`}
                  dangerouslySetInnerHTML={{ __html: convertAnswerToHtml(selectedQa.answer) }} 
                />

                <div className={`mt-10 flex flex-wrap items-center gap-4 pt-8 border-t ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
                   <Button 
                    type="default"
                    className={`qa-action-btn qa-action-btn-open ${isDark ? 'qa-action-btn-dark' : 'qa-action-btn-light'}`}
                    onClick={() => navigate(`/qa/${selectedQa.id}`)}
                  >
                    <ReadOutlined /> 打开独立页面
                  </Button>
                  {isAdmin && (
                    <Button 
                      type="primary"
                      className="qa-action-btn qa-action-btn-edit"
                      onClick={() => handleAction('edit', selectedQa.id)}
                    >
                      <EditOutlined /> 编辑文档
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center py-20 opacity-50">
                 <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 animate-pulse ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                    <SearchOutlined className="text-3xl text-slate-500" />
                 </div>
                 <p className="text-lg font-light">Select a card to view details...</p>
              </div>
            )}
          </div>
        </section>
      </div>
      
      {/* 样式覆盖 - 解决Antd与夜间模式的兼容性 */}
      <style>{`
        /* 分页器夜间模式 */
        .dark-pagination .ant-pagination-item a { color: #94a3b8 !important; }
        .dark-pagination .ant-pagination-item-active { background: #4f46e5 !important; border-color: #4f46e5 !important; }
        .dark-pagination .ant-pagination-item-active a { color: white !important; }
        .dark-pagination .ant-pagination-prev .ant-pagination-item-link, 
        .dark-pagination .ant-pagination-next .ant-pagination-item-link { 
          color: #64748b !important; 
          background: transparent !important;
          border-color: #334155 !important;
        }

        /* 滚动条美化 */
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        .bg-slate-950 ::-webkit-scrollbar-thumb { background: #334155; }
        .bg-slate-950 ::-webkit-scrollbar-thumb:hover { background: #475569; }

        /* 通知弹窗样式修正 */
        .ant-notification-notice-close { top: 16px !important; right: 16px !important; }
        .dark-glass-notification .ant-notification-notice-close { color: #94a3b8 !important; }
        
        /* 避免Antd按钮默认样式的干扰 */
        .ant-btn-primary { box-shadow: none !important; }

        /* 管理员模态框样式修复 */
        .admin-modal-custom .ant-modal-content {
          background: transparent !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .admin-modal-custom .ant-modal-body {
          padding: 0 !important;
        }
        .admin-modal-custom .ant-input-password,
        .admin-modal-custom .ant-input-password input {
          pointer-events: auto !important;
          z-index: 1000 !important;
        }
      `}</style>
    </div>
  )
}