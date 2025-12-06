import { 
  useEffect, 
  useState, 
  useRef, 
  useLayoutEffect
} from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Input, AutoComplete, message, Skeleton, Tooltip } from 'antd'
import { 
  SaveOutlined, 
  ArrowLeftOutlined, 
  ThunderboltFilled,
  ReloadOutlined,
  TagOutlined,
  EditOutlined,
  AudioOutlined,
  AudioFilled
} from '@ant-design/icons'
import {
  getAdminQaById,
  createAdminQa,
  updateAdminQa,
  fetchAdminSession,
} from '@/services/qaApi'
import { QA_TAGS } from '@/types/qa'
import { useTheme } from '@/providers/ThemeProvider'
import { Canvas, useFrame } from '@react-three/fiber'
import { Points, PointMaterial, Float, MeshDistortMaterial, Sphere } from '@react-three/drei'
import * as random from 'maath/random/dist/maath-random.esm'
import gsap from 'gsap'
import './QaEditPage.css' 

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
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

const EMPTY_LAKE_DOC = '{"ops":[{"insert":"\\n"}]}'

// --- 辅助函数：确保语雀编辑器脚本已加载 ---
const ensureYuqueAssets = (): Promise<void> => {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.Doc) return Promise.resolve()
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

// --- 辅助函数：封装 Lake 文档 ---
const wrapLakeDoc = (body: string): string => {
  if (!body) return ''
  const trimmed = body.trim()
  if (/<!doctype lake>/i.test(trimmed)) return trimmed
  const lakeHeader =
    '<!doctype lake><meta name="doc-version" content="1" /><meta name="viewport" content="adapt" /><meta name="typography" content="classic" /><meta name="paragraphSpacing" content="relax" />'
  return lakeHeader + trimmed
}

// --- 视觉组件：背景星空粒子 ---
function ParticleField({ isDark }: { isDark: boolean }) {
  const ref = useRef<any>()
  const [sphere] = useState(() => random.inSphere(new Float32Array(5000), { radius: 2 }))
  
  useFrame((_state, delta) => {
    if(ref.current) {
      ref.current.rotation.x -= delta / 15
      ref.current.rotation.y -= delta / 20
    }
  })

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color={isDark ? "#6366f1" : "#94a3b8"}
          size={0.003}
          sizeAttenuation={true}
          depthWrite={false}
          opacity={isDark ? 0.6 : 0.4}
        />
      </Points>
    </group>
  )
}

// --- 视觉组件：3D 声纹悬浮球 ---
interface VoiceOrbProps {
  isDark: boolean
  isRecording: boolean
  intensity: number // 模拟声纹强度 0 ~ 1
}

function VoiceInputOrb({ isDark, isRecording, intensity }: VoiceOrbProps) {
  const orbRef = useRef<any>()
  
  const smoothedIntensity = useRef(0)

  useFrame(() => {
    if (orbRef.current) {
      // 基础自转
      orbRef.current.rotation.y += 0.01

      // 平滑插值
      smoothedIntensity.current = gsap.utils.interpolate(
        smoothedIntensity.current, 
        isRecording ? intensity : 0, 
        0.1
      )

      // 1. 缩放效果：随音量变大
      const baseScale = 1.6
      const dynamicScale = baseScale + smoothedIntensity.current * 0.6
      orbRef.current.scale.setScalar(dynamicScale)

      // 2. 扭曲效果：随音量变得更剧烈
      if (orbRef.current.material) {
        const targetDistort = isRecording ? 0.5 + smoothedIntensity.current * 0.5 : 0.3
        const targetSpeed = isRecording ? 5 : 2
        
        orbRef.current.material.distort = gsap.utils.interpolate(
            orbRef.current.material.distort, 
            targetDistort, 
            0.1
        )
        orbRef.current.material.speed = targetSpeed
      }
    }
  })

  // 颜色配置
  const idleColor = isDark ? "#4f46e5" : "#6366f1" // 靛蓝
  const activeColor = isDark ? "#ef4444" : "#f87171" // 录音红

  return (
    // 注意：这里的 scale 已经在 useFrame 中动态设置
    <Sphere ref={orbRef} args={[1, 64, 64]} scale={1.6}> 
      <MeshDistortMaterial
        color={isRecording ? activeColor : idleColor}
        attach="material"
        distort={0.3}
        speed={2}
        roughness={0.2}
        metalness={0.8}
        emissive={isRecording ? activeColor : idleColor}
        emissiveIntensity={isRecording ? 0.8 : 0.4}
      />
    </Sphere>
  )
}

// --- 主页面组件 ---
export default function QaEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const isEdit = id !== 'new'
  
  // --- 状态管理 ---
  const [question, setQuestion] = useState('')
  const [tag, setTag] = useState<string>('')
  const [isHot, setIsHot] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // 编辑器状态
  const [editorReady, setEditorReady] = useState(false)
  const [initialAnswer, setInitialAnswer] = useState('')
  const [editorError, setEditorError] = useState<string | null>(null)
  const [editorLoading, setEditorLoading] = useState(true)
  
  // 语音输入状态
  const [isRecording, setIsRecording] = useState(false)
  const [audioIntensity, setAudioIntensity] = useState(0) 

  // Refs
  const editorRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const editorInstanceRef = useRef<any>(null)
  const recognitionRef = useRef<any>(null)
  const audioIntervalRef = useRef<any>(null)

  // --- 权限校验、加载数据、初始化编辑器、GSAP动画... (逻辑保持不变) ---

  // --- 权限校验 ---
  useEffect(() => {
    fetchAdminSession().then(has => {
      if (!has) {
        message.warning('需要管理员权限')
        navigate('/qa')
      }
    })
  }, [navigate])

  // --- 加载数据 ---
  useEffect(() => {
    if (!isEdit || !id) return
    const load = async () => {
      setLoading(true)
      try {
        const data = await getAdminQaById(id)
        setQuestion(data.question)
        setTag(data.tag)
        setIsHot(data.isHot === 1)
        setInitialAnswer(data.answer || '')
      } catch {
        message.error('数据加载失败')
        navigate('/qa')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, isEdit, navigate])

  // --- 初始化语雀编辑器 ---
  useEffect(() => {
    let retryCount = 0
    const maxRetries = 10
    const retryDelay = 500

    const initEditor = async () => {
      try {
        // 1. 先确保脚本已加载
        await ensureYuqueAssets()
        
        // 2. 等待 window.Doc 可用（有时脚本加载完成但对象还未挂载）
        let waitCount = 0
        while (!window.Doc && waitCount < 20) {
          await new Promise(resolve => setTimeout(resolve, 100))
          waitCount++
        }

        // 3. 初始化编辑器
        if (editorRef.current && window.Doc && window.Doc.createOpenEditor) {
          editorInstanceRef.current = window.Doc.createOpenEditor(editorRef.current, {
            input: {},
            image: { isCaptureImageURL: () => false },
          })
          setEditorReady(true)
          setEditorError(null)
        } else {
          throw new Error('编辑器初始化失败：window.Doc 不可用')
        }
      } catch (error) {
        console.error('初始化编辑器失败:', error)
        setEditorError(error instanceof Error ? error.message : '编辑器初始化失败')
        
        // 重试机制
        if (retryCount < maxRetries) {
          retryCount++
          setTimeout(initEditor, retryDelay * retryCount)
        } else {
          setEditorError('编辑器加载失败，请刷新页面重试')
        }
      }
    }
    
    initEditor()
    return () => { 
      editorInstanceRef.current = null 
    }
  }, [])

  // --- 加载内容到编辑器 ---
  useEffect(() => {
    if (!editorReady || !editorInstanceRef.current) return
    const content = isEdit && initialAnswer ? initialAnswer : EMPTY_LAKE_DOC
    
    const loadContent = () => {
        try {
            if (!isEdit) editorInstanceRef.current.setDocument('text/html', '<p><br/></p>')
            else editorInstanceRef.current.setDocument('lake', content)
            setEditorError(null)
            setEditorLoading(false)
        } catch (e) {
            setTimeout(loadContent, 1000)
        }
    }
    loadContent()
  }, [editorReady, initialAnswer, isEdit])

  // --- GSAP 入场动画 ---
  useLayoutEffect(() => {
    if (loading) return
    const ctx = gsap.context(() => {
      gsap.fromTo('.anim-entry', 
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'power3.out' }
      )
    }, containerRef)
    return () => ctx.revert()
  }, [loading])


  // --- 语音输入逻辑 ---
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognition.continuous = true 
    recognition.interimResults = true 
    recognition.lang = 'zh-CN' 

    recognition.onstart = () => {
        setIsRecording(true)
        message.info('开始语音录入...')
        // 模拟声波跳动 
        audioIntervalRef.current = setInterval(() => {
            setAudioIntensity(Math.random())
        }, 150)
    }

    recognition.onend = () => {
        setIsRecording(false)
        setAudioIntensity(0)
        if (audioIntervalRef.current) clearInterval(audioIntervalRef.current)
    }

    recognition.onerror = (e: any) => {
        console.error('语音识别错误:', e)
        setIsRecording(false)
        setAudioIntensity(0)
        if (audioIntervalRef.current) clearInterval(audioIntervalRef.current)
    }

    recognition.onresult = (event: any) => {
        let finalTranscript = ''
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript
            }
        }
        if (finalTranscript) {
            setQuestion(prev => prev + finalTranscript)
        }
    }

    recognitionRef.current = recognition

    return () => {
        if (recognitionRef.current) recognitionRef.current.stop()
        if (audioIntervalRef.current) clearInterval(audioIntervalRef.current)
    }
  }, [])

  const toggleRecording = () => {
      if (!recognitionRef.current) {
          message.warning('当前浏览器不支持语音识别')
          return
      }
      if (isRecording) {
          recognitionRef.current.stop()
      } else {
          recognitionRef.current.start()
      }
  }

  // --- 保存逻辑 ---
  const handleSave = async () => {
    if (!question.trim()) return message.warning('请输入问题标题')
    if (!tag) return message.warning('请选择一个标签')
    
    setSaving(true)
    try {
      const rawAnswer = editorInstanceRef.current?.getDocument('lake')
      const answer = wrapLakeDoc(rawAnswer)
      const payload = { question, answer, tag, isHot: isHot ? 1 : 0 }
      
      if (isEdit && id) await updateAdminQa(id, { id, ...payload })
      else await createAdminQa(payload)
      
      message.success('保存成功')
      navigate('/qa')
    } catch {
      message.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  // --- 样式定义 ---
  const themeClass = isDark ? 'text-slate-100' : 'text-slate-800'
  const inputBg = isDark ? 'bg-transparent text-white placeholder:text-slate-600' : 'bg-transparent text-slate-800 placeholder:text-slate-300'
  const glassPanel = isDark 
    ? 'bg-slate-900/60 border-slate-700/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)]' 
    : 'bg-white/70 border-white/60 shadow-[0_8px_32px_0_rgba(31,38,135,0.15)]'

  // 统一的按钮样式 
  const buttonBaseClass = `h-11 px-6 rounded-xl border font-medium transition-all duration-300 flex items-center gap-2 shadow-sm`
  const defaultBtnClass = isDark 
    ? `${buttonBaseClass} bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white hover:border-slate-600`
    : `${buttonBaseClass} bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200`
  const primaryBtnClass = `${buttonBaseClass} bg-gradient-to-r from-indigo-600 to-purple-600 border-none text-white shadow-lg shadow-indigo-500/30 hover:scale-105 hover:shadow-indigo-500/50`


  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500 font-mono">LOADING DATA STREAM...</div>

  return (
    <div className={`relative min-h-screen transition-colors duration-700 ${isDark ? 'bg-slate-950' : 'bg-slate-50'} ${themeClass} overflow-x-hidden selection:bg-indigo-500 selection:text-white`}>
      
      {/* Layer 0: 背景星空 */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Canvas camera={{ position: [0, 0, 1] }}>
          <Float speed={2} rotationIntensity={1} floatIntensity={1}>
            <ParticleField isDark={isDark} />
          </Float>
        </Canvas>
      </div>

      {/* Layer 1: 内容区域 */}
      <div ref={containerRef} className="relative z-10 w-full max-w-5xl mx-auto px-6 py-8 md:py-12 flex flex-col h-full min-h-screen">
        
        {/* Header Bar */}
        <header className="anim-entry flex justify-between items-center mb-10">
          <button
            onClick={() => navigate('/qa')}
            className={defaultBtnClass}
          >
            <ArrowLeftOutlined /> 返回列表
          </button>

          <div className="flex gap-4">
            <button 
                onClick={() => window.location.reload()}
                className={defaultBtnClass}
            >
                <ReloadOutlined /> 刷新
            </button>
            <button
                onClick={handleSave}
                disabled={saving}
                className={primaryBtnClass}
            >
                {saving ? '保存中...' : <><SaveOutlined /> 保存内容</>}
            </button>
          </div>
        </header>

        {/* 主编辑面板 */}
        <div className={`anim-entry flex-1 backdrop-blur-xl rounded-3xl border p-8 md:p-12 flex flex-col gap-10 ${glassPanel}`}>
          
          {/* 1. 标题输入区 - 恢复H1风格 */}
          <div className="relative">
            <span className="text-[10px] font-mono tracking-[0.2em] text-indigo-500/80 uppercase block mb-2">
                Question Headline
            </span>
            {/* 使用原生 textarea 替换 Antd Input.TextArea，以获得更自由的 H1 样式控制 */}
            <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="在此输入问题标题..."
                maxLength={200}
                rows={1}
                className={`w-full text-3xl md:text-5xl font-bold border-none px-0 shadow-none resize-none focus:outline-none overflow-hidden ${inputBg} h1-textarea-style`}
            />
          </div>

          {/* 分隔线 */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-500/20 to-transparent" />

          {/* 2. 属性控制区 (Meta) - 保持大间距 */}
          <div className="flex flex-col md:flex-row md:items-start gap-10">
            
            {/* 标签选择 */}
            <div className="flex-1 min-w-[200px]">
                <label className="text-[10px] font-mono tracking-wider text-slate-500 uppercase block mb-3">
                    <TagOutlined className="mr-1" /> Classification Tag
                </label>
                <AutoComplete
                    value={tag}
                    onChange={setTag}
                    placeholder="选择或输入标签"
                    options={QA_TAGS.map((t) => ({ value: t }))}
                    filterOption={(inputValue, option) => (option?.value ?? '').toLowerCase().includes(inputValue.toLowerCase())}
                    className={`w-full ${isDark ? 'custom-dark-autocomplete' : ''}`}
                    bordered={false}
                >
                    <Input 
                        className={`pl-0 shadow-none text-xl font-medium ${isDark ? 'text-slate-200 placeholder:text-slate-600' : 'text-slate-700'}`} 
                    />
                </AutoComplete>
            </div>

            {/* 热门开关 */}
            <div className="pt-2">
                <Tooltip title="开启后将进入每日SSE推送队列">
                    <div 
                        onClick={() => setIsHot(!isHot)}
                        className={`cursor-pointer group flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all duration-300 ${
                            isHot 
                            ? 'bg-orange-500/10 border-orange-500/30' 
                            : isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white/50 border-slate-200'
                        }`}
                    >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isHot ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/40' : 'bg-slate-500/20 text-slate-400'}`}>
                            <ThunderboltFilled className={isHot ? "animate-pulse" : ""} />
                        </div>
                        <div>
                            <div className={`font-bold ${isHot ? 'text-orange-500' : 'text-slate-500 group-hover:text-slate-400'}`}>
                                每日推荐
                            </div>
                            <div className="text-xs text-slate-500 opacity-60">
                                {isHot ? 'Status: Active' : 'Status: Inactive'}
                            </div>
                        </div>
                    </div>
                </Tooltip>
            </div>
          </div>

          {/* 3. 正文编辑器 */}
          <div className="flex-1 flex flex-col min-h-[500px] relative mt-4">
            <div className="flex items-center justify-between mb-4">
                 <span className="text-[10px] font-mono tracking-[0.2em] text-slate-400 uppercase flex items-center gap-2">
                    <EditOutlined /> Content Body
                 </span>
            </div>
            
            {editorLoading && <Skeleton active paragraph={{ rows: 8 }} className="opacity-50" />}
            
            <div
                ref={editorRef}
                className={`ne-doc-major-editor flex-1 rounded-xl transition-opacity duration-500 ${editorLoading ? 'opacity-0' : 'opacity-100'} ${isDark ? 'dark-editor-override' : ''}`}
            />

            {editorError && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm rounded-xl">
                    <div className="text-rose-400 font-mono bg-rose-900/20 border border-rose-500/30 px-6 py-4 rounded-lg">
                        ⚠ {editorError}
                    </div>
                </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. 语音悬浮球 (Fixed) - 修复截断问题：增加 w/h 和 Canvas 大小 */}
      <Tooltip placement="left" title={isRecording ? "正在聆听...点击停止" : "点击开始语音输入标题"}>
        <div 
            onClick={toggleRecording}
            // 增加尺寸 w-28 h-28，避免被截断
            className={`fixed bottom-12 right-12 z-50 w-28 h-28 cursor-pointer transition-transform duration-300 ${isRecording ? 'scale-110' : 'hover:scale-105'}`}
        >
            {/* Canvas 3D 层: 覆盖整个父容器 */}
            <div className="absolute inset-0 z-0 rounded-full overflow-hidden">
                <Canvas camera={{ position: [0, 0, 3] }}>
                    <ambientLight intensity={0.8} />
                    <pointLight position={[10, 10, 10]} intensity={1.5} />
                    <VoiceInputOrb 
                        isDark={isDark} 
                        isRecording={isRecording} 
                        intensity={audioIntensity} 
                    />
                </Canvas>
            </div>
            
            {/* 图标层 */}
            <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                {isRecording ? (
                    <AudioFilled className="text-4xl text-white animate-pulse drop-shadow-lg" />
                ) : (
                    <AudioOutlined className={`text-3xl transition-colors ${isDark ? 'text-indigo-200' : 'text-white'}`} />
                )}
            </div>
        </div>
      </Tooltip>

      {/* CSS 注入 */}
      <style>{`
        /* 1. 标题输入框样式重置 */
        .h1-textarea-style {
            /* 确保背景透明，并且文字颜色继承父容器 */
            background-color: transparent !important;
            padding: 0 !important;
            /* 确保 text-5xl 的高度能够容纳一行，并实现自适应 */
            min-height: 1.5em; 
            line-height: 1.5;
            box-sizing: border-box;
        }

        /* 自动调整 textarea 高度，使其看起来像单行输入框 */
        .h1-textarea-style {
            /* 以下是实现 textarea 自适应高度的常见 JS 替代方案 */
        }

        /* 2. 其他样式 */
        .custom-dark-autocomplete .ant-select-selector {
            background-color: transparent !important;
            box-shadow: none !important;
        }
        
        ${isDark ? `
            .ne-doc-major-editor { color: #e2e8f0; } 
            .ne-doc-major-editor h1, .ne-doc-major-editor h2, .ne-doc-major-editor h3 { color: #f8fafc; }
        ` : ''}

        textarea:focus, input:focus {
            box-shadow: none !important;
        }
      `}</style>
    </div>
  )
}