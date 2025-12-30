# UX Interaction Specification

**Version:** 1.0  
**Last Updated:** 2024  
**Status:** Active

This document defines the interaction patterns, motion rules, feedback mechanisms, and accessibility standards for the application. All interactions must follow these specifications to ensure consistency, accessibility, and performance.

---

## Table of Contents

1. [Motion System Rules](#motion-system-rules)
2. [State Machine Patterns](#state-machine-patterns)
3. [Feedback Mechanisms](#feedback-mechanisms)
4. [Accessibility Standards](#accessibility-standards)
5. [Performance Constraints](#performance-constraints)
6. [Interaction Surfaces Inventory](#interaction-surfaces-inventory)
7. [Implementation Guidelines](#implementation-guidelines)

---

## Motion System Rules

### When Motion is Allowed

Motion MUST be used to:
- **Reflect state transitions**: Motion should visualize changes in application state
- **Provide spatial context**: Help users understand where content came from or went
- **Reinforce feedback**: Celebrate success, acknowledge errors, show progress
- **Guide attention**: Subtle animations that direct focus to important changes

Motion MUST NOT be used to:
- **Decorate**: No motion "just because"
- **Invent state**: Motion should never suggest a state that doesn't exist
- **Distract**: No constant motion, no infinite loops (except loading indicators)
- **Hide latency**: Motion should not mask slow operations

### Motion Duration Rules

- **Instant (0ms)**: State changes that must feel immediate (e.g., button press feedback)
- **Fast (150ms)**: Micro-interactions, hover states, small transitions
- **Normal (250ms)**: Standard UI transitions, page changes, modal appearances
- **Slow (400ms)**: Complex transitions, multi-element animations
- **Slower (600ms+)**: Reserved for special celebrations or major state changes

### Motion Easing Rules

- **Enter**: `easeOut` - Elements entering should feel responsive
- **Exit**: `easeIn` - Elements leaving should feel quick
- **Attention**: `easeOutExpo` or `attention` easing - For important state changes
- **Standard**: `easeInOut` - For most transitions

### Reduced Motion

**CRITICAL**: All motion MUST respect `prefers-reduced-motion`. When enabled:
- All durations → 0ms
- All springs → instant tween
- All stagger delays → 0ms
- Visual feedback preserved through color/opacity changes only

**Implementation**: Use `getMotionTokens()` and `getVariants()` from `@/systems/motion` which automatically handle reduced motion.

---

## State Machine Patterns

### When to Use State Machines

State machines MUST be used for:
- **Multi-step flows**: Onboarding, wizards, setup processes
- **Async operations**: Form submissions, API calls, data fetching
- **Complex interactions**: Chat flows, template editing, approval workflows
- **Error-prone operations**: Operations that can fail and need retry logic

State machines SHOULD NOT be used for:
- **Simple boolean toggles**: Use `useState` for simple on/off states
- **Independent UI state**: Dropdown open/closed, modal visibility
- **Derived state**: Computed values from props/context

### State Machine Structure

All machines MUST follow this pattern:

```typescript
{
  // Explicit states
  idle: { /* initial state */ },
  pending: { /* async operation */ },
  success: { /* completion */ },
  error: { /* failure with retry */ },
  
  // Guards for validation
  guards: {
    canProceed: ({ context }) => boolean,
    isValid: ({ context }) => boolean,
  },
  
  // Actions for side effects
  actions: {
    assign: assign({ /* context updates */ }),
  },
  
  // Invoke for async operations
  invoke: {
    src: 'asyncOperation',
    onDone: { target: 'success' },
    onError: { target: 'error' },
  },
}
```

### State Machine Conventions

- **State names**: Use descriptive names (`submitting`, not `loading`)
- **Event names**: SCREAMING_SNAKE_CASE (`SUBMIT`, `RETRY`, `RESET`)
- **Context**: Keep minimal - only what's needed for state logic
- **Guards**: Pure functions, no side effects
- **Actions**: Use `assign()` for context updates
- **Invoke**: Always handle `onDone` and `onError`

---

## Feedback Mechanisms

### Progress Feedback

**When**: Multi-step flows, async operations, long-running tasks

**Components**:
- `ProgressIndicator`: Shows step progress (e.g., "Step 2 of 5")
- `ProgressRing`: Circular progress for async operations
- `LoadingSkeleton`: Placeholder content during loading

**Rules**:
- Show progress immediately when operation starts
- Update progress as state changes
- Hide progress when complete or error
- Use motion tokens for progress animations

**Files**:
- `/app/onboarding/page.tsx` - Multi-step onboarding
- `/components/ProfileSettings/ProfileOnboarding.tsx` - Profile setup
- `/app/templates/[id]/customize/page.tsx` - Template customization

### Success Feedback

**When**: Operations complete successfully, milestones reached

**Components**:
- `SuccessToast`: Brief notification (auto-dismiss)
- `SuccessBadge`: Persistent success indicator
- `Celebration`: Subtle animation for major achievements

**Rules**:
- Show success immediately after state transition
- Auto-dismiss toasts after 3-5 seconds
- Use `successVariants` from motion system
- Respect reduced motion preferences

**Files**:
- `/components/Toast.tsx` - Toast notifications
- `/components/GenZ/AchievementBadge.tsx` - Achievement system
- All form submissions

### Error Feedback

**When**: Operations fail, validation errors, network errors

**Components**:
- `ErrorToast`: Error notification with retry option
- `ErrorState`: Inline error display
- `RetryButton`: Actionable retry mechanism

**Rules**:
- Show error immediately after failure
- Provide actionable error messages (not generic "Error occurred")
- Include retry mechanism when appropriate
- Use `error` state from state machine
- Never auto-dismiss errors (user must acknowledge)

**Files**:
- `/app/signup/page.tsx` - Form validation errors
- `/app/signin/page.tsx` - Authentication errors
- All API call error handling

### Achievement Feedback

**When**: Milestones unlocked, goals reached, first-time actions

**Components**:
- `AchievementBadge`: Visual badge for achievements
- `Confetti`: Celebration animation (sparingly)
- `ProgressRing`: Visual progress toward goals

**Rules**:
- Trigger from state machine actions, not UI hacks
- Use sparingly - only for meaningful milestones
- Respect reduced motion
- Provide accessible text alternative

**Files**:
- `/components/GenZ/AchievementBadge.tsx`
- `/components/GenZ/Confetti.tsx`
- `/components/GenZ/ProgressRing.tsx`

---

## Accessibility Standards

### Keyboard Navigation

**Requirements**:
- All interactive elements MUST be keyboard accessible
- Tab order MUST be logical and predictable
- Focus indicators MUST be visible (2px outline, high contrast)
- Escape key MUST close modals/dialogs
- Enter/Space MUST activate buttons/links

**Implementation**:
- Use semantic HTML (`<button>`, `<a>`, `<input>`)
- Use `tabIndex` only when necessary (avoid `tabIndex={-1}` on interactive elements)
- Implement focus traps in modals
- Provide skip links for main content

**Files**:
- All pages and components
- `/components/KeyboardShortcuts.tsx` - Keyboard shortcuts system

### Screen Reader Support

**Requirements**:
- All images MUST have alt text
- Form inputs MUST have labels (visible or `aria-label`)
- Interactive elements MUST have accessible names
- State changes MUST be announced via ARIA live regions
- Loading states MUST be announced

**ARIA Patterns**:
- `aria-busy="true"` during async operations
- `aria-live="polite"` for non-critical updates
- `aria-live="assertive"` for errors
- `aria-label` for icon-only buttons
- `role="status"` for success messages
- `role="alert"` for errors

**Files**:
- All form components
- `/components/Toast.tsx` - Toast notifications
- `/components/LoadingSkeleton.tsx` - Loading states

### Reduced Motion

**Requirements**:
- MUST respect `prefers-reduced-motion` media query
- Motion MUST NOT be required to understand state
- Provide alternative feedback (color, opacity, text)

**Implementation**:
- Use `getMotionTokens()` and `getVariants()` from motion system
- Test with reduced motion enabled
- Ensure all functionality works without motion

**Files**:
- `/systems/motion/tokens.ts` - Motion tokens with reduced motion support
- All components using motion

### Focus Management

**Requirements**:
- Focus MUST return to trigger after modal closes
- Focus MUST move to first element when modal opens
- Focus MUST be trapped within modals
- Focus MUST be visible (never hidden)

**Implementation**:
- Use `useEffect` to manage focus on mount/unmount
- Use `ref` to focus elements programmatically
- Test with keyboard navigation only

**Files**:
- Modal components
- Dialog components
- Form wizards

---

## Performance Constraints

### Animation Performance

**Rules**:
- Use `transform` and `opacity` for animations (GPU-accelerated)
- Avoid animating `width`, `height`, `top`, `left` (causes layout thrash)
- Limit concurrent animations (max 5-10 simultaneous)
- Use `will-change` sparingly (only when needed)

**Implementation**:
- Framer Motion handles this automatically
- Use motion variants, not inline styles
- Test on low-end devices

### Layout Thrash Prevention

**Rules**:
- Batch DOM reads/writes
- Use `requestAnimationFrame` for layout-dependent animations
- Avoid measuring layout during animations
- Use CSS transforms instead of position changes

### Infinite Animation Prevention

**Rules**:
- NO infinite animations except loading indicators
- Loading indicators MUST have `aria-busy="true"`
- Provide cancel mechanism for long-running operations
- Set timeouts for async operations (default 30s)

**Files**:
- `/components/LoadingSkeleton.tsx` - Loading states
- All async operations in state machines

---

## Interaction Surfaces Inventory

### Navigation

**Files**:
- `/app/layout.tsx` - Main navigation
- `/app/chat/page.tsx` - Chat header navigation
- `/components/ThemeSwitcher.tsx` - Theme toggle

**Current State**: Basic navigation, no state machines  
**Motion**: None currently  
**Feedback**: None currently  
**Accessibility**: Basic keyboard support

**Required Changes**:
- Add motion to route transitions (PageTransition component)
- Add focus management
- Add loading states for navigation

### Forms and Inputs

**Files**:
- `/app/signup/page.tsx` - Sign up form
- `/app/signin/page.tsx` - Sign in form
- `/components/ProfileSettings/ProfileOnboarding.tsx` - Profile form
- `/components/CompanionChat/InputPanel.tsx` - Chat input

**Current State**: useState for form state, basic validation  
**Motion**: None currently  
**Feedback**: Toast notifications, inline errors  
**Accessibility**: Basic labels, keyboard support

**Required Changes**:
- Convert to state machines for async operations
- Add motion to form field focus/blur
- Improve error feedback with retry mechanisms
- Add loading states during submission

### Onboarding / Setup / Wizards

**Files**:
- `/app/onboarding/page.tsx` - Onboarding page
- `/components/ProfileSettings/ProfileOnboarding.tsx` - Profile setup wizard
- `/components/Onboarding/Tutorial.tsx` - Tutorial overlay

**Current State**: useState for step management, no state machine  
**Motion**: Basic transitions  
**Feedback**: Progress bar, step indicators  
**Accessibility**: Basic keyboard navigation

**Required Changes**:
- **PRIORITY**: Convert to XState machine (Phase 3)
- Add motion to step transitions
- Improve progress feedback
- Add error/retry states
- Add keyboard navigation (arrow keys, Enter)

### Dashboards, Lists, Cards

**Files**:
- `/app/dashboard/page.tsx` - Main dashboard
- `/components/TemplateManager/TemplateBrowser.tsx` - Template list
- `/components/BackgroundAgent/ActionHistory.tsx` - Action history list

**Current State**: Basic rendering, no motion  
**Motion**: None currently  
**Feedback**: Loading states, empty states  
**Accessibility**: Basic semantic HTML

**Required Changes**:
- Add Reveal animations for list items
- Add AnimatedCard components
- Improve empty states with motion
- Add loading skeletons

### Loading, Empty, Success, Error States

**Files**:
- `/components/LoadingSkeleton.tsx` - Loading placeholder
- `/components/EmptyState.tsx` - Empty state component
- `/components/Toast.tsx` - Toast notifications
- `/components/ErrorBoundary.tsx` - Error boundary

**Current State**: Basic components, no motion  
**Motion**: None currently  
**Feedback**: Text-based only  
**Accessibility**: Basic ARIA attributes

**Required Changes**:
- Add motion to state transitions
- Improve error states with retry mechanisms
- Add success celebrations
- Enhance accessibility (ARIA live regions)

### Chat Interface

**Files**:
- `/app/chat/page.tsx` - Chat page
- `/components/CompanionChat/ChatInterface.tsx` - Chat UI
- `/components/CompanionChat/InputPanel.tsx` - Input component

**Current State**: Basic chat UI, WebSocket integration  
**Motion**: None currently  
**Feedback**: Toast notifications  
**Accessibility**: Basic keyboard support

**Required Changes**:
- Add motion to message appearance
- Add typing indicators with motion
- Improve error feedback for failed messages
- Add loading states for message sending

### Template System

**Files**:
- `/app/templates/page.tsx` - Template list
- `/app/templates/[id]/page.tsx` - Template detail
- `/app/templates/[id]/customize/page.tsx` - Template editor
- `/components/TemplateManager/TemplateEditor.tsx` - Editor component

**Current State**: Complex state management with useState  
**Motion**: None currently  
**Feedback**: Toast notifications  
**Accessibility**: Basic form accessibility

**Required Changes**:
- Convert template editing to state machine
- Add motion to template cards
- Improve validation feedback
- Add save/load states with progress

---

## Implementation Guidelines

### Phase 3: Core Flow Refactoring

**Target**: `/components/ProfileSettings/ProfileOnboarding.tsx`

**Changes**:
1. Create `onboardingMachine` in `/systems/state/machines/onboardingMachine.ts`
2. Replace `useState` with `useMachineState`
3. Add motion to step transitions using `Reveal` component
4. Add progress indicator using `ProgressIndicator` component
5. Add error/retry states
6. Add keyboard navigation (arrow keys, Enter)

### Phase 4: Feedback Components

**New Components**:
- `ProgressIndicator`: Step-based progress (e.g., "Step 2 of 5")
- `SuccessToast`: Success notification with auto-dismiss
- `ErrorToast`: Error notification with retry button
- `RetryButton`: Reusable retry mechanism

**Integration Points**:
- Onboarding flow
- Form submissions
- API calls
- Template operations

### Phase 5: Consistency Pass

**Targets**:
- Replace all ad-hoc animations with motion primitives
- Replace all loading spinners with `LoadingSkeleton`
- Replace all error displays with `ErrorToast`
- Replace all success messages with `SuccessToast`
- Add `PageTransition` to all route changes
- Add `Reveal` to all list items

### Phase 6: Hardening

**Targets**:
- Add timeout handling to all async operations
- Add retry logic to all error states
- Add loading states to all async operations
- Ensure routes never hard-crash
- Add error boundaries where needed

### Phase 7: Measurement

**Events to Track**:
- `step_viewed`: When user views a step in a flow
- `step_completed`: When user completes a step
- `flow_completed`: When user completes entire flow
- `flow_abandoned`: When user abandons flow
- `error_occurred`: When error occurs
- `retry_attempted`: When user retries after error
- `success_celebrated`: When success feedback shown

**Implementation**:
- Create `/systems/analytics/uxEvents.ts`
- Log events locally in dev
- Stub for backend integration
- Add dev-only event inspector

---

## Verification Checklist

Before considering any interaction complete, verify:

- [ ] Motion respects `prefers-reduced-motion`
- [ ] All interactive elements are keyboard accessible
- [ ] Focus indicators are visible
- [ ] Screen reader announces state changes
- [ ] Error messages are actionable
- [ ] Loading states are announced
- [ ] No layout thrash in animations
- [ ] No infinite animations (except loading)
- [ ] State machines used for complex flows
- [ ] Motion reflects state, doesn't invent it
- [ ] Performance acceptable on low-end devices
- [ ] All TypeScript errors resolved
- [ ] All lint errors resolved
- [ ] Build passes successfully

---

## References

- Motion System: `/systems/motion/`
- State Machine System: `/systems/state/`
- Playground: `/app/playground/`
- Demo Machine: `/systems/state/machines/demoMachine.ts`

---

**End of Specification**
