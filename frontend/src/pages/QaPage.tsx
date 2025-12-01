import { useState, useEffect, useRef, useLayoutEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pagination, Button, Modal, Input, message, Tag, Empty } from 'antd'
import { PlusOutlined, FireOutlined, LockOutlined, ReadOutlined, EditOutlined } from '@ant-design/icons'
import { getQaList, deleteAdminQa, loginQaAdmin, fetchAdminSession } from '@/services/qaApi'
import type { QaInfo } from '@/types/qa'
import { QA_TAGS } from '@/types/qa'
import { useSse } from '@/hooks/useSse'
import { FlickeringGrid } from '@/components/ui/flickering-grid'
import { QaTagFilter } from '@/components/qa/QaTagFilter'
import { QaCard } from '@/components/qa/QaCard'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './QaPage.css'

// 注册GSAP插件
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

// 预加载语雀 Lake 文档的静态资源，在进入编辑 / 详情页之前提前准备好
const ensureYuqueAssets = (): Promise<void> => {
  if (typeof window === 'undefined') return Promise.resolve()
  if ((window as unknown as { Doc?: unknown }).Doc) return Promise.resolve()
  const globalAny = window as unknown as { __yuqueAssetsPromise__?: Promise<void> }
  if (globalAny.__yuqueAssetsPromise__) return globalAny.__yuqueAssetsPromise__

  globalAny.__yuqueAssetsPromise__ = new Promise<void>((resolve, reject) => {
    // 与编辑页 / 详情页保持一致的本地资源路径
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

// 在 HashRouter 环境下跳转到 QA 编辑页，兼容本地和 GitHub Pages 等子路径部署
const goToQaEdit = (id: string) => {
  const { origin, pathname } = window.location
  const base = `${origin}${pathname.replace(/\/$/, '')}`
  window.location.href = `${base}#/qa/edit/${id}`
}

const convertAnswerToHtml = (content: string) => {
  if (!content) return '<p>暂时没有答案内容。</p>'

  const trimmed = content.trim()
  if (!trimmed) return '<p>暂时没有答案内容。</p>'

  // Yuque Lake 文档是 JSON 字符串，尝试解析成基础段落
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed)
      const blocks = parsed?.blocks || parsed?.body || parsed?.nodes || []

      const renderNode = (node: unknown): string => {
        if (!node) return ''
        if (Array.isArray(node)) {
          return node.map((child) => renderNode(child)).join('')
        }
        if (typeof node === 'string') return node

        const anyNode = node as {
          text?: string
          children?: unknown
          body?: unknown
          content?: unknown
          type?: string
          name?: string
          props?: { level?: number }
        }

        if (anyNode.text) return anyNode.text

        const childrenHtml = renderNode(
          anyNode.children || anyNode.body || anyNode.content
        )
        const type = anyNode.type || anyNode.name

        if (!type) return childrenHtml

        const tagMap: Record<string, string> = {
          paragraph: 'p',
          heading: anyNode.props?.level ? `h${anyNode.props.level}` : 'h2',
          heading1: 'h1',
          heading2: 'h2',
          heading3: 'h3',
          heading4: 'h4',
          bulletList: 'ul',
          orderedList: 'ol',
          listItem: 'li',
          quote: 'blockquote',
          table: 'table',
          tableHead: 'thead',
          tableBody: 'tbody',
          tableRow: 'tr',
          tableCell: 'td',
          codeBlock: 'pre',
        }

        const tag = tagMap[type] || (type.startsWith('heading') ? `h${type.slice(-1)}` : 'p')
        return `<${tag}>${childrenHtml}</${tag}>`
      }

      if (Array.isArray(blocks)) {
        return blocks.map((block: unknown) => `<p>${renderNode(block)}</p>`).join('')
      }
      if (typeof blocks === 'object') {
        return `<p>${renderNode(blocks)}</p>`
      }
    } catch {
      // 解析失败时回退到原始字符串
    }
  }

  // 默认认为是 HTML 字符串
  if (trimmed.includes('<')) {
    return trimmed
  }

  return `<p>${trimmed.replace(/\n+/g, '<br />')}</p>`
}

export default function QaPage() {
  const navigate = useNavigate()
  const [qaList, setQaList] = useState<QaInfo[]>([])
  const [total, setTotal] = useState(0)
  const [current, setCurrent] = useState(1)
  const [pageSize] = useState(12)
  const [selectedTag, setSelectedTag] = useState<string>('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminModalVisible, setAdminModalVisible] = useState(false)
  const [adminPassword, setAdminPassword] = useState('')
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(false)
  const [selectedQa, setSelectedQa] = useState<QaInfo | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const answerPanelRef = useRef<HTMLDivElement>(null)

  // SSE接收每日推荐
  const { data: hotQaStream } = useSse<QaInfo>('/qa/hot/sse')

  const hotQaList = useMemo(() => {
    if (!hotQaStream?.length) return []
    const dedupeMap = new Map<string, QaInfo>()
    ;[...hotQaStream].reverse().forEach((item) => {
      if (item?.id) {
        dedupeMap.set(item.id, item)
      }
    })
    return Array.from(dedupeMap.values()).slice(0, 4)
  }, [hotQaStream])

  // 加载QA列表
  const loadQaList = useCallback(async () => {
    try {
      const result = await getQaList({
        current,
        pageSize,
        tag: selectedTag || undefined,
      })
      setQaList(result.records || [])
      setTotal(result.total || 0)
    } catch (error) {
      console.error('加载QA列表失败:', error)
      // 不显示错误提示，避免干扰用户体验
    }
  }, [current, pageSize, selectedTag])

  useEffect(() => {
    void loadQaList()
  }, [loadQaList])

  const syncAdminSession = useCallback(async () => {
    try {
      const hasSession = await fetchAdminSession()
      setIsAdmin(hasSession)
      return hasSession
    } catch (error) {
      console.error('检测管理员会话失败:', error)
      setIsAdmin(false)
      return false
    }
  }, [])

  useEffect(() => {
    void syncAdminSession()
  }, [syncAdminSession])

  const handleAdminEntry = async () => {
    if (isAdmin) {
      message.info('已处于管理员模式，卡片操作按钮已解锁')
      return
    }
    setIsCheckingAdmin(true)
    try {
      const hasSession = await syncAdminSession()
      if (hasSession) {
        message.success('检测到已有管理员会话，已自动解锁')
        return
      }
    } finally {
      setIsCheckingAdmin(false)
    }
    setAdminModalVisible(true)
  }

  // GSAP动画：卡片进入动画
  useLayoutEffect(() => {
    const grid = gridRef.current
    if (!grid) return
    const cards = grid.querySelectorAll('[data-qa-card]')
    if (cards.length === 0) return

    ScrollTrigger.batch(cards, {
      onEnter: (elements) => {
        gsap.fromTo(
          elements,
          {
            y: 80,
            opacity: 0,
            scale: 0.9,
          },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.8,
            ease: 'power3.out',
            stagger: 0.1,
            force3D: true,
          }
        )
      },
      start: 'top 85%',
    })

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => {
        const triggerVars = trigger.vars as { targets?: Element | Element[] }
        const targets = triggerVars?.targets
        const targetArray = Array.isArray(targets) ? targets : targets ? [targets] : []
        if (
          targetArray.some(
            (target) => target instanceof Element && grid?.contains(target)
          )
        ) {
          trigger.kill()
        }
      })
    }
  }, [qaList])

  // 默认选中第一条 QA
  useEffect(() => {
    if (qaList.length === 0) {
      setSelectedQa((prev) => (prev && hotQaList.find((qa) => qa.id === prev.id) ? prev : null))
      return
    }

    setSelectedQa((prev) => {
      if (!prev) {
        return qaList[0]
      }
      const stillVisible =
        qaList.some((qa) => qa.id === prev.id) || hotQaList.some((qa) => qa.id === prev.id)
      if (stillVisible) {
        return prev
      }
      return qaList[0]
    })
  }, [qaList, hotQaList])

  // 处理标签筛选
  const handleTagChange = (tag: string) => {
    setSelectedTag(tag)
    setCurrent(1)
  }

  // 处理分页
  const handlePageChange = (page: number) => {
    setCurrent(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // 选中 QA
  const handleCardClick = (qa: QaInfo) => {
    setSelectedQa(qa)
    answerPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // 管理员口令校验
  const handleAdminLogin = async () => {
    if (!adminPassword.trim()) {
      message.warning('请输入管理员口令')
      return
    }
    try {
      const isValid = await loginQaAdmin(adminPassword.trim())
      if (isValid) {
        await syncAdminSession()
        setAdminModalVisible(false)
        setAdminPassword('')
        message.success('管理员验证成功，当前页面已解锁编辑能力')
      } else {
        message.error('口令错误')
      }
    } catch (error: unknown) {
      console.error('验证失败:', error)
      message.error('验证失败')
    }
  }

  // 删除QA
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条QA吗？',
      onOk: async () => {
        try {
          await deleteAdminQa(id)
          message.success('删除成功')
          loadQaList()
        } catch (error: unknown) {
          console.error('删除失败:', error)
          message.error('删除失败')
        }
      },
    })
  }

  // 编辑QA
  const handleEdit = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await ensureYuqueAssets()
    } catch (error) {
      // 即便预加载失败，也允许进入编辑页，由编辑页自身再处理错误
      console.error('预加载语雀资源失败:', error)
    }
    // 使用浏览器跳转到 Hash 路由形式，形如：http(s)://域名/路径#/qa/edit/xxx
    goToQaEdit(id)
  }

  // 添加QA
  const handleAdd = async () => {
    try {
      await ensureYuqueAssets()
    } catch (error) {
      console.error('预加载语雀资源失败:', error)
    }
    goToQaEdit('new')
  }

  // 截断答案预览（去除HTML标签）
  const getAnswerPreview = (answer: string, maxLength: number = 100) => {
    const text = answer.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ')
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  const renderAnswerContent = useMemo(() => {
    if (!selectedQa) return '<p>请选择想阅读的问题，系统将打开完整答案。</p>'
    return convertAnswerToHtml(selectedQa.answer)
  }, [selectedQa])

  // 标签选项：在预设标签基础上，自动合并当前数据中出现过的自定义标签
  const mergedTags = useMemo(() => {
    const presetSet = new Set<string>()
    const allTags = new Set<string>()

    // 先按预设顺序加入
    QA_TAGS.forEach((tag) => {
      const value = tag as string
      presetSet.add(value)
      allTags.add(value)
    })

    // 再把接口返回的标签并入（包括自定义的）
    qaList.forEach((item) => {
      const value = item.tag
      if (value && !presetSet.has(value)) {
        allTags.add(value)
      }
    })
    hotQaList.forEach((item) => {
      const value = item.tag
      if (value && !presetSet.has(value)) {
        allTags.add(value)
      }
    })

    return Array.from(allTags)
  }, [qaList, hotQaList])

  const tagOptions = useMemo(() => ['全部', ...mergedTags], [mergedTags])
  const resolvedTag = selectedTag || '全部'
  const handleTagSelect = (tag: string) => {
    handleTagChange(tag === '全部' ? '' : tag)
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Modal
        title="管理员验证"
        visible={adminModalVisible}
        onOk={handleAdminLogin}
        onCancel={() => {
          setAdminModalVisible(false)
          setAdminPassword('')
        }}
        okText="验证"
        cancelText="取消"
      >
        <Input.Password
          placeholder="请输入管理员口令"
          value={adminPassword}
          onChange={(e) => setAdminPassword(e.target.value)}
          onPressEnter={handleAdminLogin}
          maxLength={50}
        />
      </Modal>

      <section className="relative overflow-hidden border-b border-border/60 bg-background">
        <div className="absolute inset-0 h-[240px] w-full opacity-80 [mask-image:linear-gradient(to_top,transparent_15%,black)]">
          <FlickeringGrid />
        </div>
        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-16">
          <div className="flex flex-col gap-3">
            <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">QA Library</p>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900 dark:text-white md:text-5xl">
              QA 知识库
            </h1>
            <p className="max-w-2xl text-base text-muted-foreground">
              绘制 Shane 的问题卡片，聚合简历、技术、面试等高频问答。
            </p>
          </div>
          <QaTagFilter tags={tagOptions} selectedTag={resolvedTag} onSelect={handleTagSelect} />
          <div className="flex flex-wrap gap-3">
            <Button
              type={isAdmin ? 'default' : 'dashed'}
              icon={<LockOutlined />}
              onClick={handleAdminEntry}
              loading={isCheckingAdmin}
              size="large"
            >
              {isAdmin ? '进入管理后台' : '管理员入口'}
            </Button>
            {isAdmin && (
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} size="large">
                添加QA
              </Button>
            )}
          </div>
        </div>
      </section>

      {hotQaList.length > 0 && (
        <section className="mx-auto w-full max-w-6xl px-6 py-10">
          <div className="rounded-3xl border border-amber-200/60 bg-amber-50/70 p-6 dark:border-amber-400/20 dark:bg-amber-950/20">
            <div className="mb-5 flex flex-wrap items-center gap-3 text-amber-600 dark:text-amber-300">
              <FireOutlined />
              <span className="text-base font-semibold">每日推荐 · 实时从 SSE 推送</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {hotQaList.map((qa) => (
                <button
                  type="button"
                  key={qa.id}
                  onClick={() => handleCardClick(qa)}
                  className="rounded-2xl border border-white/60 bg-white/80 p-5 text-left transition hover:-translate-y-1 hover:shadow-md dark:border-white/10 dark:bg-slate-900/80"
                >
                  <div className="flex items-center gap-2 text-xs text-amber-500">
                    <span className="rounded-full border border-amber-200 px-2 py-0.5">{qa.tag}</span>
                    <span>精选推荐</span>
                  </div>
                  <h4 className="mt-3 text-lg font-semibold text-slate-900 dark:text-white">
                    {qa.question}
                  </h4>
                  <p className="qa-card-preview text-sm text-muted-foreground">
                    {getAnswerPreview(qa.answer, 140)}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{qa.viewCount} 次阅读</span>
                    <span>{new Date(qa.createTime).toLocaleDateString()}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto w-full max-w-6xl px-6 py-12">
        <div ref={gridRef} className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {qaList.length > 0 ? (
            qaList.map((qa) => (
              <QaCard
                key={qa.id}
                qa={qa}
                isAdmin={isAdmin}
                isActive={selectedQa?.id === qa.id}
                answerPreview={getAnswerPreview(qa.answer)}
                onSelect={handleCardClick}
                onEdit={(item, e) => handleEdit(item.id, e)}
                onDelete={(item, e) => handleDelete(item.id, e)}
              />
            ))
          ) : (
            <div className="col-span-full rounded-3xl border border-dashed border-border/70 p-10 text-center">
              <Empty description="暂无数据，试试切换标签或稍后再试" />
            </div>
          )}
        </div>

        {total > 0 && (
          <div className="mt-10 flex justify-center">
            <Pagination
              current={current}
              pageSize={pageSize}
              total={total}
              onChange={handlePageChange}
              showSizeChanger={false}
              showTotal={(count) => `共 ${count} 条`}
            />
          </div>
        )}

        <div
          ref={answerPanelRef}
          className="mt-12 rounded-3xl border border-border/80 bg-surface/80 p-8 shadow-soft-card dark:bg-slate-900/80"
        >
          {selectedQa ? (
            <>
              <div className="mb-6 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Tag color="processing">{selectedQa.tag}</Tag>
                  {selectedQa.isHot === 1 && <Tag color="volcano">精选</Tag>}
                </div>
                <h2 className="text-3xl font-bold leading-snug text-slate-900 dark:text-white">
                  {selectedQa.question}
                </h2>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span>浏览量：{selectedQa.viewCount}</span>
                  <span>发布时间：{new Date(selectedQa.createTime).toLocaleString()}</span>
                </div>
              </div>
              <div
                className="qa-typography"
                dangerouslySetInnerHTML={{ __html: renderAnswerContent }}
              />
              <div className="mt-8 flex flex-wrap gap-3">
                <Button icon={<ReadOutlined />} onClick={() => navigate(`/qa/${selectedQa.id}`)}>
                  在独立页面阅读
                </Button>
                {isAdmin && (
                  <Button
                    type="primary"
                    icon={<EditOutlined />}
                    onClick={() => navigate(`/qa/edit/${selectedQa.id}`)}
                  >
                    编辑这条QA
                  </Button>
                )}
              </div>
            </>
          ) : (
            <Empty
              description="点击上方任意问题即可在此阅读完整答案"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )}
        </div>
      </section>
    </div>
  )
}
