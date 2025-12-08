export interface ReviewResult {
  transcription: string
  accuracyScore: number
  completenessScore: number
  missingKeyPoints: string[]
  constructiveFeedback: string
  improvedAnswerSuggestion: string
}

export enum ReviewAppState {
  IDLE = 'IDLE',
  RECORDING = 'RECORDING',
  PROCESSING = 'PROCESSING',
  RESULTS = 'RESULTS',
  ERROR = 'ERROR',
}

export interface UserInput {
  topic: string
  standardAnswer: string
}

