import type { InterviewTemplate } from '../types'

export const SAAS_TEMPLATE: InterviewTemplate = {
  domain: 'saas',
  label: 'SaaS Application',
  sections: [
    {
      id: 'problem',
      name: 'The Problem Story',
      voxIntro: "SaaS it is! Let's define your product.",
      questions: [
        {
          id: 'problem',
          text: 'What problem does this SaaS solve?',
          type: 'open',
          required: true,
        },
        {
          id: 'persona',
          text: 'Who is your target customer? Individual or team?',
          type: 'open',
        },
        {
          id: 'current_solution',
          text: 'What are they using today instead?',
          type: 'open',
        },
        {
          id: 'auth_model',
          text: 'How should users sign in?',
          type: 'constrained',
          options: [
            {
              value: 'email',
              label: 'Email + Password',
              description: 'Traditional email/password auth',
            },
            { value: 'oauth', label: 'Social Login', description: 'Google, GitHub, etc.' },
            { value: 'both', label: 'Both', description: 'Email + social options' },
            {
              value: 'magic-link',
              label: 'Magic Link',
              description: 'Passwordless email login',
            },
          ],
        },
        {
          id: 'multi_tenant',
          text: 'Is this multi-tenant? (teams/orgs with separate data)',
          type: 'constrained',
          options: [
            {
              value: 'single',
              label: 'Single user',
              description: 'Each account is independent',
            },
            {
              value: 'team',
              label: 'Team-based',
              description: 'Users belong to teams/orgs',
            },
            { value: 'both', label: 'Both', description: 'Personal + team accounts' },
          ],
        },
        {
          id: 'billing',
          text: 'What pricing model?',
          type: 'constrained',
          options: [
            { value: 'free', label: 'Free', description: 'No payment needed' },
            {
              value: 'freemium',
              label: 'Freemium',
              description: 'Free tier + paid upgrades',
            },
            {
              value: 'subscription',
              label: 'Subscription',
              description: 'Monthly/yearly plans',
            },
            {
              value: 'usage',
              label: 'Usage-based',
              description: 'Pay per use (API calls, storage, etc.)',
            },
          ],
        },
        {
          id: 'one_thing',
          text: 'What is the ONE feature that makes users pay?',
          type: 'open',
          required: true,
        },
        {
          id: 'data_type',
          text: 'What data does it store and manage?',
          type: 'open',
        },
        {
          id: 'deal_breaker',
          text: 'What would make users churn?',
          type: 'negative',
        },
        {
          id: 'success_metric',
          text: 'What metric defines success? (MRR, DAU, retention...)',
          type: 'success',
        },
      ],
    },
    {
      id: 'experience',
      name: 'The Experience Story',
      voxIntro: "Now let's design the experience.",
      voxIntroWav: 'interview_section2',
      questions: [
        {
          id: 'mood_words',
          text: 'Describe the product personality in 3 words.',
          type: 'open',
        },
        {
          id: 'references',
          text: 'Name 2-3 SaaS products you admire the UX of.',
          type: 'reference',
        },
        {
          id: 'dashboard',
          text: 'Does the user need a dashboard? What goes on it?',
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
          text: 'What does the user do in their first 60 seconds?',
          type: 'reference',
        },
        {
          id: 'onboarding',
          text: 'Should there be a setup wizard or guided onboarding?',
          type: 'constrained',
          options: [
            {
              value: 'wizard',
              label: 'Setup wizard',
              description: 'Step-by-step guided setup',
            },
            {
              value: 'inline',
              label: 'Inline tips',
              description: 'Contextual hints as they explore',
            },
            {
              value: 'none',
              label: 'None',
              description: 'Drop them in — self-explanatory UI',
            },
          ],
        },
        {
          id: 'not_like',
          text: 'What SaaS products should this NOT feel like?',
          type: 'negative',
        },
        {
          id: 'branding',
          text: 'Any existing branding to incorporate?',
          type: 'open',
        },
        {
          id: 'anything_else',
          text: 'Anything else I should know?',
          type: 'open',
        },
      ],
    },
  ],
}
