import type { SandboxExecutionRequest, SandboxRunResponse } from '@/types/sandbox'

const FALLBACK_ENDPOINT = 'https://rapi.xjq.icu/code/run'
const RUN_API =
  import.meta.env.VITE_SANDBOX_RUN_API ||
  import.meta.env.VITE_CODE_RUN_API ||
  FALLBACK_ENDPOINT

export const runSandboxCode = async (payload: SandboxExecutionRequest): Promise<SandboxRunResponse> => {
  try {
    const response = await fetch(RUN_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(`Code run API failed: ${response.status}`)
    }

    const data = (await response.json()) as SandboxRunResponse
    return data
  } catch (error) {
    console.error('Sandbox execution error:', error)
    return {
      code: -1,
      data: {
        output: '',
        code: -1,
        time: 0,
        message: error instanceof Error ? error.message : '未知错误，请稍后重试',
      },
    }
  }
}

