# Phase 7: Google AI Studio Apps & Resume Projects — Placeholder

> **Status**: Placeholder — design and planning TBD after Phase 6 implementation.

**Goal:** Integrate 9 ready-made React apps built in Google AI Studio as example templates, and enable the power feature of resuming projects started in AI Studio within A(Us) Studio.

---

## Context

The user has built 9 complete React applications in Google AI Studio. These serve two purposes:

1. **Example Templates** — Pre-built, working apps users can explore, learn from, and use as starting points (expanding the current 3 templates in `aus/specs/templates.py`)
2. **Resume Projects** — Power feature allowing users to import/resume projects they started in Google AI Studio, giving them full-stack capabilities (backend, database, dual-model generation) that AI Studio alone cannot provide

## The 9 Apps

> Exact app inventory TBD — user will provide details when Phase 7 begins.

Current template system (`aus/specs/templates.py`) has 3 templates:
- `todo` — Task management (Simple)
- `dashboard` — Analytics dashboard (Standard)
- `saas` — SaaS starter with auth (Complex)

Phase 7 would expand this significantly with 9+ real-world apps.

## Key Design Questions (for future brainstorming)

1. **Import format** — How do AI Studio exports look? Single HTML? Multi-file React? What needs transformation?
2. **Template vs Import** — Are the 9 apps templates (clean starting points) or imports (resume existing work)?
3. **Backend generation** — AI Studio generates frontend-only. How does A(Us) Studio infer and generate the backend?
4. **Spec extraction** — Can we reverse-engineer a `Spec` from an AI Studio app to feed into the pipeline?
5. **UI integration** — Where does "Resume AI Studio Project" live? VOX welcome flow? New drawer section? Import button?
6. **Template gallery** — Should the 9 apps appear as a visual gallery with previews?

## Relationship to Other Phases

- **Phase 3 (VOX Welcome)** — Resume projects could be offered during onboarding
- **Phase 4 (Studio Core)** — Sandpack preview could show imported apps
- **Phase 5 (Adaptive Drawer)** — Template selection could live in the drawer
- **Phase 6 (Domain Tools)** — Imported apps could auto-detect domain and suggest relevant tools

## Notes from Vision Doc

From `docs/vision/1.txt`:
> "by giving the feature to build back end as well, we give all the control back to the user, we bonus of choosing between claude or gemini as a bonus power feature"

This is the core value prop of the resume feature — AI Studio gives frontend, A(Us) Studio gives the full stack.
