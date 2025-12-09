export interface SandboxLanguage {
  id: string
  name: string
  version: string
  defaultCode: string
  monacoLanguage?: string
}

export interface SandboxExecutionRequest {
  code: string
  type: string
  stdin: string
  version: string
}

export interface SandboxExecutionResult {
  output: string
  code: number
  time: number
  message: string
}

export interface SandboxRunResponse {
  code: number
  data: SandboxExecutionResult
}

export interface SandboxHistoryItem {
  id: string
  timestamp: number
  language: string
  code: string
  output: string
  status: 'success' | 'error'
}

export type SandboxTab = 'output' | 'history' | 'ai'

export const SANDBOX_HISTORY_KEY = 'shaneshark_sandbox_history_v1'

export type SandboxEditorTheme = 'vs-dark' | 'vs'

export interface SandboxPersistedState {
  langId: string
  code: string
  stdin: string
  editorTheme: SandboxEditorTheme
}

export const SANDBOX_STATE_KEY = 'shaneshark_sandbox_state_v1'

