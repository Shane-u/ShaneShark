/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react'
import type { UserInput } from '@/types/review'
import { BookOpen, FileText, ArrowRight } from 'lucide-react'

interface Props {
  onSubmit: (data: UserInput) => void
  defaultTopic?: string
  defaultAnswer?: string
}

export function ReviewInputForm({ onSubmit, defaultTopic = '', defaultAnswer = '' }: Props) {
  const [topic, setTopic] = useState(defaultTopic)
  const [standardAnswer, setStandardAnswer] = useState(defaultAnswer)

  // keep inputs in sync when query params change
  useEffect(() => {
    if (topic !== defaultTopic) setTopic(defaultTopic)
    if (standardAnswer !== defaultAnswer) setStandardAnswer(defaultAnswer)
  }, [defaultTopic, defaultAnswer, topic, standardAnswer])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (topic.trim() && standardAnswer.trim()) {
      onSubmit({ topic, standardAnswer })
    }
  }

  return (
    <div className="bg-white/90 dark:bg-slate-900/80 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden backdrop-blur">
      <div className="p-6 md:p-8 space-y-6">
        <div className="space-y-1">
          <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-200 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            检验复盘 · 输入
          </p>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">定义主题与标准答案</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">一句话主题 + 标准答案，方便模型帮你对比。</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-500" />
              主题 / 问题
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="例如：解释 React Hooks 的作用与优势"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500 transition-all outline-none"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-500" />
              标准答案
            </label>
            <textarea
              value={standardAnswer}
              onChange={(e) => setStandardAnswer(e.target.value)}
              placeholder="贴上参考答案，模型会逐点比对缺失之处"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500 transition-all outline-none h-44 resize-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={!topic || !standardAnswer}
            className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-500 hover:opacity-90 disabled:from-slate-300 disabled:to-slate-300 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200/60 disabled:shadow-none"
          >
            开始检验
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  )
}

