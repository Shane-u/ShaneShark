import { useState, useRef, useEffect } from 'react'
import { Mic, Square, RotateCcw, Send, Loader2 } from 'lucide-react'
import { transcribeWithHuggingFaceREST } from '@/services/asrService'

type SpeechRecognitionCtor = new () => {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: (event: FinalSpeechRecognitionEvent) => void
  onerror: (event: { error: string }) => void
  onend: () => void
  start: () => void
  stop: () => void
}
type SpeechRecognitionWindow = Window &
  Partial<{
    SpeechRecognition: SpeechRecognitionCtor
    webkitSpeechRecognition: SpeechRecognitionCtor
  }>

type FinalSpeechRecognitionResult = {
  isFinal: boolean
  [index: number]: { transcript?: string }
}

type FinalSpeechRecognitionEvent = {
  results: ArrayLike<FinalSpeechRecognitionResult>
}

interface Props {
  topic: string
  onTranscriptionReady: (text: string) => void
  onBack: () => void
}

export function ReviewAudioRecorder({ topic, onTranscriptionReady, onBack }: Props) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [transcript, setTranscript] = useState('')
  const [liveTranscript, setLiveTranscript] = useState('')
  const [isProcessingASR, setIsProcessingASR] = useState(false)
  const recognitionRef = useRef<InstanceType<SpeechRecognitionCtor> | null>(null)
  const timerRef = useRef<number | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const startRecording = async () => {
    try {
      // 1. 请求麦克风权限并开始录音
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4',
      })
      
      audioChunksRef.current = []
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        // 停止所有轨道
        stream.getTracks().forEach((track) => track.stop())
        
        // 使用 Hugging Face ASR 进行高精度识别
        if (audioChunksRef.current.length > 0) {
          setIsProcessingASR(true)
          const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType })
          
          const result = await transcribeWithHuggingFaceREST(audioBlob)
          if (result.error) {
            alert(`Hugging Face ASR 错误: ${result.error}`)
          } else if (result.text) {
            // 使用 Hugging Face 的高精度结果
            setTranscript((prev) => (prev ? `${prev} ${result.text}` : result.text))
          }
          
          setIsProcessingASR(false)
          audioChunksRef.current = []
        }
      }

      mediaRecorder.start()
      mediaRecorderRef.current = mediaRecorder

      // 2. 同时启动浏览器实时识别作为预览（可选）
      const speechWindow = window as SpeechRecognitionWindow
      const SpeechRecognition = speechWindow.webkitSpeechRecognition || speechWindow.SpeechRecognition
      
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        recognition.lang = 'zh-CN'
        recognition.continuous = true
        recognition.interimResults = true

        recognition.onresult = (event: FinalSpeechRecognitionEvent) => {
          const lastResult = event.results[event.results.length - 1]
          const text = lastResult?.[0]?.transcript?.trim() || ''
          if (!text) return

          if (lastResult.isFinal) {
            // 浏览器识别结果仅作为预览，不覆盖 Hugging Face 结果
            setLiveTranscript('')
          } else {
            // 中间结果实时显示预览
            setLiveTranscript(text)
          }
        }

        recognition.onerror = (event: { error: string }) => {
          console.warn('Browser speech recognition warning:', event.error)
          // 不阻断录音流程，仅警告
        }

        recognition.onend = () => {
          // 浏览器识别结束不影响录音
        }

        if (recognitionRef.current) {
          recognitionRef.current.stop()
        }

        recognition.start()
        recognitionRef.current = recognition
      }

      setIsRecording(true)
      setRecordingTime(0)

      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } catch (err) {
      console.error('Error starting recording:', err)
      alert('启动录音失败，请检查麦克风权限。')
    }
  }

  const stopRecording = () => {
    // 停止 MediaRecorder（会触发 onstop，调用 Hugging Face ASR）
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
    }
    
    // 停止浏览器实时识别
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    
    setIsRecording(false)
    setLiveTranscript('')
    
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
  }

  const handleReset = () => {
    setTranscript('')
    setRecordingTime(0)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (recognitionRef.current) recognitionRef.current.stop()
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
    }
  }, [])

  return (
    <div className="bg-white/90 dark:bg-slate-900/80 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 p-8 max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-200 text-xs font-semibold mb-3">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          检验复盘 · 语音转写
        </p>
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{topic}</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">可以直接说，也可以手动输入补充。</p>
      </div>

      <div className="bg-slate-50 dark:bg-slate-800/70 rounded-2xl p-6 mb-8 flex flex-col gap-4 min-h-[200px] border-2 border-dashed border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div className="text-slate-500 dark:text-slate-400 text-sm">实时识别 / 手动输入</div>
          {isRecording && (
            <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
              <span className="animate-pulse w-3 h-3 bg-red-500 rounded-full" />
              <span className="font-mono font-medium">{formatTime(recordingTime)}</span>
            </div>
          )}
        </div>
        <textarea
          className="bg-white dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-700 p-4 min-h-[160px] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder={
            isProcessingASR
              ? '正在使用 Hugging Face ASR 高精度识别...'
              : isRecording
                ? '正在录音（浏览器实时预览）...'
                : '你可以直接输入，或点击下方录音自动转文字'
          }
          value={liveTranscript ? `${transcript} ${liveTranscript}`.trim() : transcript}
          onChange={(e) => setTranscript(e.target.value)}
          inputMode={isRecording || isProcessingASR ? 'none' : 'text'}
          readOnly={isRecording || isProcessingASR}
          aria-label="语音转写文本框（录音时显示浏览器实时预览，停止后使用 Hugging Face ASR 高精度识别）"
        />
        {isProcessingASR && (
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-300 text-sm mt-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>使用 Hugging Face Whisper 模型进行高精度识别...</span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        {!isRecording && (
          <button
            onClick={startRecording}
            className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-full font-bold shadow-lg shadow-red-200 transition-all hover:scale-105"
          >
            <Mic className="w-5 h-5" /> 开始录音
          </button>
        )}

        {isRecording && (
          <button
            onClick={stopRecording}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-black text-white rounded-full font-bold shadow-lg transition-all"
          >
            <Square className="w-5 h-5 fill-current" /> 停止
          </button>
        )}

        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-full font-semibold transition-colors"
        >
          <RotateCcw className="w-5 h-5" /> 清空
        </button>
        <button
          onClick={() => onTranscriptionReady(transcript)}
          disabled={!transcript.trim()}
          className="flex items-center gap-2 px-7 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:text-slate-500 text-white rounded-full font-bold shadow-lg shadow-indigo-200 transition-all hover:scale-105 disabled:transform-none"
        >
          开始分析 <Send className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-6 text-center">
        <button onClick={onBack} className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline">
          更改主题
        </button>
      </div>
    </div>
  )
}

