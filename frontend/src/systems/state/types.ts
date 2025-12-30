/**
 * XState Type Definitions
 * 
 * Canonical types and conventions for state machines.
 */

import { EventObject } from 'xstate';

/**
 * Standard async states for invoke operations
 */
export type AsyncState = 'idle' | 'pending' | 'success' | 'error';

/**
 * Standard context shape for async operations
 */
export interface AsyncContext<TData = unknown, TError = Error> {
  data?: TData;
  error?: TError;
  retryCount?: number;
}

/**
 * Standard events for async operations
 */
export interface AsyncEvents extends Record<string, EventObject> {
  START: EventObject;
  RETRY: EventObject;
  RESET: EventObject;
  SUCCESS: EventObject & { data?: unknown };
  ERROR: EventObject & { error?: unknown };
}

/**
 * Standard machine context shape
 * Extend this for specific machines
 */
export interface BaseMachineContext {
  [key: string]: unknown;
}

/**
 * Standard machine events
 * Extend this for specific machines
 */
export interface BaseMachineEvents extends Record<string, EventObject> {
  RESET: EventObject;
  CANCEL: EventObject;
}

/**
 * Guard function type
 */
export type Guard<TContext, TEvent extends EventObject> = (
  context: TContext,
  event: TEvent
) => boolean;

/**
 * Action function type
 */
export type Action<TContext, TEvent extends EventObject> = (
  context: TContext,
  event: TEvent
) => void | Promise<void>;
