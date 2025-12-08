/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ReviewAudioRecorder } from '@/features/review/AudioRecorder'
import { ReviewInputForm } from '@/features/review/InputForm'
import { ReviewResultDisplay } from '@/features/review/ResultDisplay'
import { ReviewAppState, type UserInput, type ReviewResult } from '@/types/review'
import { analyzeSpokenAnswer } from '@/services/reviewService'
import { Loader2, Sparkles } from 'lucide-react'
import { useTheme } from '@/providers/ThemeProvider'
import { useSearchParams } from 'react-router-dom'

export default function ReviewCheckPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [searchParams] = useSearchParams()

  const [appState, setAppState] = useState<ReviewAppState>(ReviewAppState.IDLE)
  const [userInput, setUserInput] = useState<UserInput>({ topic: '', standardAnswer: '' })
  const [reviewResult, setReviewResult] = useState<ReviewResult | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const prefill = useMemo(() => {
    const topic = searchParams.get('topic') || ''
    const answer = searchParams.get('answer') || ''
    return { topic, standardAnswer: answer }
  }, [searchParams])

  const handleInputSubmit = useCallback((data: UserInput) => {
    setUserInput(data)
    setAppState(ReviewAppState.RECORDING)
  }, [])

  const handleTranscriptionReady = useCallback(async (transcription: string) => {
    setAppState(ReviewAppState.PROCESSING)
    setErrorMsg(null)
    try {
      const result = await analyzeSpokenAnswer(userInput, transcription)
      setReviewResult(result)
      setAppState(ReviewAppState.RESULTS)
    } catch (err) {
      console.error(err)
      setErrorMsg(err instanceof Error ? err.message : '分析回答失败，请重试。')
      setAppState(ReviewAppState.RECORDING)
    }
  }, [userInput])

  const handleReset = useCallback(() => {
    setAppState(ReviewAppState.IDLE)
    setUserInput({ topic: '', standardAnswer: '' })
    setReviewResult(null)
    setErrorMsg(null)
  }, [])

  const handleBackToInput = useCallback(() => {
    setAppState(ReviewAppState.IDLE)
  }, [])

  // 当通过 query 进入时，自动预填主题与答案，保持在输入态，用户可直接录音或修改
  useEffect(() => {
    if (prefill.topic || prefill.standardAnswer) {
      setUserInput(prefill)
      setAppState(ReviewAppState.IDLE)
    }
  }, [prefill])

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'} pb-16`}>
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-blue-500/5 to-purple-500/10 blur-3xl" />
        <div className="relative mx-auto max-w-5xl px-4 pt-28 pb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-200 text-xs font-semibold mb-4">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            Shane · 检验复盘
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight tracking-tight">
            检验复盘 <span className="text-indigo-500">Checkpoint</span>
          </h1>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-300 max-w-3xl">
            一键对比你的回答与标准答案，语音或文本输入皆可。模型会给出准确度、完整度、缺失要点与改进建议，并提供「智能解读」可执行提示。
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-indigo-200/60 dark:border-indigo-500/30 bg-white/70 dark:bg-slate-900/60 px-4 py-2 text-sm text-indigo-600 dark:text-indigo-200 shadow-sm">
            <Sparkles className="w-4 h-4" /> 开始检验你的成果吧!
          </div>
        </div>
      </div>

      <main className="relative z-10 w-full max-w-5xl mx-auto px-4 space-y-10">
        {appState === ReviewAppState.IDLE && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ReviewInputForm
              onSubmit={handleInputSubmit}
              defaultTopic={userInput.topic}
              defaultAnswer={userInput.standardAnswer}
            />
          </div>
        )}

        {appState === ReviewAppState.RECORDING && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ReviewAudioRecorder
              topic={userInput.topic}
              onTranscriptionReady={handleTranscriptionReady}
              onBack={handleBackToInput}
            />
          </div>
        )}

        {appState === ReviewAppState.PROCESSING && (
          <div className="flex flex-col items-center justify-center h-96 gap-4 bg-white/80 dark:bg-slate-900/70 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xl">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 rounded-full animate-pulse" />
              <Loader2 className="w-14 h-14 text-indigo-600 animate-spin relative z-10" />
            </div>
            <h2 className="text-2xl font-bold">正在检验你的复盘...</h2>
            <p className="text-slate-500 dark:text-slate-400">对比标准答案并生成改进建议</p>
          </div>
        )}

        {appState === ReviewAppState.RESULTS && reviewResult && (
          <ReviewResultDisplay
            result={reviewResult}
            input={userInput}
            onReset={handleReset}
          />
        )}

        {errorMsg && (
          <div className="fixed bottom-4 right-4 bg-red-100 dark:bg-red-900/40 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-100 px-4 py-3 rounded-lg shadow-lg text-sm max-w-xs">
            {errorMsg}
          </div>
        )}
      </main>
    </div>
  )
}

