import type { ReviewResult, UserInput } from '@/types/review'

export interface InsightRequest {
  cardTitle: string
  focus: string
  input: UserInput
  result: ReviewResult
}

export interface InsightResponse {
  summary: string
  actions: string[]
}

const DEFAULT_BASE_URL = 'https://api.siliconflow.cn/v1'
const DEFAULT_COMPLETIONS_PATH = '/chat/completions'
const MODEL_NAME =
  import.meta.env.VITE_SILICON_FLOW_MODEL ||
  import.meta.env.SILICON_FLOW_MODEL ||
  'Qwen/Qwen2.5-7B-Instruct'
const API_KEY =
  import.meta.env.VITE_SILICON_FLOW_API_KEY ||
  import.meta.env.SILICON_FLOW_API_KEY ||
  ''

const buildPrompt = ({ cardTitle, focus, input, result }: InsightRequest) => {
  return [
    '你是一个面试教练，基于用户的练习结果卡片给出简短提示。',
    `卡片标题: ${cardTitle}`,
    `关注点: ${focus}`,
    `主题: ${input.topic}`,
    `标准答案: ${input.standardAnswer}`,
    `转写: ${result.transcription}`,
    `准确度: ${result.accuracyScore}, 完整度: ${result.completenessScore}`,
    `缺失要点: ${result.missingKeyPoints.join('；') || '无'}`,
    `AI 反馈: ${result.constructiveFeedback}`,
    `改进建议: ${result.improvedAnswerSuggestion}`,
    "输出 JSON: { summary: '一句总览（<=80字）', actions: ['可执行建议1','可执行建议2'] }，不要使用 markdown，不要代码块。",
  ].join('\n')
}

export const fetchInsight = async (payload: InsightRequest): Promise<InsightResponse> => {
  if (!API_KEY) {
    throw new Error('缺少 SILICON_FLOW_API_KEY，请在 frontend/.env 配置后重试')
  }

  const endpoint = `${DEFAULT_BASE_URL}${DEFAULT_COMPLETIONS_PATH}`
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL_NAME,
      messages: [
        { role: 'system', content: 'You are a concise Chinese writing assistant.' },
        { role: 'user', content: buildPrompt(payload) },
      ],
      temperature: 0.35,
      top_p: 0.9,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`SiliconFlow error: ${response.status} ${errorText}`)
  }

  const data = await response.json()
  const content = data?.choices?.[0]?.message?.content
  const text = typeof content === 'string' ? content : ''
  try {
    return JSON.parse(text) as InsightResponse
  } catch {
    return {
      summary: text || '暂时无法生成提示，请稍后重试。',
      actions: [],
    }
  }
}

