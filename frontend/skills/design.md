# TalentLens Atlas Design System

## Aesthetic Direction
Editorial-tech with warm neutrals, sharp typography contrast, and analytical clarity.

## Design Pillars
- Distinctive typography pairing: Fraunces for display and Manrope for body.
- Warm paper canvas with mint and coral accents.
- Layered atmospheric backgrounds, not flat fills.
- High-contrast hierarchy and clean card composition.
- Meaningful entrance motion using staggered reveals.

## Visual Tokens
- Primary background: `paper`
- Primary text: `ink`
- Accent one: `mint`
- Accent two: `coral`
- Supporting neutral: `slate`

## Layout Rules
- Desktop: max width container with generous breathing room.
- Mobile: stacked cards and touch-friendly controls.
- Navigation: persistent and concise with clear active state.

## Motion Rules
- One clear page-load animation for each major section.
- Use subtle translate + opacity, avoid excessive bouncing.
- Keep timing between 500ms and 700ms with stagger delays.

## Component Language
- Rounded cards with soft shadows.
- Uppercase micro-labels with wide tracking.
- Pills/chips for skills, strengths, and tags.
- Progress bars and score badges for analysis cues.

## Accessibility
- Body text minimum contrast target: WCAG AA.
- Tap target minimum around 40px height.
- Inputs and controls require clear focus/active states.

## Scope Note
This file defines the Phase 1 visual baseline only. Backend-driven states and error/empty/loading system design can be expanded in later phases.
