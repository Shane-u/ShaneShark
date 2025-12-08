/**
 * Hugging Face ASR 语音识别服务
 * 使用 Hugging Face Inference API 调用 Whisper 模型进行高精度语音转文字
 * 参考: https://huggingface.co/tasks/automatic-speech-recognition
 */

const HF_API_TOKEN = import.meta.env.VITE_HUGGINGFACE_API_TOKEN || ''
const HF_MODEL = import.meta.env.VITE_HUGGINGFACE_ASR_MODEL || 'openai/whisper-large-v3'
const HF_API_BASE =
  import.meta.env.VITE_HF_PROXY_BASE_URL ||
  (import.meta.env.DEV ? '/hf-api' : 'https://router.huggingface.co')

export interface ASRResult {
  text: string
  error?: string
}

/**
 * 使用 Hugging Face Inference API 进行语音识别
 * @param audioBlob 录音的音频 Blob (支持 webm, wav, mp3 等格式)
 * @returns 转写文本
 */
export async function transcribeWithHuggingFace(audioBlob: Blob): Promise<ASRResult> {
  if (!HF_API_TOKEN) {
    return {
      text: '',
      error: '缺少 VITE_HUGGINGFACE_API_TOKEN，请在 frontend/.env 或 /root/envFiles/.env 配置后重试（生产环境需在构建时注入）',
    }
  }

  try {
    // 动态导入 @huggingface/inference 避免 SSR 问题
    const { HfInference } = await import('@huggingface/inference')
    const hf = new HfInference(HF_API_TOKEN)

    // 调用 ASR API
    const result = await hf.automaticSpeechRecognition({
      model: HF_MODEL,
      data: audioBlob,
    })

    return {
      text: result.text || '',
    }
  } catch (error) {
    console.error('Hugging Face ASR error:', error)
    return {
      text: '',
      error: error instanceof Error ? error.message : '语音识别失败，请稍后重试',
    }
  }
}

/**
 * 使用 Hugging Face Inference API (REST 方式，无需安装包)
 * 备选方案：如果不想安装 @huggingface/inference，可以使用此方法
 */
export async function transcribeWithHuggingFaceREST(audioBlob: Blob): Promise<ASRResult> {
  if (!HF_API_TOKEN) {
    return {
      text: '',
      error: '缺少 VITE_HUGGINGFACE_API_TOKEN，请在 frontend/.env 或 /root/envFiles/.env 配置后重试（生产环境需在构建时注入）',
    }
  }

  try {
    // router.huggingface.co 使用 /hf-inference/models/{model} 路径
    const API_URL = `${HF_API_BASE.replace(/\/$/, '')}/hf-inference/models/${HF_MODEL}`
    const contentType = audioBlob.type || 'audio/webm'
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${HF_API_TOKEN}`,
        'Content-Type': contentType,
      },
      body: audioBlob,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Hugging Face API error: ${response.status} ${errorText}`)
    }

    const data = (await response.json()) as { text?: string }
    return {
      text: data.text || '',
    }
  } catch (error) {
    console.error('Hugging Face ASR REST error:', error)
    const message = error instanceof Error ? error.message : '语音识别失败，请稍后重试'

    const isCors = message.includes('Failed to fetch') || message.toLowerCase().includes('cors')
    const isDeprecated = message.includes('api-inference.huggingface.co') || message.includes('410')
    const isNotFound = message.includes('404')

    return {
      text: '',
      error: isDeprecated
        ? 'Hugging Face 410：请改用 router.huggingface.co 或设置 VITE_HF_PROXY_BASE_URL 指向代理。'
        : isNotFound
          ? `Hugging Face 404：模型 ${HF_MODEL} 未找到或鉴权不足，请确认 VITE_HUGGINGFACE_API_TOKEN 拥有访问权限，或在 .env 中设置正确的 VITE_HUGGINGFACE_ASR_MODEL。`
        : isCors
          ? '无法连接 Hugging Face，请在前端开发环境启用 /hf-api 代理或在部署端配置反向代理，并确认已设置 VITE_HUGGINGFACE_API_TOKEN。'
          : message,
    }
  }
}

