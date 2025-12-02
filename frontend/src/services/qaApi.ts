/**
 * QA知识库API服务
 */

import type { QaInfo, QaListResponse, QaQueryParams, QaAddRequest, QaUpdateRequest } from '@/types/qa'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8121/api'
const QA_BASE_URL = `${API_BASE_URL}/qa`
const QA_ADMIN_BASE_URL = `${QA_BASE_URL}/admin`

interface ApiResponse<T> {
  code: number
  data: T
  msg?: string
}

function ensureSuccess<T>(result: ApiResponse<T>, defaultMessage: string): T {
  if (result && (result.code === 0 || result.code === 200)) {
    return result.data
  }
  throw new Error(result?.msg || defaultMessage)
}

async function request<T>(input: RequestInfo | URL, init?: RequestInit, defaultMessage = '请求失败'): Promise<T> {
  // 确保所有请求都携带Cookie（用于Session认证）
  const requestInit: RequestInit = {
    ...init,
    credentials: 'include', // 跨域请求必须携带Cookie
  }
  const response = await fetch(input, requestInit)
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  const result = (await response.json()) as ApiResponse<T>
  return ensureSuccess(result, defaultMessage)
}

/**
 * 分页查询QA列表
 */
export async function getQaList(params: QaQueryParams): Promise<QaListResponse> {
  const queryParams = new URLSearchParams()
  if (params.current) queryParams.append('current', params.current.toString())
  if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString())
  if (params.tag) queryParams.append('tag', params.tag)

  const data = await request<QaListResponse>(
    `${QA_BASE_URL}/list?${queryParams.toString()}`,
    undefined,
    '获取QA列表失败'
  )

  return data || { records: [], total: 0, current: 1, size: 12 }
}

/**
 * 获取QA详情
 */
export async function getQaById(id: string): Promise<QaInfo> {
  return request<QaInfo>(`${QA_BASE_URL}/${id}`, undefined, '获取QA详情失败')
}

export async function loginQaAdmin(password: string): Promise<boolean> {
  return request<boolean>(
    `${QA_ADMIN_BASE_URL}/login`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ password }),
    },
    '管理员登录失败'
  )
}

/**
 * QA 管理员邮箱预检查：
 * - 如果邮箱已存在：返回 true（不会发送验证码）
 * - 如果邮箱不存在：发送验证码邮件并返回 false
 */
export async function checkQaAdminEmailOrSendCode(email: string): Promise<boolean> {
  return request<boolean>(
    `${QA_ADMIN_BASE_URL}/email/check-or-send?email=${encodeURIComponent(email)}`,
    {
      method: 'POST',
      credentials: 'include',
    },
    '邮箱预检查失败',
  )
}

/**
 * 使用邮箱 + 密码 + （可选）验证码注册或登录 QA 管理员。
 *
 * - 如果邮箱不存在：必须传验证码，验证成功后自动注册并登录
 * - 如果邮箱已存在：只校验邮箱 + 密码
 */
export async function loginOrRegisterQaAdminByEmail(params: {
  email: string
  password: string
  code?: string
}): Promise<boolean> {
  return request<boolean>(
    `${QA_ADMIN_BASE_URL}/email/register-or-login`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(params),
    },
    '邮箱登录失败',
  )
}

export async function logoutQaAdmin(): Promise<boolean> {
  return request<boolean>(
    `${QA_ADMIN_BASE_URL}/logout`,
    {
      method: 'POST',
      credentials: 'include',
    },
    '退出登录失败'
  )
}

export async function fetchAdminSession(): Promise<boolean> {
  return request<boolean>(
    `${QA_ADMIN_BASE_URL}/session`,
    {
      credentials: 'include',
    },
    '获取管理员状态失败'
  )
}

export async function getAdminQaList(params: QaQueryParams): Promise<QaListResponse> {
  const queryParams = new URLSearchParams()
  if (params.current) queryParams.append('current', params.current.toString())
  if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString())
  if (params.tag) queryParams.append('tag', params.tag)
  if (params.keyword) queryParams.append('keyword', params.keyword)
  if (typeof params.isHot === 'number') queryParams.append('isHot', params.isHot.toString())

  const data = await request<QaListResponse>(
    `${QA_ADMIN_BASE_URL}/list?${queryParams.toString()}`,
    {
      credentials: 'include',
    },
    '获取管理员 QA 列表失败'
  )
  return data || { records: [], total: 0, current: 1, size: 20 }
}

export async function getAdminQaById(id: string): Promise<QaInfo> {
  return request<QaInfo>(
    `${QA_ADMIN_BASE_URL}/${id}`,
    {
      credentials: 'include',
    },
    '获取 QA 详情失败'
  )
}

export async function createAdminQa(data: QaAddRequest): Promise<number> {
  return request<number>(
    QA_ADMIN_BASE_URL,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    },
    '创建 QA 失败'
  )
}

export async function updateAdminQa(id: string, data: QaUpdateRequest): Promise<boolean> {
  return request<boolean>(
    `${QA_ADMIN_BASE_URL}/${id}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    },
    '更新 QA 失败'
  )
}

export async function deleteAdminQa(id: string): Promise<boolean> {
  return request<boolean>(
    `${QA_ADMIN_BASE_URL}/${id}`,
    {
      method: 'DELETE',
      credentials: 'include',
    },
    '删除 QA 失败'
  )
}

