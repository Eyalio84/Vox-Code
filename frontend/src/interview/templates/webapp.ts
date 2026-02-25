import type { InterviewTemplate } from '../types'

export const WEBAPP_TEMPLATE: InterviewTemplate = {
  domain: 'webapp',
  label: 'Web Application',
  sections: [
    {
      id: 'problem',
      name: 'The Problem Story',
      voxIntro: "Great, let's figure out what we're building. I'll ask you some questions.",
      voxIntroWav: 'interview_start',
      questions: [
        {
          id: 'problem',
          text: 'What problem does this application solve?',
          type: 'open',
          hint: 'Describe the pain point or need in a sentence or two.',
          required: true,
        },
        {
          id: 'persona',
          text: 'Who experiences this problem most?',
          type: 'open',
          hint: 'Think about the person who would use this daily.',
        },
        {
          id: 'current_solution',
          text: 'How do they solve it today?',
          type: 'open',
          hint: 'Spreadsheets? A competing app? Manual process?',
        },
        {
          id: 'domain_type',
          text: 'What kind of project is this?',
          type: 'constrained',
          options: [
            { value: 'webapp', label: 'Web App', description: 'A general-purpose web application' },
            {
              value: 'saas',
              label: 'SaaS',
              description: 'Subscription-based with auth, billing, multi-tenancy',
            },
            {
              value: 'game',
              label: 'Game',
              description: 'Interactive game with mechanics and progression',
            },
            {
              value: 'api',
              label: 'API / Backend',
              description: 'Headless API consumed by other services',
            },
            {
              value: 'data',
              label: 'Data Tool',
              description: 'Data visualization, dashboards, ML pipelines',
            },
            { value: 'other', label: 'Other', description: 'Something unique — tell me more later' },
          ],
          required: true,
        },
        {
          id: 'frustration',
          text: "What's frustrating about current solutions?",
          type: 'negative',
          hint: 'What makes users give up or complain?',
        },
        {
          id: 'one_thing',
          text: 'What is the ONE thing this app must do well?',
          type: 'open',
          hint: 'If it only did one thing perfectly, what would it be?',
          required: true,
        },
        {
          id: 'data_type',
          text: 'What data does this app work with?',
          type: 'open',
          hint: 'Tasks, users, products, messages, files...',
        },
        {
          id: 'constraints',
          text: 'Are there hard constraints — budget, timeline, specific tech?',
          type: 'open',
          hint: 'Leave blank if none.',
        },
        {
          id: 'deal_breaker',
          text: 'What would make users abandon this app?',
          type: 'negative',
        },
        {
          id: 'success_metric',
          text: 'How will you know this succeeded?',
          type: 'success',
          hint: 'Users doing X, Y% increase, positive feedback...',
        },
      ],
    },
    {
      id: 'experience',
      name: 'The Experience Story',
      voxIntro: "Now let's talk about how it should look and feel.",
      voxIntroWav: 'interview_section2',
      questions: [
        {
          id: 'mood_words',
          text: 'Describe the mood in 3 words.',
          type: 'open',
          hint: 'E.g. "calm, minimal, forgiving" or "bold, fast, energetic"',
        },
        {
          id: 'references',
          text: 'Name 2-3 apps or sites you love the feel of.',
          type: 'reference',
          hint: "Any app — doesn't have to be in the same category.",
        },
        {
          id: 'colors',
          text: 'What colors come to mind? Any to avoid?',
          type: 'open',
        },
        {
          id: 'platform',
          text: 'Desktop-first, mobile-first, or equal priority?',
          type: 'constrained',
          options: [
            { value: 'desktop', label: 'Desktop-first', description: 'Optimize for larger screens' },
            {
              value: 'mobile',
              label: 'Mobile-first',
              description: 'Optimize for phones and tablets',
            },
            { value: 'equal', label: 'Equal priority', description: 'Responsive from the start' },
          ],
        },
        {
          id: 'density',
          text: 'Minimal and clean, or feature-rich and dense?',
          type: 'constrained',
          options: [
            { value: 'minimal', label: 'Minimal', description: 'Clean, focused, few elements' },
            {
              value: 'balanced',
              label: 'Balanced',
              description: 'Practical with room to breathe',
            },
            {
              value: 'dense',
              label: 'Feature-rich',
              description: 'Information-dense, power-user focused',
            },
          ],
        },
        {
          id: 'color_mode',
          text: 'Dark mode, light mode, or both?',
          type: 'constrained',
          options: [
            { value: 'dark', label: 'Dark', description: 'Dark background, light text' },
            { value: 'light', label: 'Light', description: 'Light background, dark text' },
            { value: 'both', label: 'Both', description: 'System-aware or user toggle' },
          ],
        },
        {
          id: 'key_action',
          text: "What's the most important action a user takes?",
          type: 'reference',
          hint: 'The one thing they do most often.',
        },
        {
          id: 'not_like',
          text: 'What should this definitely NOT look or feel like?',
          type: 'negative',
          hint: 'Name apps, styles, or vibes to avoid.',
        },
        {
          id: 'branding',
          text: 'Any branding elements to incorporate?',
          type: 'open',
          hint: 'Logo, colors, fonts, existing brand guidelines. Skip if none.',
        },
        {
          id: 'anything_else',
          text: 'Anything else I should know?',
          type: 'open',
          hint: 'Last chance to add context before I start building.',
        },
      ],
    },
  ],
}
