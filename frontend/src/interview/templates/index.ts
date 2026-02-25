import type { InterviewTemplate } from '../types'
import { WEBAPP_TEMPLATE } from './webapp'
import { SAAS_TEMPLATE } from './saas'
import { GAME_TEMPLATE } from './game'

export const TEMPLATES: Record<string, InterviewTemplate> = {
  webapp: WEBAPP_TEMPLATE,
  saas: SAAS_TEMPLATE,
  game: GAME_TEMPLATE,
}

export function getTemplate(domain: string): InterviewTemplate {
  return TEMPLATES[domain] || WEBAPP_TEMPLATE
}

export { WEBAPP_TEMPLATE, SAAS_TEMPLATE, GAME_TEMPLATE }
