import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, Input, AutoComplete, Checkbox, message, Card, Skeleton } from 'antd'
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import {
  getAdminQaById,
  createAdminQa,
  updateAdminQa,
  fetchAdminSession,
} from '@/services/qaApi'
import { QA_TAGS } from '@/types/qa'
import './QaEditPage.css'

declare global {
  interface Window {
    Doc: {
      createOpenEditor?: (
        element: HTMLElement,
        options?: Record<string, unknown>
      ) => {
        setDocument: (format: string, content: string) => void
        getDocument: (format: string) => string
        on: (event: string, callback: () => void) => void
      }
      createOpenViewer?: (
        element: HTMLElement,
        options?: Record<string, unknown>
      ) => {
        setDocument: (format: string, content: string) => void
        destroy?: () => void
      }
    }
  }
}

const EMPTY_LAKE_DOC = '{"ops":[{"insert":"\\n"}]}'

// 将正文内容包装成完整的 Lake 文档：
// - 如果已经包含 <!doctype lake>，则直接返回不再重复添加
// - 否则自动加上官方示例中的 meta 头部
const wrapLakeDoc = (body: string): string => {
  if (!body) return ''
  const trimmed = body.trim()
  if (/<!doctype lake>/i.test(trimmed)) {
    return trimmed
  }
  const lakeHeader =
    '<!doctype lake>' +
    '<meta name="doc-version" content="1" />' +
    '<meta name="viewport" content="adapt" />' +
    '<meta name="typography" content="classic" />' +
    '<meta name="paragraphSpacing" content="relax" />'
  return lakeHeader + trimmed
}

export default function QaEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = id !== 'new'
  
  const [question, setQuestion] = useState('')
  const [tag, setTag] = useState<string>('')
  const [isHot, setIsHot] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editorReady, setEditorReady] = useState(false)
  const [initialAnswer, setInitialAnswer] = useState('')
  const [editorError, setEditorError] = useState<string | null>(null)
  const [editorLoading, setEditorLoading] = useState(true)
  const editorErrorTimerRef = useRef<number | null>(null)
  
  const editorRef = useRef<HTMLDivElement>(null)
  const editorInstanceRef = useRef<{
    setDocument: (format: string, content: string) => void
    getDocument: (format: string) => string
  } | null>(null)

  // 检查管理员权限
  useEffect(() => {
    const ensureAdmin = async () => {
      try {
        const hasSession = await fetchAdminSession()
        if (!hasSession) {
          message.warning('需要管理员权限')
          navigate('/qa')
          return
        }
      } catch (error) {
        console.error('校验管理员权限失败:', error)
        message.error('校验管理员权限失败')
        navigate('/qa')
      }
    }
    ensureAdmin()
  }, [navigate])

  // 加载QA数据（编辑模式）
  useEffect(() => {
    const loadQaData = async () => {
      if (!isEdit || !id) return
      try {
        setLoading(true)
        const data = await getAdminQaById(id)
        setQuestion(data.question)
        setTag(data.tag)
        setIsHot(data.isHot === 1)
        setInitialAnswer(data.answer || '')
      } catch (error) {
        console.error('加载QA数据失败:', error)
        message.error('加载QA数据失败')
        navigate('/qa')
      } finally {
        setLoading(false)
      }
    }
    loadQaData()
  }, [id, isEdit, navigate])

  // 初始化语雀编辑器
  useEffect(() => {
    const loadYuqueEditor = () => {
      return new Promise<void>((resolve, reject) => {
        if (window.Doc) {
          resolve()
          return
        }

        // 加载本地静态资源（不再依赖外网 CDN）
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
            docScript.onerror = () => reject(new Error('加载语雀编辑器失败'))
            document.body.appendChild(docScript)
          }
          reactDomScript.onerror = () => reject(new Error('加载ReactDOM失败'))
          document.body.appendChild(reactDomScript)
        }
        reactScript.onerror = () => reject(new Error('加载React失败'))
        document.body.appendChild(reactScript)
      })
    }

    if (editorRef.current && !editorInstanceRef.current) {
      loadYuqueEditor()
        .then(() => {
          if (editorRef.current && window.Doc && window.Doc.createOpenEditor) {
            const editor = window.Doc.createOpenEditor(editorRef.current, {
              input: {},
              image: {
                isCaptureImageURL() {
                  return false
                },
              },
            })
            editorInstanceRef.current = editor
            setEditorReady(true)
          }
        })
        .catch((error) => {
          console.error('初始化语雀编辑器失败:', error)
          message.error('初始化编辑器失败')
        })
    }

    return () => {
      if (editorInstanceRef.current) {
        editorInstanceRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!editorReady || !editorInstanceRef.current) {
      return
    }
    const editor = editorInstanceRef.current
    const normalizedAnswer = initialAnswer?.trim()
    const contentToLoad = isEdit && normalizedAnswer ? normalizedAnswer : EMPTY_LAKE_DOC

    let cancelled = false
    let attempts = 0
    const MAX_RETRY = 4

    // 如果之前有错误提示的定时器，这里清掉
    if (editorErrorTimerRef.current) {
      window.clearTimeout(editorErrorTimerRef.current)
      editorErrorTimerRef.current = null
    }

    // 新建模式：直接给一个空白文档，避免看到原始 JSON 字符串
    if (!isEdit) {
      setEditorLoading(true)
      try {
        // 这里用空的 HTML 段落，让编辑器区域看起来是完全空白的
        editor.setDocument('text/html', '<p><br/></p>')
        setEditorError(null)
      } catch (error) {
        console.error('初始化空白文档失败:', error)
      } finally {
        setEditorLoading(false)
      }
      return
    }

    const tryLoad = () => {
      if (cancelled) return
      setEditorLoading(true)
      try {
        // 统一使用 Lake 原生格式，contentToLoad 可以是正文或完整 <!doctype lake> 文档
        editor.setDocument('lake', contentToLoad)
        setEditorError(null)
        setEditorLoading(false)
      } catch (error) {
        console.error('加载 Lake 文档失败，第', attempts + 1, '次:', error)
        attempts += 1
        if (attempts < MAX_RETRY) {
          // 无感重试，1 秒后再试一次
          window.setTimeout(tryLoad, 1000)
        } else {
          setEditorLoading(false)
          editorErrorTimerRef.current = window.setTimeout(() => {
            setEditorError('这条 QA 的内容暂时没能正常加载，您可以稍等片刻或重新编辑后保存。')
          }, 800)
        }
      }
    }

    tryLoad()

    return () => {
      cancelled = true
    }
  }, [editorReady, initialAnswer, isEdit])

  // 组件卸载时清理错误提示定时器
  useEffect(() => {
    return () => {
      if (editorErrorTimerRef.current) {
        window.clearTimeout(editorErrorTimerRef.current)
      }
    }
  }, [])

  // 保存QA
  const handleSave = async () => {
    if (!question.trim()) {
      message.warning('请输入问题标题')
      return
    }
    if (!tag) {
      message.warning('请选择标签')
      return
    }
    if (!editorInstanceRef.current) {
      message.warning('编辑器未就绪')
      return
    }

    try {
      setSaving(true)
      // 从编辑器获取 Lake 文档内容（正文部分或完整文档）
      const rawAnswer = editorInstanceRef.current.getDocument('lake')
      const answer = wrapLakeDoc(rawAnswer)
      
      if (!answer || answer.trim() === '' || answer === '<p></p>') {
        message.warning('请输入答案内容')
        return
      }

      if (isEdit && id) {
        // 更新
        await updateAdminQa(id, {
          id,
          question,
          answer,
          tag,
          isHot: isHot ? 1 : 0,
        })
        message.success('更新成功')
      } else {
        // 新增
        await createAdminQa({
          question,
          answer,
          tag,
          isHot: isHot ? 1 : 0,
        })
        message.success('添加成功')
      }
      
      navigate('/qa')
    } catch (error) {
      console.error('保存失败:', error)
      message.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="qa-edit-loading">加载中...</div>
  }

  return (
    <div className="qa-edit-page">
      <div className="qa-edit-container">
        <div className="qa-edit-header">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/qa')}
            className="qa-edit-button ghost"
          >
            返回
          </Button>
          <h2>{isEdit ? '编辑QA' : '添加QA'}</h2>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
            loading={saving}
            className="qa-edit-button primary"
          >
            保存
          </Button>
        </div>

        <Card className="qa-edit-form">
          <div className="qa-edit-form-item">
            <label>问题标题：</label>
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="请输入问题标题"
              maxLength={500}
            />
          </div>

          <div className="qa-edit-form-item">
            <label>标签：</label>
            <AutoComplete
              value={tag}
              onChange={(value) => setTag(value)}
              placeholder="请选择或输入自定义标签"
              style={{ width: '100%' }}
              options={QA_TAGS.map((t) => ({ value: t }))}
              filterOption={(inputValue, option) =>
                (option?.value ?? '').toLowerCase().includes(inputValue.toLowerCase())
              }
            />
            <p className="qa-edit-helper-text">
              可直接输入新标签，也可以选择推荐标签，系统会保存为单个文本字段。
            </p>
          </div>

          <div className="qa-edit-form-item">
            <Checkbox
              className="qa-edit-hot-checkbox"
              checked={isHot}
              onChange={(e) => setIsHot(e.target.checked)}
            >
              标记为精选（用于每日推荐）
            </Checkbox>
          </div>

          <div className="qa-edit-form-item">
            <div className="qa-edit-label-row">
              <label>答案内容：</label>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="qa-edit-refresh-fancy-button"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 36 36"
                  width="22"
                  height="22"
                >
                  <rect width={36} height={36} x={0} y={0} fill="#fdd835" />
                  <path
                    fill="#e53935"
                    d="M38.67,42H11.52C11.27,40.62,11,38.57,11,36c0-5,0-11,0-11s1.44-7.39,3.22-9.59 c1.67-2.06,2.76-3.48,6.78-4.41c3-0.7,7.13-0.23,9,1c2.15,1.42,3.37,6.67,3.81,11.29c1.49-0.3,5.21,0.2,5.5,1.28 C40.89,30.29,39.48,38.31,38.67,42z"
                  />
                  <path
                    fill="#b71c1c"
                    d="M39.02,42H11.99c-0.22-2.67-0.48-7.05-0.49-12.72c0.83,4.18,1.63,9.59,6.98,9.79 c3.48,0.12,8.27,0.55,9.83-2.45c1.57-3,3.72-8.95,3.51-15.62c-0.19-5.84-1.75-8.2-2.13-8.7c0.59,0.66,3.74,4.49,4.01,11.7 c0.03,0.83,0.06,1.72,0.08,2.66c4.21-0.15,5.93,1.5,6.07,2.35C40.68,33.85,39.8,38.9,39.02,42z"
                  />
                  <path
                    fill="#212121"
                    d="M35,27.17c0,3.67-0.28,11.2-0.42,14.83h-2C32.72,38.42,33,30.83,33,27.17 c0-5.54-1.46-12.65-3.55-14.02c-1.65-1.08-5.49-1.48-8.23-0.85c-3.62,0.83-4.57,1.99-6.14,3.92L15,16.32 c-1.31,1.6-2.59,6.92-3,8.96v10.8c0,2.58,0.28,4.61,0.54,5.92H10.5c-0.25-1.41-0.5-3.42-0.5-5.92l0.02-11.09 c0.15-0.77,1.55-7.63,3.43-9.94l0.08-0.09c1.65-2.03,2.96-3.63,7.25-4.61c3.28-0.76,7.67-0.25,9.77,1.13 C33.79,13.6,35,22.23,35,27.17z"
                  />
                  <path
                    fill="#01579b"
                    d="M17.165,17.283c5.217-0.055,9.391,0.283,9,6.011c-0.391,5.728-8.478,5.533-9.391,5.337 c-0.913-0.196-7.826-0.043-7.696-5.337C9.209,18,13.645,17.32,17.165,17.283z"
                  />
                  <path
                    fill="#212121"
                    d="M40.739,37.38c-0.28,1.99-0.69,3.53-1.22,4.62h-2.43c0.25-0.19,1.13-1.11,1.67-4.9 c0.57-4-0.23-11.79-0.93-12.78c-0.4-0.4-2.63-0.8-4.37-0.89l0.1-1.99c1.04,0.05,4.53,0.31,5.71,1.49 C40.689,24.36,41.289,33.53,40.739,37.38z"
                  />
                  <path
                    fill="#81d4fa"
                    d="M10.154,20.201c0.261,2.059-0.196,3.351,2.543,3.546s8.076,1.022,9.402-0.554 c1.326-1.576,1.75-4.365-0.891-5.267C19.336,17.287,12.959,16.251,10.154,20.201z"
                  />
                  <path
                    fill="#212121"
                    d="M17.615,29.677c-0.502,0-0.873-0.03-1.052-0.069c-0.086-0.019-0.236-0.035-0.434-0.06 c-5.344-0.679-8.053-2.784-8.052-6.255c0.001-2.698,1.17-7.238,8.986-7.32l0.181-0.002c3.444-0.038,6.414-0.068,8.272,1.818 c1.173,1.191,1.712,3,1.647,5.53c-0.044,1.688-0.785,3.147-2.144,4.217C22.785,29.296,19.388,29.677,17.615,29.677z M17.086,17.973 c-7.006,0.074-7.008,4.023-7.008,5.321c-0.001,3.109,3.598,3.926,6.305,4.27c0.273,0.035,0.48,0.063,0.601,0.089 c0.563,0.101,4.68,0.035,6.855-1.732c0.865-0.702,1.299-1.57,1.326-2.653c0.051-1.958-0.301-3.291-1.073-4.075 c-1.262-1.281-3.834-1.255-6.825-1.222L17.086,17.973z"
                  />
                  <path
                    fill="#e1f5fe"
                    d="M15.078,19.043c1.957-0.326,5.122-0.529,4.435,1.304c-0.489,1.304-7.185,2.185-7.185,0.652 C12.328,19.467,15.078,19.043,15.078,19.043z"
                  />
                </svg>
                <span className="qa-edit-refresh-now">now!</span>
                <span className="qa-edit-refresh-play">点击刷新～</span>
              </button>
            </div>
            {editorLoading && (
              <Skeleton
                active
                paragraph={{ rows: 6 }}
                className="qa-edit-editor-skeleton"
              />
            )}
            <div
              ref={editorRef}
              className="ne-doc-major-editor"
              style={{ minHeight: '400px', display: editorLoading ? 'none' : 'block' }}
            />
          </div>
        </Card>
        {!editorLoading && editorError && (
          <div className="qa-edit-error-banner">
            {editorError}
          </div>
        )}
      </div>
    </div>
  )
}

