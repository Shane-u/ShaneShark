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

export const analyzeCodeWithAi = async (code: string, language: string): Promise<string> => {
  if (!API_KEY) {
    throw new Error('缺少 SILICON_FLOW_API_KEY，请在 frontend/.env 配置后重试')
  }

  const endpoint = `${DEFAULT_BASE_URL}${DEFAULT_COMPLETIONS_PATH}`
  const messages = [
    {
      role: 'system',
      content:
        '你是一个资深的全栈代码审查员，请用简体中文返回分析结果。输出格式简洁，包含：\n' +
        '1) 代码做了什么（<=50字）；\n' +
        '2) 可能的 Bug 或边界风险（条目列出）；\n' +
        '3) 可执行的优化建议（条目列出，偏工程实践与性能/安全）；\n' +
        '4) 如果存在严重问题，给出修复方向。\n' +
        '不要使用 markdown 代码块，直接返回可读文本。',
    },
    {
      role: 'user',
      content: `语言: ${language}\n请审阅以下代码并给出反馈：\n${code}`,
    },
  ]

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL_NAME,
      messages,
      temperature: 0.35,
      top_p: 0.9,
      stream: false,
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`SiliconFlow error: ${response.status} ${text}`)
  }

  const data = await response.json()
  const content = data?.choices?.[0]?.message?.content
  if (typeof content === 'string') return content.trim()
  if (Array.isArray(content)) {
    const text = content.map((c: { text?: string }) => c?.text).filter(Boolean).join('\n')
    return text.trim()
  }
  return '未生成分析结果，请稍后重试。'
}

