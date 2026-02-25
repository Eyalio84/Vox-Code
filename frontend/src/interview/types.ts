export type QuestionType = 'open' | 'constrained' | 'reference' | 'negative' | 'success'

export interface QuestionOption {
  value: string
  label: string
  description: string
}

export interface InterviewQuestion {
  id: string
  text: string
  type: QuestionType
  hint?: string
  options?: QuestionOption[]
  required?: boolean
  voxWav?: string
}

export interface InterviewSection {
  id: string
  name: string
  voxIntro: string
  voxIntroWav?: string
  questions: InterviewQuestion[]
}

export interface InterviewTemplate {
  domain: string
  label: string
  sections: InterviewSection[]
}

export interface InterviewAnswers {
  [questionId: string]: string
}
