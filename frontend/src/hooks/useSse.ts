/**
 * SSE客户端Hook（用于接收每日推荐）
 */

import { useEffect, useRef, useState } from 'react'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8121/api'

export interface SseMessage<T = unknown> {
  type?: string
  data?: T
  id?: number
  message?: string
}

export function useSse<T = unknown>(
  url: string,
  onMessage?: (data: T) => void
): { data: T[]; error: Error | null } {
  const [data, setData] = useState<T[]>([])
  const [error, setError] = useState<Error | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const receivedIdsRef = useRef<Set<number>>(new Set())

  useEffect(() => {
    const eventSource = new EventSource(`${API_BASE_URL}${url}`)
    eventSourceRef.current = eventSource

    eventSource.onmessage = (event) => {
      try {
        const raw =
          typeof event.data === 'string' ? JSON.parse(event.data) : event.data
        const messageData = raw as SseMessage<T>
        
        // 处理错误消息
        if (messageData.type === 'error') {
          console.error('SSE服务器错误:', messageData.message)
          setError(new Error(messageData.message || '服务器错误'))
          return
        }
        
        // 处理空消息
        if (messageData.type === 'empty') {
          console.info('SSE消息:', messageData.message)
          return
        }
        
        // 避免重复推送（记录已接收的ID）
        if (messageData.id && receivedIdsRef.current.has(messageData.id)) {
          return
        }
        
        if (messageData.id) {
          receivedIdsRef.current.add(messageData.id)
        }

        setData((prev) => [...prev, messageData.data ?? (raw as T)])
        if (onMessage) {
          onMessage(messageData.data ?? (raw as T))
        }
      } catch (err: unknown) {
        console.error('SSE消息解析失败:', err)
      }
    }

    eventSource.addEventListener('error', (event: MessageEvent) => {
      try {
        const raw =
          typeof event.data === 'string' ? JSON.parse(event.data) : event.data
        const messageData = raw as SseMessage<T>
        if (messageData.type === 'error') {
          console.error('SSE服务器错误:', messageData.message)
          setError(new Error(messageData.message || '服务器错误'))
        }
      } catch {
        // 忽略解析错误
      }
    })

    eventSource.onerror = () => {
      // console.error('SSE连接错误:', err)
      // 设置通用错误（如果还没有设置具体错误消息）
      setError((prevError) => prevError || new Error('SSE连接失败，请检查服务器状态'))
      // 自动重连（延迟重连，避免频繁请求）
      setTimeout(() => {
        if (eventSourceRef.current && eventSourceRef.current.readyState === EventSource.CLOSED) {
          eventSourceRef.current.close()
          // 重新创建连接
          const newEventSource = new EventSource(`${API_BASE_URL}${url}`)
          eventSourceRef.current = newEventSource
        }
      }, 5000)
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [url, onMessage])

  return { data, error }
}

