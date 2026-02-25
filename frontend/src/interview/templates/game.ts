import type { InterviewTemplate } from '../types'

export const GAME_TEMPLATE: InterviewTemplate = {
  domain: 'game',
  label: 'Game',
  sections: [
    {
      id: 'player',
      name: 'The Player Story',
      voxIntro: "A game! Let's design something fun.",
      questions: [
        {
          id: 'concept',
          text: 'In one sentence, what is this game?',
          type: 'open',
          required: true,
        },
        {
          id: 'genre',
          text: 'What genre fits best?',
          type: 'constrained',
          options: [
            { value: 'puzzle', label: 'Puzzle', description: 'Brain teasers, logic, matching' },
            { value: 'action', label: 'Action', description: 'Reflexes, timing, combat' },
            {
              value: 'strategy',
              label: 'Strategy',
              description: 'Planning, resource management, tactics',
            },
            {
              value: 'simulation',
              label: 'Simulation',
              description: 'Building, managing, life-sim',
            },
          ],
        },
        {
          id: 'player_emotion',
          text: 'What emotion should the player feel most?',
          type: 'open',
          hint: 'Excitement? Relaxation? Curiosity? Tension?',
        },
        {
          id: 'core_loop',
          text: 'Describe the core game loop in 2-3 steps.',
          type: 'open',
          hint: 'E.g. "Explore → Collect → Build → Expand"',
          required: true,
        },
        {
          id: 'session_length',
          text: 'How long is a typical play session?',
          type: 'constrained',
          options: [
            { value: 'micro', label: '1-2 minutes', description: 'Quick pick-up-and-play' },
            { value: 'short', label: '5-15 minutes', description: 'Short focused sessions' },
            {
              value: 'medium',
              label: '15-60 minutes',
              description: 'Medium engagement sessions',
            },
            { value: 'long', label: '60+ minutes', description: 'Deep immersive sessions' },
          ],
        },
        {
          id: 'progression',
          text: 'How does the player progress?',
          type: 'constrained',
          options: [
            { value: 'levels', label: 'Levels', description: 'Linear level progression' },
            {
              value: 'xp',
              label: 'XP / Skills',
              description: 'Character or skill advancement',
            },
            {
              value: 'unlocks',
              label: 'Unlockables',
              description: 'New content, items, areas',
            },
            {
              value: 'none',
              label: 'No progression',
              description: 'Each session is standalone',
            },
          ],
        },
        {
          id: 'multiplayer',
          text: 'Single player, multiplayer, or both?',
          type: 'constrained',
          options: [
            { value: 'single', label: 'Single player', description: 'Solo experience' },
            {
              value: 'multi',
              label: 'Multiplayer',
              description: 'Real-time or turn-based with others',
            },
            { value: 'both', label: 'Both', description: 'Solo + multiplayer modes' },
          ],
        },
        {
          id: 'deal_breaker',
          text: 'What would make a player quit and never return?',
          type: 'negative',
        },
        {
          id: 'references',
          text: 'Name 2-3 games that inspire this one.',
          type: 'reference',
        },
        {
          id: 'success_metric',
          text: 'How do you know if the game is fun?',
          type: 'success',
        },
      ],
    },
    {
      id: 'mechanics',
      name: 'The Mechanics Story',
      voxIntro: "Now let's talk about the look and feel.",
      voxIntroWav: 'interview_section2',
      questions: [
        {
          id: 'art_style',
          text: 'What art style?',
          type: 'constrained',
          options: [
            {
              value: 'pixel',
              label: 'Pixel Art',
              description: 'Retro 8-bit / 16-bit aesthetic',
            },
            {
              value: 'flat',
              label: 'Flat / Minimal',
              description: 'Clean shapes, solid colors',
            },
            {
              value: 'cartoon',
              label: 'Cartoon',
              description: 'Playful, illustrated, vibrant',
            },
            {
              value: 'realistic',
              label: 'Stylized 3D',
              description: 'Modern 3D-like renders',
            },
          ],
        },
        {
          id: 'colors',
          text: 'What color palette fits the mood?',
          type: 'open',
        },
        {
          id: 'sound',
          text: 'What kind of music / sound?',
          type: 'open',
          hint: 'Chiptune? Ambient? Upbeat? None?',
        },
        {
          id: 'platform',
          text: 'Primary platform?',
          type: 'constrained',
          options: [
            {
              value: 'browser',
              label: 'Browser',
              description: 'Play in the browser, no install',
            },
            {
              value: 'mobile',
              label: 'Mobile',
              description: 'Touch-optimized for phones/tablets',
            },
            {
              value: 'desktop',
              label: 'Desktop',
              description: 'Keyboard + mouse focused',
            },
          ],
        },
        {
          id: 'controls',
          text: 'What are the controls?',
          type: 'open',
          hint: 'Click, drag, keyboard arrows, WASD, touch gestures...',
        },
        {
          id: 'ui_elements',
          text: 'What UI does the player always see?',
          type: 'open',
          hint: 'Score? Health bar? Inventory? Timer? Minimap?',
        },
        {
          id: 'tutorial',
          text: 'How does the player learn to play?',
          type: 'constrained',
          options: [
            {
              value: 'learn-by-doing',
              label: 'Learn by doing',
              description: 'Mechanics teach themselves through play',
            },
            {
              value: 'tutorial-level',
              label: 'Tutorial level',
              description: 'Dedicated introductory level',
            },
            {
              value: 'text-tips',
              label: 'Text tips',
              description: 'On-screen instructions and hints',
            },
          ],
        },
        {
          id: 'not_like',
          text: 'What should this game NOT feel like?',
          type: 'negative',
        },
        {
          id: 'special_feature',
          text: "What's the one feature that makes this game unique?",
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
