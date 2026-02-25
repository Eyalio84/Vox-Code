# UI Animations Expert Tools Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add 11 UI animation domain tools to the Expert drawer organized by 4 capability groups.

**Architecture:** Single domain file (`animations.ts`) exports `ANIMATIONS_TOOLS` array with 11 `ToolEntry` objects. Registry imports and dedup merges them. No agents for this domain.

**Tech Stack:** TypeScript, existing ToolEntry type system, registry helpers

**Prerequisite:** site-dev plan Tasks 1-5 must be implemented first.

---

### Task 1: Create `frontend/src/tools/domains/animations.ts`

**Files:**
- Create: `frontend/src/tools/domains/animations.ts`

**Step 1: Create the domain file with all 11 tool entries**

```typescript
// frontend/src/tools/domains/animations.ts
import type { ToolEntry } from '../types'

export const ANIMATIONS_TOOLS: ToolEntry[] = [
  // ── Animation Engines (4) ─────────────────────────────────────
  {
    id: 'anim-motion',
    name: 'Motion',
    description: 'Declarative React animation — layout, exit, gesture, scroll-linked, spring physics. 30.7K stars. Formerly Framer Motion.',
    category: 'framework',
    level: 'expert',
    side: 'frontend',
    domains: ['animations'],
    themes: ['expert'],
    packages: { npm: 'motion' },
    group: 'Animation Engines',
    integrationPrompt: `Integrate Motion (formerly Framer Motion) for declarative React animations.
- Install \`npm install motion\`.
- Create \`frontend/src/animations/motion-variants.ts\` with:
  - Page transition variants: fadeIn, slideUp, slideLeft with stagger children
  - Component variants: hover (scale 1.05), tap (scale 0.95), focus (ring)
  - List variants: staggered entry/exit for dynamic lists
  - Spring configs: gentle (stiffness 120, damping 14), bouncy (stiffness 300, damping 10)
- Create \`frontend/src/components/AnimatedPage.tsx\` with:
  - motion.div wrapper with page transition variants
  - AnimatePresence for exit animations on route change
  - Layout animation for shared element transitions between pages
- Create \`frontend/src/components/AnimatedList.tsx\` with:
  - AnimatePresence mode="popLayout" for list item add/remove
  - Reorder.Group + Reorder.Item for drag-to-reorder with animation
  - useInView for scroll-triggered entry animations
- Create \`frontend/src/components/GestureCard.tsx\` with:
  - whileHover, whileTap, whileFocus for micro-interactions
  - drag with dragConstraints for draggable elements
  - useMotionValue + useTransform for parallax effects
- Create \`frontend/src/hooks/useScrollAnimation.ts\` with:
  - useScroll for scroll progress tracking
  - useTransform for scroll-linked property changes (opacity, y, scale)
  - Scroll-triggered animations with viewport intersection
- Motion is the most complete React animation library — prefer it for most use cases.
- Use CSS variables from the active theme for animated color transitions.`,
  },
  {
    id: 'anim-gsap',
    name: 'GSAP',
    description: 'Professional timeline engine — ScrollTrigger, Draggable, MorphSVG, SplitText plugins. 23.6K stars.',
    category: 'framework',
    level: 'expert',
    side: 'frontend',
    domains: ['animations'],
    themes: ['expert'],
    packages: { npm: 'gsap' },
    group: 'Animation Engines',
    integrationPrompt: `Integrate advanced GSAP features (GSAP base is already in the project).
- GSAP is already installed. Register additional plugins:
  \`gsap.registerPlugin(ScrollTrigger, Draggable, SplitText)\`
- Create \`frontend/src/animations/gsap-timelines.ts\` with:
  - Page entrance timeline: staggered element reveals (title, subtitle, content, CTA)
  - Hero animation: parallax layers with depth scaling
  - Text reveal: SplitText → character-by-character animation
  - Morph animation: SVG path morphing between states
- Create \`frontend/src/animations/scroll-animations.ts\` with:
  - ScrollTrigger pin sections: element stays fixed during scroll range
  - Parallax scrolling: different speeds for foreground/background layers
  - Progress-linked animation: animation scrubs with scroll position
  - Horizontal scroll section: sideways scroll triggered by vertical scroll
  - Snap scrolling: snap to section boundaries
- Create \`frontend/src/components/ScrollSection.tsx\` with:
  - React component with useGSAP hook for cleanup
  - ScrollTrigger setup with start/end markers
  - Responsive: different triggers for mobile vs desktop
- Create \`frontend/src/components/DraggableElement.tsx\` with:
  - Draggable.create() with bounds, snap-to-grid, momentum
  - Throw props for momentum-based movement after release
  - onDragEnd callback for position persistence
- IMPORTANT: Always use gsap.context() or useGSAP() in React for proper cleanup.
- Use CSS variables from the active theme for animated properties.`,
  },
  {
    id: 'anim-react-spring',
    name: 'react-spring',
    description: 'Spring-physics hooks — useSpring, useTrail, useTransition, useChain. Natural, physics-based feel. 28K stars.',
    category: 'framework',
    level: 'expert',
    side: 'frontend',
    domains: ['animations'],
    themes: ['expert'],
    packages: { npm: '@react-spring/web' },
    group: 'Animation Engines',
    integrationPrompt: `Integrate react-spring for physics-based animations.
- Install \`npm install @react-spring/web\`.
- Create \`frontend/src/animations/spring-configs.ts\` with:
  - Spring presets: gentle, wobbly, stiff, slow, molasses
  - Custom configs: { mass, tension, friction, clamp, velocity }
  - Common transitions: fadeIn, slideUp, scaleIn with spring configs
- Create \`frontend/src/components/SpringTransition.tsx\` with:
  - useTransition for mount/unmount animations
  - List item transitions with keys for add/remove
  - Trail effect: staggered animation for lists
- Create \`frontend/src/components/SpringCard.tsx\` with:
  - useSpring for hover/tap micro-interactions
  - 3D card tilt: transform rotateX/Y based on mouse position
  - Flip animation: front/back card with spring interpolation
- Create \`frontend/src/hooks/useSpringScroll.ts\` with:
  - useSpring driven by scroll events
  - Parallax: useParallax from @react-spring/parallax
  - Gesture-driven: useDrag from @use-gesture/react paired with springs
- react-spring animations feel natural because they use real physics (mass + tension + friction).
- Best for: fluid UI that responds to user interaction with a physical feel.
- Use CSS variables from the active theme for spring-animated colors.`,
  },
  {
    id: 'anim-animejs',
    name: 'Anime.js v4',
    description: 'Lightweight ESM-first animation engine — tree-shakeable, 53K stars, v4 complete rewrite.',
    category: 'library',
    level: 'expert',
    side: 'frontend',
    domains: ['animations'],
    themes: ['expert'],
    packages: { npm: 'animejs' },
    group: 'Animation Engines',
    integrationPrompt: `Integrate Anime.js v4 for lightweight animations.
- Install \`npm install animejs\`.
- Create \`frontend/src/animations/anime-effects.ts\` with:
  - Text animation: letter-by-letter reveal using targets with delay stagger
  - SVG path drawing: strokeDashoffset animation for line-draw effect
  - Morphing: animate between SVG path data
  - Stagger grid: animate grid items with stagger({ grid: [rows, cols], from: 'center' })
- Create \`frontend/src/components/AnimeText.tsx\` with:
  - Split text into spans for individual letter targeting
  - Entry animation: staggered translateY + opacity
  - Hover effect: wave animation across letters
  - Cleanup: animation.pause() on unmount
- Create \`frontend/src/hooks/useAnime.ts\` with:
  - React hook wrapping anime() with ref targeting
  - Auto-cleanup on unmount (pause + remove)
  - Play/pause/restart controls
  - Timeline chaining for sequenced animations
- Anime.js v4 is ESM-first and tree-shakeable — import only what you need.
- Best for: lightweight animation needs without a full framework.
- Use CSS variables from the active theme for animated color values.`,
  },

  // ── Scroll & Reveal (3) ───────────────────────────────────────
  {
    id: 'anim-aos',
    name: 'AOS',
    description: 'CSS class injection on scroll — the simplest scroll reveal library. 27K stars.',
    category: 'library',
    level: 'expert',
    side: 'frontend',
    domains: ['animations'],
    themes: ['expert'],
    packages: { npm: 'aos' },
    group: 'Scroll & Reveal',
    integrationPrompt: `Integrate AOS for simple scroll reveal animations.
- Install \`npm install aos\` and \`npm install -D @types/aos\`.
- Create \`frontend/src/animations/aos-init.ts\` with:
  - AOS.init() configuration: duration, easing, once (animate once vs every scroll), offset
  - Call on app mount: AOS.init({ duration: 800, easing: 'ease-out-cubic', once: true })
  - Refresh on dynamic content: AOS.refresh() after data loads
- Apply data attributes to elements that should animate on scroll:
  - \`data-aos="fade-up"\` — fade in while sliding up
  - \`data-aos="fade-left"\` — fade in from the left
  - \`data-aos="zoom-in"\` — scale up from small
  - \`data-aos-delay="200"\` — stagger by adding incremental delays
  - \`data-aos-anchor=".section"\` — trigger based on another element's position
- Import AOS CSS: \`import 'aos/dist/aos.css'\`.
- AOS is the simplest option — data attributes only, no JavaScript animation code.
- Best for: marketing pages, landing pages, content-heavy pages.
- Use CSS variables from the active theme for any custom AOS animation overrides.`,
  },
  {
    id: 'anim-taos',
    name: 'TAOS',
    description: 'Tailwind scroll-triggered reveal animations — 600 bytes, no JS, pure CSS with data attributes.',
    category: 'library',
    level: 'expert',
    side: 'frontend',
    domains: ['animations'],
    themes: ['expert'],
    packages: { npm: 'taos' },
    group: 'Scroll & Reveal',
    integrationPrompt: `Integrate TAOS for Tailwind-native scroll reveal.
- Install \`npm install taos\`.
- Add to tailwind.config.ts plugins:
  \`plugins: [require('taos/plugin')]\`
- Add \`safelist\` for TAOS classes:
  \`safelist: ['taos:translate-y-8', 'taos:opacity-0', ...]\`
- Apply TAOS animations to elements:
  - \`className="taos:translate-y-8 taos:opacity-0"\` — slide up + fade in on scroll
  - \`className="taos:scale-90 taos:opacity-0"\` — zoom in on scroll
  - \`data-taos-offset="200"\` — trigger 200px before element enters viewport
- TAOS uses CSS scroll-driven animations — NO JavaScript at all.
- 600 bytes total — the smallest scroll animation solution.
- Best for: Tailwind projects that want scroll reveals without adding JS dependencies.
- Works with server-side rendering (RSC compatible).`,
  },
  {
    id: 'anim-auto-animate',
    name: 'AutoAnimate',
    description: 'Single hook animates DOM mutations automatically — ~2KB, zero config. 13K stars.',
    category: 'library',
    level: 'expert',
    side: 'frontend',
    domains: ['animations'],
    themes: ['expert'],
    packages: { npm: '@formkit/auto-animate' },
    group: 'Scroll & Reveal',
    integrationPrompt: `Integrate AutoAnimate for automatic DOM mutation animations.
- Install \`npm install @formkit/auto-animate\`.
- Create \`frontend/src/hooks/useAutoAnimate.ts\` (if not already present) with:
  - Import: \`import { useAutoAnimate } from '@formkit/auto-animate/react'\`
  - Usage: \`const [parent] = useAutoAnimate()\` — attach ref to container
- Apply to dynamic lists:
  - Todo list: items animate in/out as added/removed
  - Search results: results animate as filter changes
  - Accordion: content animates on expand/collapse
  - Tab panels: content cross-fades on tab switch
- Configuration options:
  - Duration: \`useAutoAnimate({ duration: 300 })\`
  - Easing: \`useAutoAnimate({ easing: 'ease-in-out' })\`
  - Custom: pass a function for per-element animation control
- AutoAnimate detects: additions, removals, and moves in child elements.
- ~2KB, zero config — the simplest way to add list/content animations.
- Best for: dynamic content where items change frequently (lists, grids, filters).`,
  },

  // ── CSS & Tailwind (2) ────────────────────────────────────────
  {
    id: 'anim-tw-motion',
    name: 'tailwindcss-motion',
    description: 'Tailwind plugin for motion-* utility classes — pure CSS, no runtime JS, RSC compatible.',
    category: 'library',
    level: 'expert',
    side: 'frontend',
    domains: ['animations'],
    themes: ['expert'],
    packages: { npm: 'tailwindcss-motion' },
    group: 'CSS & Tailwind',
    integrationPrompt: `Integrate tailwindcss-motion for CSS-only animations.
- Install \`npm install tailwindcss-motion\`.
- Add to tailwind.config.ts plugins:
  \`plugins: [require('tailwindcss-motion')]\`
- Apply motion utilities to elements:
  - \`className="motion-preset-fade-in"\` — fade in on mount
  - \`className="motion-preset-slide-up"\` — slide up on mount
  - \`className="motion-preset-bounce"\` — bounce effect
  - \`className="motion-delay-200"\` — delay animation start
  - \`className="motion-duration-500"\` — custom duration
- Compose animations:
  - \`className="motion-preset-fade-in motion-preset-slide-up motion-delay-100"\`
  - Stagger: increment motion-delay on list items (100, 200, 300...)
- tailwindcss-motion generates pure CSS @keyframes — zero runtime JavaScript.
- RSC compatible: works with React Server Components.
- Best for: entry animations, micro-interactions, hover effects using only Tailwind classes.`,
  },
  {
    id: 'anim-motion-one',
    name: 'Motion One',
    description: 'Framework-agnostic animation using native Web Animations API — zero framework coupling.',
    category: 'library',
    level: 'expert',
    side: 'frontend',
    domains: ['animations'],
    themes: ['expert'],
    packages: { npm: 'motion' },
    group: 'CSS & Tailwind',
    integrationPrompt: `Integrate Motion One for framework-agnostic Web Animations API.
- Motion One is part of the \`motion\` package (same as Motion/Framer Motion).
- Import the vanilla subset: \`import { animate, scroll, inView } from 'motion'\`
- Create \`frontend/src/animations/motion-one-utils.ts\` with:
  - animate(): directly animate any DOM element
    \`animate(element, { opacity: [0, 1], y: [20, 0] }, { duration: 0.5 })\`
  - scroll(): link animation to scroll progress
    \`scroll(animate(element, { opacity: [0, 1] }), { target: element })\`
  - inView(): trigger animation when element enters viewport
    \`inView(element, () => { animate(element, { opacity: 1 }) })\`
  - stagger(): stagger animation across multiple elements
    \`animate('.item', { opacity: 1 }, { delay: stagger(0.1) })\`
- Motion One uses the native Web Animations API — smallest bundle, best performance.
- Framework-agnostic: works with React, Vue, Svelte, vanilla JS.
- Note: shares npm package with Motion (Framer Motion). Both can coexist.
- Best for: simple animations that don't need React component integration.`,
  },

  // ── Designer Tools (2) ────────────────────────────────────────
  {
    id: 'anim-lottie',
    name: 'Lottie React',
    description: 'After Effects animations at runtime via WASM — .lottie format 80% smaller than JSON, scroll-sync.',
    category: 'library',
    level: 'expert',
    side: 'frontend',
    domains: ['animations'],
    themes: ['expert'],
    packages: { npm: '@lottiefiles/dotlottie-react' },
    group: 'Designer Tools',
    integrationPrompt: `Integrate Lottie for After Effects animations in React.
- Install \`npm install @lottiefiles/dotlottie-react\`.
- Create \`frontend/src/components/LottieAnimation.tsx\` with:
  - DotLottieReact component with src (URL or local .lottie file)
  - Props: autoplay, loop, speed, direction
  - Playback controls: play(), pause(), stop(), setFrame()
  - Event handlers: onComplete, onLoopComplete, onEnterFrame
- Create \`frontend/src/components/LottieScroll.tsx\` with:
  - Scroll-synced Lottie: animation progress tied to scroll position
  - useScroll (from Motion) or IntersectionObserver for scroll tracking
  - setFrame(scrollProgress * totalFrames) for scrubbing
- Create \`frontend/src/components/LottieLoader.tsx\` with:
  - Loading animation displayed during data fetches
  - Success/error state animations with smooth transitions
  - Brand-consistent loading experience
- Get .lottie files from:
  - LottieFiles.com marketplace (free + premium)
  - Export from After Effects with Bodymovin plugin
  - Create in LottieFiles editor (web-based)
- .lottie format is 80% smaller than .json Lottie files and uses WASM renderer.
- Use CSS variables from the active theme for Lottie container sizing/positioning.`,
  },
  {
    id: 'anim-theatre',
    name: 'Theatre.js',
    description: 'Visual animation editor in browser — keyframe timeline for designer-dev collaboration.',
    category: 'library',
    level: 'expert',
    side: 'frontend',
    domains: ['animations'],
    themes: ['expert'],
    packages: { npm: '@theatre/core' },
    group: 'Designer Tools',
    integrationPrompt: `Integrate Theatre.js for visual animation editing.
- Install \`npm install @theatre/core @theatre/studio @theatre/r3f\` (r3f optional for 3D).
- Create \`frontend/src/animations/theatre-project.ts\` with:
  - Project creation: getProject('my-project')
  - Sheet creation: project.sheet('intro-animation')
  - Object definition: sheet.object('hero-text', { opacity: 0, y: 50, scale: 0.9 })
  - Sequence configuration: sheet.sequence with length and playback rate
- Create \`frontend/src/components/TheatreAnimation.tsx\` with:
  - useVal() hook to read animated values from Theatre objects
  - Apply values to element styles: opacity, transform
  - Sequence controls: play(), pause(), position (scrub)
- Create \`frontend/src/animations/theatre-studio.ts\` with:
  - Studio initialization (dev mode only): studio.initialize()
  - Visual keyframe editor appears in browser for animation editing
  - Export animation state to JSON for production (no studio in prod)
  - Conditional import: only load @theatre/studio in development
- Theatre.js workflow:
  1. Define objects with default values
  2. Open Studio in dev mode
  3. Visually edit keyframes in the timeline
  4. Export animation state JSON
  5. Load JSON in production (no Studio needed)
- Best for: complex multi-element animations that need visual fine-tuning.
- Use CSS variables from the active theme for Theatre-animated element styles.`,
  },
]
```

**Step 2: Verify no TypeScript errors**

Run: `cd /storage/self/primary/Download/aus-studio/frontend && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors related to animations.ts

**Step 3: Commit**

```bash
git add frontend/src/tools/domains/animations.ts
git commit -m "feat(tools): add animations domain with 11 expert tools in 4 capability groups"
```

---

### Task 2: Register Animations Tools in Registry

**Files:**
- Modify: `frontend/src/tools/registry.ts`

**Step 1: Add import and spread**

```typescript
import { ANIMATIONS_TOOLS } from './domains/animations'

export const TOOL_CATALOG: ToolEntry[] = dedup([
  ...EXPERT_TOOLS,
  ...SITE_DEV_TOOLS,
  ...RAG_TOOLS,
  ...MUSIC_TOOLS,
  ...GAMES_TOOLS,
  ...SAAS_TOOLS,
  ...VISUALS_TOOLS,
  ...ANIMATIONS_TOOLS,
])
```

**Step 2: Verify no duplicate IDs**

All animation tool IDs use `anim-` prefix. Verify:
```bash
grep -c "anim-" src/tools/domains/animations.ts
```
Expected: 11

**Step 3: Commit**

```bash
git add frontend/src/tools/registry.ts
git commit -m "feat(tools): register animations domain tools in registry"
```

---

### Task 3: Integration Verification

**Step 1: Verify ToolDomain includes animations**

Check `types.ts` for an animations-related domain value. Add if missing.

**Step 2: Verify tool counts**

Expected groups:
```
Animation Engines: 4
Scroll & Reveal: 3
CSS & Tailwind: 2
Designer Tools: 2
Total: 11
```

**Step 3: Verify GSAP "Already Added"**

GSAP has `packages: { npm: 'gsap' }` and is already in the project's package.json. The "Already Added" logic should detect it and show the badge.

**Step 4: Commit if fixes needed**

```bash
git add -A
git commit -m "fix(tools): animations domain integration fixes"
```
