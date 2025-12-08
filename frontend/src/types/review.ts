export interface ReviewResult {
  transcription: string
  accuracyScore: number
  completenessScore: number
  missingKeyPoints: string[]
  constructiveFeedback: string
  improvedAnswerSuggestion: string
}

export const ReviewAppState = {
  IDLE: 'IDLE',
  RECORDING: 'RECORDING',
  PROCESSING: 'PROCESSING',
  RESULTS: 'RESULTS',
  ERROR: 'ERROR',
} as const

export type ReviewAppState = (typeof ReviewAppState)[keyof typeof ReviewAppState]

export interface UserInput {
  topic: string
  standardAnswer: string
}

