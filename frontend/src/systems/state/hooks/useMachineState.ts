/**
 * useMachineState
 * 
 * Thin wrapper hook for consuming state machines in UI components.
 * Provides ergonomic access to machine state and actions.
 */

import { useMachine, useActor } from '@xstate/react';
import { useMemo } from 'react';

/**
 * Hook for using a state machine
 * 
 * @param machine - The state machine definition
 * @param options - Options for the machine
 * @returns Machine state, send function, and service
 */
export function useMachineState<TMachine extends ReturnType<typeof import('xstate').createMachine>>(
  machine: TMachine,
  options?: Parameters<typeof useMachine>[1]
) {
  const [state, send, service] = useMachine(machine as any, options);

  const value = useMemo(() => ({
    state,
    send,
    service,
    // Convenience getters
    isIdle: (state as any).matches('idle'),
    isLoading: (state as any).matches('loading') || (state as any).matches('pending') || (state as any).matches('submitting'),
    isError: (state as any).matches('error'),
    isSuccess: (state as any).matches('success'),
    // Context access
    context: (state as any).context,
    // Current state value
    value: (state as any).value,
  }), [state, send, service]);

  return value;
}

/**
 * Hook for using an actor ref
 * 
 * @param actorRef - The actor ref from a parent machine
 * @returns Actor state, send function, and service
 */
export function useActorState(actorRef: any) {
  const [state, send] = useActor(actorRef);

  const value = useMemo(() => ({
    state,
    send,
    // Convenience getters
    isIdle: (state as any).matches?.('idle') ?? false,
    isLoading: (state as any).matches?.('loading') || (state as any).matches?.('pending') || (state as any).matches?.('submitting') || false,
    isError: (state as any).matches?.('error') ?? false,
    isSuccess: (state as any).matches?.('success') ?? false,
    // Context access
    context: (state as any).context,
    // Current state value
    value: (state as any).value,
  }), [state, send]);

  return value;
}
