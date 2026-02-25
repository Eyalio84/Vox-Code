# UI Animations — Tool Suggestions

> Tools, libraries, modules, and frameworks recommended when a user is building an app that involves UI animations, page transitions, scroll effects, or micro-interactions.

---

## Custom Tools

| Tool | Source | Description | Type |
|------|--------|-------------|------|
| `boilerplate_generator` | by category/generators | Observer/Decorator patterns for animation state | Library |
| `scaffold_generator` | by category/generators | Project scaffolding | Utility |

---

## External Libraries

| Library | Package | Description | Why |
|---------|---------|-------------|-----|
| GSAP (already in project) | npm: `gsap` | Professional animation timeline engine | Used in theme transitions already |

---

## Frameworks

| Framework | Package | Description | Why |
|-----------|---------|-------------|-----|
| Motion (fka Framer Motion) | npm: `motion` | Declarative React animation, layout, exit, gesture, scroll | 30.7K stars, single `<motion.div>` API |
| GSAP | npm: `gsap` | Timeline engine with ScrollTrigger, Draggable, MorphSVG | 23.6K stars, industry standard |
| react-spring | npm: `@react-spring/web` | Spring-physics hooks (useSpring, useTrail, useTransition) | 28K stars, physics feel without manual easing |
| AutoAnimate | npm: `@formkit/auto-animate` | Single hook animates DOM mutations automatically | 13K stars, ~2KB, zero config |
| Anime.js v4 | npm: `animejs` | Lightweight animation engine, ESM-first | 53K stars, v4 rewrote for tree-shaking |
| Motion One | (vanilla subset of motion) | Framework-agnostic, uses native Web Animations API | Zero framework coupling |
| Lottie React | npm: `@lottiefiles/dotlottie-react` | After Effects animations at runtime via WASM | .lottie 80% smaller than JSON, scroll-sync |
| Theatre.js | npm: `@theatre/core` | Visual animation editor in browser, keyframe timeline | Designer-dev collaboration tool |
| TAOS | npm: `taos` | Tailwind scroll-triggered reveal animations | 600 bytes, no JS, data attributes |
| tailwindcss-motion | npm: `tailwindcss-motion` | Tailwind plugin for motion-* utility classes | Pure CSS, no runtime JS, RSC compatible |
| AOS | npm: `aos` | CSS class injection on scroll | 27K stars, simplest scroll reveal |

---

## Recommended Combinations

- **Rich page transitions**: GSAP + ScrollTrigger + Motion (layout animations)
- **Micro-interactions**: AutoAnimate + tailwindcss-motion + Motion
- **Scroll-driven experience**: GSAP ScrollTrigger + AOS + Lottie (designer assets)
- **Physics-based UI**: react-spring + Motion One + Theatre.js (fine-tuning)
- **Lightweight/CSS-only**: tailwindcss-motion + TAOS + AOS
- **Designer handoff**: Lottie React + Theatre.js + Anime.js v4
