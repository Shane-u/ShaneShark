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

        // 确保ID字段转换为字符串，避免精度丢失
        // 重要：在JSON.parse之前，大数字可能已经丢失精度
        // 所以我们需要直接从原始字符串中提取ID
        const processedData = messageData.data ?? (raw as T)
        
        if (processedData && typeof processedData === 'object' && 'id' in processedData) {
          let idValue = processedData.id
          
          // 如果ID是数字且超过安全整数范围，尝试从原始JSON字符串恢复
          if (typeof idValue === 'number' && idValue > Number.MAX_SAFE_INTEGER) {
            try {
              // 从原始event.data中提取完整的ID
              const rawStr = typeof event.data === 'string' ? event.data : JSON.stringify(raw)
              // 使用正则表达式提取ID，避免JSON.parse的精度丢失
              const idMatch = rawStr.match(/"id"\s*:\s*(\d+)/)
              if (idMatch && idMatch[1]) {
                idValue = idMatch[1] // 保持为字符串
              } else {
                idValue = String(idValue)
              }
            } catch {
              idValue = String(idValue)
            }
          } else if (typeof idValue === 'number') {
            idValue = String(idValue)
          } else if (typeof idValue === 'bigint') {
            idValue = String(idValue)
          } else {
            idValue = String(idValue || '')
          }
          
          const dataWithStringId = { ...processedData, id: idValue } as T
          setData((prev) => [...prev, dataWithStringId])
          if (onMessage) {
            onMessage(dataWithStringId)
          }
        } else {
          setData((prev) => [...prev, processedData])
          if (onMessage) {
            onMessage(processedData)
          }
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

