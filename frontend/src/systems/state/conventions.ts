/**
 * XState Conventions
 * 
 * Best practices and patterns for state machine implementation.
 */

/**
 * Conventions:
 * 
 * 1. Context Types
 *    - Always define a typed context interface
 *    - Use AsyncContext<TData, TError> for async operations
 *    - Keep context minimal - only what's needed for state logic
 * 
 * 2. Events
 *    - Use SCREAMING_SNAKE_CASE for event types
 *    - Always type event payloads
 *    - Use RESET and CANCEL events for common patterns
 * 
 * 3. States
 *    - Use explicit state names (not nested objects unless necessary)
 *    - Separate async states: idle, pending, success, error
 *    - Use guards for conditional transitions
 * 
 * 4. Guards
 *    - Name guards descriptively: canProceed, isValid, hasData
 *    - Keep guards pure (no side effects)
 *    - Return boolean explicitly
 * 
 * 5. Actions
 *    - Use assign() for context updates
 *    - Keep actions synchronous when possible
 *    - Use invoke for async operations
 * 
 * 6. Invoke
 *    - Always handle onDone and onError
 *    - Use typed services
 *    - Set appropriate timeout for long-running operations
 * 
 * 7. Hooks
 *    - Use useMachine or useActor from @xstate/react
 *    - Create thin wrapper hooks for UI ergonomics
 *    - Expose only what UI needs (state, send, service)
 */

export const CONVENTIONS = {
  // Standard state names
  STATES: {
    IDLE: 'idle',
    PENDING: 'pending',
    SUCCESS: 'success',
    ERROR: 'error',
    LOADING: 'loading',
    READY: 'ready',
  },
  
  // Standard event types
  EVENTS: {
    START: 'START',
    RETRY: 'RETRY',
    RESET: 'RESET',
    CANCEL: 'CANCEL',
    SUBMIT: 'SUBMIT',
    NEXT: 'NEXT',
    PREV: 'PREV',
    SUCCESS: 'SUCCESS',
    ERROR: 'ERROR',
  },
  
  // Standard guard names
  GUARDS: {
    CAN_PROCEED: 'canProceed',
    IS_VALID: 'isValid',
    HAS_DATA: 'hasData',
    CAN_RETRY: 'canRetry',
  },
} as const;
