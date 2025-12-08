import { useState } from 'react'
import type { ReviewResult, UserInput } from '@/types/review'
import { CheckCircle, AlertTriangle, Lightbulb, BookOpen, Quote, RefreshCw, Sparkles, Loader2, X } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { fetchInsight, type InsightResponse } from '@/services/reviewInsightService'

interface Props {
  result: ReviewResult
  input: UserInput
  onReset: () => void
}

export function ReviewResultDisplay({ result, input, onReset }: Props) {
  const [insightOpen, setInsightOpen] = useState(false)
  const [insightLoading, setInsightLoading] = useState(false)
  const [insight, setInsight] = useState<InsightResponse | null>(null)
  const [insightError, setInsightError] = useState<string | null>(null)
  const [currentCard, setCurrentCard] = useState<string>('')

  const dataAccuracy = [
    { name: '准确度', value: result.accuracyScore },
    { name: '剩余', value: 100 - result.accuracyScore },
  ]
  const dataCompleteness = [
    { name: '完整度', value: result.completenessScore },
    { name: '剩余', value: 100 - result.completenessScore },
  ]

  const COLORS = {
    primary: '#4f46e5',
    secondary: '#e2e8f0',
    success: '#22c55e',
    warning: '#f59e0b',
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return COLORS.success
    if (score >= 60) return COLORS.warning
    return '#ef4444'
  }

  const openInsight = async (cardTitle: string, focus: string) => {
    setInsightOpen(true)
    setInsightError(null)
    setInsightLoading(true)
    setCurrentCard(cardTitle)
    try {
      const data = await fetchInsight({ cardTitle, focus, input, result })
      setInsight(data)
    } catch (err) {
      setInsightError(err instanceof Error ? err.message : '加载失败，请稍后重试')
    } finally {
      setInsightLoading(false)
    }
  }

  const closeInsight = () => {
    setInsightOpen(false)
    setInsightError(null)
    setInsight(null)
    setCurrentCard('')
  }

  const InsightButton = ({ onClick, className = '' }: { onClick: () => void; className?: string }) => (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-500 shadow-lg shadow-indigo-200/50 hover:scale-[1.02] transition-all ${className}`}
    >
      <Sparkles className="w-4 h-4" /> 智能解读
    </button>
  )

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 pb-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center p-6 gap-3">
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-100 mb-4">准确度评分</h3>
          <div className="h-40 w-full min-h-[160px] min-w-[200px]">
            <ResponsiveContainer width="100%" height="100%" minHeight={160}>
              <PieChart>
                <Pie
                  data={dataAccuracy}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  startAngle={90}
                  endAngle={-270}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell key="cell-0" fill={getScoreColor(result.accuracyScore)} />
                  <Cell key="cell-1" fill={COLORS.secondary} />
                </Pie>
                <text x="50%" y="50%" dy={8} textAnchor="middle" fill="#374151" className="text-3xl font-bold">
                  {result.accuracyScore}%
                </text>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 text-center">基于事实正确性</p>
          <InsightButton onClick={() => openInsight('准确度评分', '提升回答的精准性')} className="self-end" />
        </div>

        <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center p-6 gap-3">
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-100 mb-4">完整度评分</h3>
          <div className="h-40 w-full min-h-[160px] min-w-[200px]">
            <ResponsiveContainer width="100%" height="100%" minHeight={160}>
              <PieChart>
                <Pie
                  data={dataCompleteness}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  startAngle={90}
                  endAngle={-270}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell key="cell-0" fill={getScoreColor(result.completenessScore)} />
                  <Cell key="cell-1" fill={COLORS.secondary} />
                </Pie>
                <text x="50%" y="50%" dy={8} textAnchor="middle" fill="#374151" className="text-3xl font-bold">
                  {result.completenessScore}%
                </text>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 text-center">基于关键点覆盖率</p>
          <InsightButton onClick={() => openInsight('完整度评分', '补足遗漏的关键点')} className="self-end" />
        </div>
      </div>

      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="bg-slate-50 dark:bg-slate-800/80 px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-slate-800 dark:text-slate-50">AI 反馈</h3>
          </div>
          <InsightButton onClick={() => openInsight('AI 反馈', '理解整体改进方向')} />
        </div>
        <div className="p-6 text-slate-700 dark:text-slate-200 leading-relaxed">{result.constructiveFeedback}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-md border border-slate-100 dark:border-slate-800 p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-300">
              <Quote className="w-5 h-5" />
              <h3 className="font-bold">你的语音转写</h3>
            </div>
            <InsightButton onClick={() => openInsight('语音转写', '压缩表达、突出重点')} />
          </div>
          <p className="text-slate-600 dark:text-slate-200 text-sm italic leading-relaxed bg-slate-50 dark:bg-slate-800/70 p-4 rounded-lg border border-slate-100 dark:border-slate-700">
            "{result.transcription}"
          </p>
        </div>

        <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-md border border-slate-100 dark:border-slate-800 p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-green-600">
              <BookOpen className="w-5 h-5" />
              <h3 className="font-bold text-slate-800 dark:text-slate-50">标准答案</h3>
            </div>
            <InsightButton onClick={() => openInsight('标准答案', '确认覆盖全部关键点')} />
          </div>
          <p className="text-slate-600 dark:text-slate-200 text-sm leading-relaxed bg-slate-50 dark:bg-slate-800/70 p-4 rounded-lg border border-slate-100 dark:border-slate-700 h-full overflow-y-auto max-h-[220px]">
            {input.standardAnswer}
          </p>
        </div>
      </div>

      {result.missingKeyPoints.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-500/30 p-6">
          <div className="flex items-center gap-2 mb-4 text-red-700 dark:text-red-200">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-bold">缺失的关键点</h3>
          </div>
          <ul className="space-y-2">
            {result.missingKeyPoints.map((point, idx) => (
              <li key={idx} className="flex items-start gap-2 text-red-800 dark:text-red-100 text-sm">
                <span className="mt-1.5 w-1.5 h-1.5 bg-red-400 rounded-full flex-shrink-0" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="relative bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-500/30 p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2 text-indigo-800 dark:text-indigo-100">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            <h3 className="font-bold">改进后的回答建议</h3>
          </div>
          <InsightButton onClick={() => openInsight('改进后的回答建议', '生成更好的回答模板')} />
        </div>
        <p className="text-indigo-900 dark:text-indigo-100 text-sm leading-relaxed">
          {result.improvedAnswerSuggestion}
        </p>
      </div>

      <div className="flex justify-center pt-8">
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-8 py-3 bg-slate-900 hover:bg-black text-white rounded-xl font-medium shadow-lg transition-transform hover:-translate-y-1"
        >
          <RefreshCw className="w-4 h-4" /> 重新开始
        </button>
      </div>

      {insightOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-indigo-50 dark:border-slate-700">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                <div className="font-bold text-sm uppercase tracking-widest">智能解读</div>
                {currentCard && <span className="text-xs bg-white/20 px-2 py-1 rounded-full">{currentCard}</span>}
              </div>
              <button onClick={closeInsight} className="p-1 rounded hover:bg-white/20 transition-colors" aria-label="关闭">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {insightLoading && (
                <div className="flex flex-col items-center justify-center gap-3 text-indigo-600 dark:text-indigo-200">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <p className="text-sm">正在生成提示，请稍候...</p>
                </div>
              )}

              {!insightLoading && insightError && (
                <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-200 border border-red-100 dark:border-red-500/30 rounded-xl p-4 text-sm">
                  {insightError}
                </div>
              )}

              {!insightLoading && !insightError && insight && (
                <>
                  <div className="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-500/30 rounded-xl p-4 text-indigo-900 dark:text-indigo-100 text-sm leading-relaxed">
                    {insight.summary || '暂无摘要'}
                  </div>
                  {insight.actions?.length > 0 && (
                    <div className="space-y-2">
                      {insight.actions.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2 bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-700 dark:text-slate-200"
                        >
                          <span className="mt-1 h-2 w-2 rounded-full bg-indigo-500 flex-shrink-0" />
                          {item}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

