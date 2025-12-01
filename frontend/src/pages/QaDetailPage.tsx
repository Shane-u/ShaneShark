import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, Spin, message } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { getQaById } from '@/services/qaApi'
import type { QaInfo } from '@/types/qa'
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

export default function QaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [qaInfo, setQaInfo] = useState<QaInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewerError, setViewerError] = useState<string | null>(null)
  const viewerRef = useRef<HTMLDivElement>(null)
  const viewerInstanceRef = useRef<{
    setDocument: (format: string, content: string) => void
    destroy?: () => void
  } | null>(null)
  const viewerReadyRef = useRef(false)

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

  if (loading) {
    return (
      <div className="qa-detail-loading">
        <Spin size="large" />
      </div>
    )
  }

  if (!qaInfo) {
    return null
  }

  return (
    <div className="qa-detail-page">
      <div className="qa-detail-container">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/qa')}
          style={{ marginBottom: 24 }}
        >
          返回列表
        </Button>

        <div className="qa-detail-header">
          <div className="qa-detail-tag">{qaInfo.tag}</div>
          {qaInfo.isHot === 1 && <span className="qa-hot-badge">🔥 推荐</span>}
        </div>

        <h1 className="qa-detail-question">{qaInfo.question}</h1>

        <div className="qa-detail-meta">
          <span>浏览量: {qaInfo.viewCount}</span>
          <span>发布时间: {new Date(qaInfo.createTime).toLocaleString()}</span>
        </div>

        <div className="qa-detail-content">
          <div ref={viewerRef} className="ne-doc-major-viewer" />
          {viewerError && (
            <div className="qa-detail-error-banner">{viewerError}</div>
          )}
        </div>
      </div>
    </div>
  )
}


