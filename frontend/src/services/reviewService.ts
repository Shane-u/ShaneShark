import type { ReviewResult, UserInput } from '@/types/review'

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
const MAX_RETRIES = 3

const normalizeScore = (score: number): number => {
  if (score > 0 && score <= 1) return Math.round(score * 100)
  return Math.max(0, Math.min(100, Math.round(score)))
}

const extractJsonString = (raw: string): string => {
  const withoutFences = raw.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim()
  const firstBrace = withoutFences.indexOf('{')
  const lastBrace = withoutFences.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return withoutFences.slice(firstBrace, lastBrace + 1)
  }
  return withoutFences
}

export const analyzeSpokenAnswer = async (
  input: UserInput,
  transcription: string
): Promise<ReviewResult> => {
  if (!API_KEY) {
    throw new Error('缺少 SILICON_FLOW_API_KEY，请在 frontend/.env 配置后重试')
  }

  const endpoint = `${DEFAULT_BASE_URL}${DEFAULT_COMPLETIONS_PATH}`
  const messages = [
    {
      role: 'system',
      content:
        'You are an expert educational tutor and examiner. Analyze a student answer against the provided standard answer using the transcription text (do not ask the user to transcribe).' +
        'Tasks: (1) Score accuracy and completeness; (2) List ALL missing key points explicitly in `missingKeyPoints`; (3) Provide constructive feedback; (4) Provide an improved answer that naturally incorporates every missing key point.' +
        'Scoring MUST be integer percentage from 0 to 100 (e.g., 0-100, not decimals, not 0-1).' +
        'If nothing is missing, return an empty array for `missingKeyPoints` and keep the improved answer concise.' +
        'Return ONLY valid JSON with keys: transcription, accuracyScore, completenessScore, missingKeyPoints, constructiveFeedback, improvedAnswerSuggestion.' +
        'Use Simplified Chinese for feedback fields. Transcription should match user language.',
    },
    {
      role: 'user',
      content: `Topic/Question: "${input.topic}". Standard/Ideal Answer: "${input.standardAnswer}". Transcription: "${transcription}". Respond with the required JSON structure.`,
    },
  ]

  let lastError: unknown

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: MODEL_NAME,
          messages,
          temperature: 0.3,
          top_p: 0.9,
          stream: false,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`SiliconFlow error: ${response.status} ${errorText}`)
      }

      const data = await response.json()
      const content = data?.choices?.[0]?.message?.content
      const rawText =
        typeof content === 'string'
          ? content
          : Array.isArray(content)
            ? content.map((c: { text?: string }) => c?.text).filter(Boolean).join('\n')
            : ''

      if (!rawText) {
        throw new Error('无响应内容，请稍后重试')
      }

      const cleaned = extractJsonString(rawText)
      const parsed = JSON.parse(cleaned) as ReviewResult
      return {
        ...parsed,
        accuracyScore: normalizeScore(parsed.accuracyScore),
        completenessScore: normalizeScore(parsed.completenessScore),
      }
    } catch (error) {
      lastError = error
      if (attempt === MAX_RETRIES) break
    }
  }

  throw lastError instanceof Error ? lastError : new Error('未知错误，请稍后重试')
}

