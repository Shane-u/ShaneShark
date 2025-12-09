import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Editor, { loader } from '@monaco-editor/react'
import {
  Bot,
  Clock3,
  Code2,
  FileJson,
  History,
  Play,
  RotateCcw,
  Sparkles,
  Terminal,
  Wand2,
  Sun,
  Moon,
} from 'lucide-react'
import { useTheme } from '@/providers/ThemeProvider'
import {
  SANDBOX_HISTORY_KEY,
  SANDBOX_STATE_KEY,
  type SandboxEditorTheme,
  type SandboxExecutionResult,
  type SandboxHistoryItem,
  type SandboxLanguage,
  type SandboxPersistedState,
  type SandboxTab,
} from '@/types/sandbox'
import { runSandboxCode } from '@/services/sandboxService'
import { analyzeCodeWithAi } from '@/services/sandboxAiService'

loader.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs' } })

const LANGUAGES: SandboxLanguage[] = [
  { id: 'java', name: 'Java', version: '8', defaultCode: `class Code {\n  public static void main(String[] args) {\n    System.out.println("你好，世界!");\n  }\n}`, monacoLanguage: 'java' },
  { id: 'python', name: 'Python 3', version: '3.9.18', defaultCode: `print("你好，世界!")`, monacoLanguage: 'python' },
  { id: 'cpp', name: 'C++', version: '14.2', defaultCode: `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "你好，世界!" << endl;\n    return 0;\n}`, monacoLanguage: 'cpp' },
  { id: 'c', name: 'C', version: '14.2', defaultCode: `#include <stdio.h>\n\nint main() {\n    printf("你好，世界!\\n");\n    return 0;\n}`, monacoLanguage: 'c' },
  { id: 'go', name: 'Go', version: '1.18', defaultCode: `package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("你好，世界!")\n}`, monacoLanguage: 'go' },
  { id: 'nodejs', name: 'Node.js', version: '22', defaultCode: `console.log("你好，世界!");`, monacoLanguage: 'javascript' },
]

const DEFAULT_TAB: SandboxTab = 'output'
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

const loadPersistedState = (): SandboxPersistedState | null => {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(SANDBOX_STATE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<SandboxPersistedState>
    if (!parsed || typeof parsed !== 'object') return null

    let editorTheme: SandboxEditorTheme = 'vs'
    if (parsed.editorTheme === 'vs' || parsed.editorTheme === 'vs-dark') {
      editorTheme = parsed.editorTheme
    }
    return {
      langId: typeof parsed.langId === 'string' ? parsed.langId : '',
      code: typeof parsed.code === 'string' ? parsed.code : '',
      stdin: typeof parsed.stdin === 'string' ? parsed.stdin : '',
      editorTheme,
    }
  } catch (err) {
    console.error('Failed to load sandbox state', err)
    return null
  }
}

const useHistory = () => {
  const [history, setHistory] = useState<SandboxHistoryItem[]>([])

  useEffect(() => {
    const saved = localStorage.getItem(SANDBOX_HISTORY_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as SandboxHistoryItem[]
        startTransition(() => {
          setHistory(parsed)
        })
      } catch (err) {
        console.error('Failed to parse sandbox history', err)
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(SANDBOX_HISTORY_KEY, JSON.stringify(history))
  }, [history])

  return { history, setHistory }
}

const OutputPanel = ({ result, error, isDark }: { result: SandboxExecutionResult | null; error?: string | null; isDark: boolean }) => {
  if (!result && !error) {
    return (
      <div className={`flex h-full flex-col items-center justify-center gap-3 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
        <Terminal className="h-10 w-10 opacity-30" />
        <p>等待运行</p>
      </div>
    )
  }

  return (
    <div className={`flex h-full flex-col gap-3 overflow-auto rounded-2xl p-4 shadow-inner shadow-indigo-500/10 ${isDark ? 'bg-slate-900/70 border border-white/10 text-slate-100' : 'bg-white border border-slate-200 text-slate-700'}`}>
      <div className={`flex items-center justify-between text-xs ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
        <span className="flex items-center gap-2">
          <Terminal className="h-4 w-4" /> 终端输出
        </span>
        {result && (
          <span className={result.code === 0 ? 'text-emerald-500' : 'text-rose-500'}>
            退出码 {result.code}
          </span>
        )}
      </div>
      {result?.output && (
        <pre className={`whitespace-pre-wrap break-words rounded-xl p-3 text-sm font-mono ${isDark ? 'bg-slate-950/60 text-slate-100' : 'bg-slate-100 text-slate-800'}`}>
          {result.output}
        </pre>
      )}
      {result?.message && (
        <div className={`rounded-xl border p-3 text-sm ${isDark ? 'border-rose-500/40 bg-rose-500/10 text-rose-100' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
          <p className="font-semibold">错误信息</p>
          <p>{result.message}</p>
        </div>
      )}
      {error && (
        <div className={`rounded-xl border p-3 text-sm ${isDark ? 'border-rose-500/40 bg-rose-500/10 text-rose-100' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
          <p className="font-semibold">系统错误</p>
          <p>{error}</p>
        </div>
      )}
      {!result?.output && !result?.message && !error && (
        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>程序运行完成，无输出。</p>
      )}
      {result && (
        <div className={`text-right text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>耗时: {result.time}ms</div>
      )}
    </div>
  )
}

const HistoryPanel = ({
  history,
  onRestore,
  onClear,
}: {
  history: SandboxHistoryItem[]
  onRestore: (item: SandboxHistoryItem) => void
  onClear: () => void
}) => {
  if (!history.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-slate-500">
        <Clock3 className="h-10 w-10 opacity-30" />
        <p>暂无历史记录</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>最近执行</span>
        <button onClick={onClear} className="text-rose-400 hover:text-rose-300">清空</button>
      </div>
      <div className="flex flex-col gap-2 overflow-auto">
        {history.map((item) => (
          <button
            key={item.id}
            onClick={() => onRestore(item)}
            className="group rounded-xl border border-white/5 bg-slate-900/50 p-3 text-left transition hover:border-indigo-400/50 hover:bg-slate-800/70"
          >
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className={`rounded-full px-2 py-0.5 font-semibold ${item.status === 'success' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'}`}>
                {item.language}
              </span>
              <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
            </div>
            <p className="mt-2 line-clamp-2 text-[13px] text-slate-300 group-hover:text-indigo-100">
              {item.code}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}

const AnalysisPanel = ({
  analysis,
  onAnalyze,
  isAnalyzing,
  hasCode,
  isDark,
}: {
  analysis: string
  onAnalyze: () => Promise<void>
  isAnalyzing: boolean
  hasCode: boolean
  isDark: boolean
}) => {
  if (isAnalyzing) {
    return (
      <div className={`flex h-full flex-col items-center justify-center gap-3 ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500/20 border-t-indigo-500" />
        <p>AI 正在分析代码...</p>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className={`flex h-full flex-col items-center justify-center gap-3 text-center text-sm ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
        <Sparkles className="h-10 w-10 text-indigo-400/70" />
        <p>使用「检验复盘」同源 AI，对代码做一次复盘点评。</p>
        <button
          onClick={onAnalyze}
          disabled={!hasCode}
          className="rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-2 text-white shadow-lg shadow-indigo-500/30 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
        >
          开始分析
        </button>
      </div>
    )
  }

  return (
    <div className={`flex h-full flex-col gap-3 overflow-auto rounded-2xl border p-4 text-sm ${isDark ? 'border-indigo-500/30 bg-slate-900/60 text-slate-100' : 'border-indigo-100 bg-white text-slate-700 shadow-sm'}`}>
      <div className={`flex items-center gap-2 text-xs uppercase tracking-wide ${isDark ? 'text-indigo-200' : 'text-indigo-500'}`}>
        <Bot className="h-4 w-4" /> AI 复盘
      </div>
      <p className={`whitespace-pre-wrap leading-relaxed ${isDark ? 'text-slate-100' : 'text-slate-700'}`}>{analysis}</p>
      <button
        onClick={onAnalyze}
        className={`self-start rounded-full bg-transparent px-3 py-1 text-xs underline-offset-4 hover:underline ${isDark ? 'text-indigo-200' : 'text-indigo-600'}`}
      >
        重新生成
      </button>
    </div>
  )
}

export default function SandboxPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const persistedStateRef = useRef<SandboxPersistedState | null>(loadPersistedState())
  const initialLang =
    (persistedStateRef.current?.langId && LANGUAGES.find((item) => item.id === persistedStateRef.current?.langId)) ||
    LANGUAGES[0]
  const initialEditorTheme: SandboxEditorTheme =
    persistedStateRef.current?.editorTheme ?? (isDark ? 'vs-dark' : 'vs')
  const [selectedLang, setSelectedLang] = useState<SandboxLanguage>(initialLang)
  const [code, setCode] = useState(persistedStateRef.current?.code ?? initialLang.defaultCode)
  const [stdin, setStdin] = useState(persistedStateRef.current?.stdin ?? '')
  const [result, setResult] = useState<SandboxExecutionResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<SandboxTab>(DEFAULT_TAB)
  const [analysis, setAnalysis] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [editorTheme, setEditorTheme] = useState<SandboxEditorTheme>(initialEditorTheme)
  const hasManualEditorTheme = useRef<boolean>(Boolean(persistedStateRef.current?.editorTheme))
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')
  const saveTimer = useRef<number | null>(null)
  const { history, setHistory } = useHistory()

  useEffect(() => {
    if (hasManualEditorTheme.current) return
    setEditorTheme(isDark ? 'vs-dark' : 'vs')
  }, [isDark])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (saveTimer.current) {
      window.clearTimeout(saveTimer.current)
      saveTimer.current = null
    }
    setSaveStatus('saving')
    const payload: SandboxPersistedState = {
      langId: selectedLang.id,
      code,
      stdin,
      editorTheme,
    }
    try {
      window.localStorage.setItem(SANDBOX_STATE_KEY, JSON.stringify(payload))
      saveTimer.current = window.setTimeout(() => setSaveStatus('saved'), 150)
    } catch (err) {
      console.error('Failed to persist sandbox state', err)
      setSaveStatus('error')
    }
    return () => {
      if (saveTimer.current) {
        window.clearTimeout(saveTimer.current)
        saveTimer.current = null
      }
    }
  }, [selectedLang.id, code, stdin, editorTheme])

  const handleLangChange = (id: string) => {
    const next = LANGUAGES.find((item) => item.id === id)
    if (!next) return
    if (!code.trim() || code === selectedLang.defaultCode) {
      setCode(next.defaultCode)
    }
    setSelectedLang(next)
  }

  const resetCode = () => {
    setCode(selectedLang.defaultCode)
    setResult(null)
    setError(null)
  }

  const handleRun = useCallback(async () => {
    setIsRunning(true)
    setError(null)
    setResult(null)
    setActiveTab('output')

    const response = await runSandboxCode({
      code,
      type: selectedLang.id,
      stdin,
      version: selectedLang.version,
    })

    if (response.code === 0 && response.data) {
      setResult(response.data)
      const item: SandboxHistoryItem = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        language: selectedLang.name,
        code,
        output: response.data.output || response.data.message,
        status: response.data.code === 0 ? 'success' : 'error',
      }
      setHistory((prev) => [item, ...prev].slice(0, 50))
    } else {
      setError(response.data?.message || '执行失败')
      const item: SandboxHistoryItem = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        language: selectedLang.name,
        code,
        output: response.data?.message || '执行失败',
        status: 'error',
      }
      setHistory((prev) => [item, ...prev].slice(0, 50))
    }

    setIsRunning(false)
  }, [code, selectedLang, stdin, setHistory])

  const handleAnalyze = useCallback(async () => {
    setActiveTab('ai')
    setIsAnalyzing(true)
    try {
      const text = await analyzeCodeWithAi(code, selectedLang.name)
      setAnalysis(text)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'AI 分析失败，请稍后重试'
      setAnalysis(msg)
    } finally {
      setIsAnalyzing(false)
    }
  }, [code, selectedLang.name])

  const restoreHistory = useCallback((item: SandboxHistoryItem) => {
    setCode(item.code)
    setSelectedLang(LANGUAGES.find((l) => l.name === item.language) || LANGUAGES[0])
    setResult({
      output: item.output,
      code: item.status === 'success' ? 0 : 1,
      time: 0,
      message: '',
    })
    setActiveTab('output')
  }, [])

  const tabBody = useMemo(() => {
    if (activeTab === 'history') {
      return (
        <HistoryPanel
          history={history}
          onRestore={restoreHistory}
          onClear={() => setHistory([])}
        />
      )
    }
    if (activeTab === 'ai') {
      return (
        <AnalysisPanel
          analysis={analysis}
          onAnalyze={handleAnalyze}
          isAnalyzing={isAnalyzing}
          hasCode={!!code.trim()}
          isDark={isDark}
        />
      )
    }
    return <OutputPanel result={result} error={error} isDark={isDark} />
  }, [activeTab, analysis, code, error, handleAnalyze, history, isAnalyzing, isDark, result, setHistory, restoreHistory])

  return (
    <div className={`relative min-h-screen ${isDark ? 'bg-slate-950 text-slate-50' : 'bg-slate-50 text-slate-900'} pb-16`}>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-sky-400/10 blur-3xl" />
      <div className="relative mx-auto flex max-w-7xl flex-col gap-10 px-4 pt-20">
        <div className="flex flex-col gap-4 rounded-3xl border border-indigo-500/20 bg-white/80 p-8 shadow-2xl shadow-indigo-500/10 backdrop-blur-md dark:border-white/10 dark:bg-slate-900/70">
          <div className="inline-flex items-center gap-2 self-start rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-200">
            <Sparkles className="h-4 w-4" /> 沙箱世界 · Sandbox Lab
          </div>
          <div className="flex flex-col gap-3">
            <h1 className="text-3xl font-black leading-tight text-slate-900 dark:text-slate-50 md:text-4xl">在线多语言沙箱，随手试代码</h1>
            <p className="max-w-3xl text-base text-slate-600 dark:text-slate-300">
                帮你审查代码质量；可执行 Java / Python / C / C++ / Go / Node.js，支持主题切换与运行历史。
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-300">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/5 px-3 py-1 text-slate-700 dark:bg-white/5 dark:text-slate-200">
              <Code2 className="h-4 w-4" /> {selectedLang.name} · v{selectedLang.version}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/5 px-3 py-1 text-slate-700 dark:bg-white/5 dark:text-slate-200">
              <Wand2 className="h-4 w-4" /> AI: SiliconFlow ({import.meta.env.VITE_SILICON_FLOW_MODEL || 'Qwen/Qwen2.5-7B-Instruct'})
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/5 px-3 py-1 text-slate-700 dark:bg-white/5 dark:text-slate-200">
              <Terminal className="h-4 w-4" /> 远程运行 API
            </span>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4 rounded-3xl border border-white/10 bg-white/80 p-4 shadow-xl shadow-indigo-500/10 backdrop-blur-md dark:border-white/10 dark:bg-slate-900/70">
            <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-900/5 p-3 dark:bg-white/5 sm:flex-row sm:items-center sm:flex-nowrap sm:overflow-x-auto">
              <div className="flex shrink-0 items-center gap-2 rounded-xl border border-slate-200/60 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm dark:border-white/10 dark:bg-slate-800 dark:text-slate-100">
                <FileJson className="h-4 w-4" />
                <select
                  value={selectedLang.id}
                  onChange={(e) => handleLangChange(e.target.value)}
                  className="bg-transparent outline-none dark:bg-transparent"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.id} value={lang.id}>
                      {lang.name} ({lang.version})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex shrink-0 items-center gap-2 rounded-xl border border-slate-200/60 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm dark:border-white/10 dark:bg-slate-800 dark:text-slate-100">
                <Sun className="h-4 w-4" />
                <button
                  type="button"
                  onClick={() => {
                    hasManualEditorTheme.current = true
                    setEditorTheme('vs')
                  }}
                  className={`rounded-full px-3 py-1 text-xs ${editorTheme === 'vs' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200' : 'text-slate-500 dark:text-slate-300'}`}
                >
                  亮色
                </button>
                <button
                  type="button"
                  onClick={() => {
                    hasManualEditorTheme.current = true
                    setEditorTheme('vs-dark')
                  }}
                  className={`rounded-full px-3 py-1 text-xs ${editorTheme === 'vs-dark' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200' : 'text-slate-500 dark:text-slate-300'}`}
                >
                  暗色
                </button>
                <Moon className="h-4 w-4" />
              </div>
              <div className="ml-auto flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200/70 dark:bg-slate-800 dark:text-slate-200 dark:ring-white/10">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    saveStatus === 'saved'
                      ? 'bg-emerald-500'
                      : saveStatus === 'saving'
                        ? 'bg-amber-400'
                        : saveStatus === 'error'
                          ? 'bg-rose-500'
                          : 'bg-slate-300'
                  }`}
                />
                <span>
                  {saveStatus === 'saved' && 'done'}
                  {saveStatus === 'saving' && 'ing'}
                  {saveStatus === 'error' && 'fail'}
                  {saveStatus === 'idle' && 'wait'}
                </span>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2 sm:shrink-0">
                <button
                  onClick={handleRun}
                  disabled={isRunning}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {isRunning ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Play className="h-4 w-4" />}
                  运行
                </button>
                <button
                  onClick={handleAnalyze}
                  disabled={!code.trim() || isAnalyzing}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-500/30 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  <Bot className="h-4 w-4" />
                  AI 分析
                </button>
                <button
                  onClick={resetCode}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-200 dark:hover:border-indigo-400 sm:w-auto"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex min-h-[640px] flex-col overflow-hidden rounded-2xl border border-slate-200/80 shadow-lg shadow-indigo-500/10 dark:border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-200/70 bg-slate-50/90 px-4 py-3 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <Code2 className="h-4 w-4" />
                  编辑器
                </div>
                <span className="font-mono text-slate-400">{code.length} chars</span>
              </div>
              <div className="h-[560px] md:h-[640px] flex-shrink-0">
                <Editor
                  height="100%"
                  language={selectedLang.monacoLanguage || selectedLang.id}
                  value={code}
                  theme={editorTheme}
                  onChange={(value) => setCode(value ?? '')}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    fontFamily: "'JetBrains Mono', monospace",
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2,
                    padding: { top: 12, bottom: 12 },
                    renderLineHighlight: 'all',
                  }}
                />
              </div>
              <div className="border-t border-slate-200/70 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/60">
                <div className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-500 dark:text-slate-200">
                  <FileJson className="h-4 w-4" /> 标准输入 STDIN
                </div>
                <textarea
                  value={stdin}
                  onChange={(e) => setStdin(e.target.value)}
                  placeholder="在此填入程序所需的输入..."
                  className="h-28 w-full resize-none border-0 bg-transparent px-4 pb-4 text-sm text-slate-700 outline-none dark:text-slate-100"
                />
              </div>
            </div>
          </div>

          <div className="flex h-full flex-col gap-3 rounded-3xl border border-white/10 bg-white/85 p-4 shadow-xl shadow-indigo-500/10 backdrop-blur-md dark:border-white/10 dark:bg-slate-900/70">
            <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-3 text-sm font-semibold text-slate-500 shadow-inner dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200">
              <div className="flex items-center gap-2">
                <FileJson className="h-4 w-4" /> 标准输入 STDIN
              </div>
              <textarea
                value={stdin}
                onChange={(e) => setStdin(e.target.value)}
                placeholder="在此填入程序所需的输入..."
                className="mt-2 h-28 w-full resize-none rounded-xl border border-slate-200/70 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-indigo-400 dark:focus:ring-indigo-900/40"
              />
            </div>
            <div className="grid grid-cols-3 rounded-xl border border-slate-200/70 bg-slate-100/70 p-1 text-sm font-semibold text-slate-600 shadow-inner dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-200">
              {[
                { key: 'output', label: '输出', icon: Terminal },
                { key: 'history', label: '历史', icon: History },
                { key: 'ai', label: 'AI 复盘', icon: Wand2 },
              ].map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as SandboxTab)}
                    className={`flex items-center justify-center gap-2 rounded-lg px-2 py-2 transition ${
                      activeTab === tab.key
                        ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-indigo-200'
                        : 'hover:text-indigo-600 dark:hover:text-indigo-200'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                )
              })}
            </div>
            <div className="min-h-[480px] flex-1 rounded-2xl border border-white/10 bg-slate-50/80 p-3 shadow-inner shadow-indigo-500/10 dark:border-white/10 dark:bg-slate-900/60">
              {tabBody}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

