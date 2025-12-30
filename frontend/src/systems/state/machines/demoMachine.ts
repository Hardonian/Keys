/**
 * Demo State Machine
 * 
 * Reference implementation demonstrating XState patterns and conventions.
 * This machine handles a simple multi-step form with validation and async submission.
 */

import { createMachine, assign, ActorRefFrom } from 'xstate';
import { BaseMachineContext } from '../types';

/**
 * Context for the demo machine
 */
export interface DemoMachineContext extends BaseMachineContext {
  currentStep: number;
  totalSteps: number;
  formData: {
    name?: string;
    email?: string;
    preferences?: string[];
  };
  error?: string;
  retryCount: number;
}

/**
 * Events for the demo machine
 */
export type DemoMachineEvent =
  | { type: 'NEXT' }
  | { type: 'PREV' }
  | { type: 'UPDATE_DATA'; data: Partial<DemoMachineContext['formData']> }
  | { type: 'SUBMIT' }
  | { type: 'SUBMIT_SUCCESS'; data?: unknown }
  | { type: 'SUBMIT_ERROR'; error?: string }
  | { type: 'RETRY' }
  | { type: 'RESET' };

/**
 * Demo state machine
 * 
 * States:
 * - idle: Initial state
 * - step1, step2, step3: Form steps
 * - submitting: Async submission in progress
 * - success: Submission successful
 * - error: Submission failed
 */
export const demoMachine = createMachine(
  {
    id: 'demo',
    initial: 'idle',
    context: {
      currentStep: 0,
      totalSteps: 3,
      formData: {},
      retryCount: 0,
    } as DemoMachineContext,
    types: {
      context: {} as DemoMachineContext,
      events: {} as DemoMachineEvent,
    },
    states: {
      idle: {
        on: {
          NEXT: {
            target: 'step1',
            actions: assign({
              currentStep: () => 1,
            }),
          },
        },
      },
      step1: {
        on: {
          NEXT: {
            target: 'step2',
            guard: 'isStep1Valid',
            actions: assign({
              currentStep: () => 2,
            }),
          },
          UPDATE_DATA: {
            actions: assign({
              formData: ({ context, event }) => ({
                ...context.formData,
                ...event.data,
              }),
            }),
          },
        },
      },
      step2: {
        on: {
          NEXT: {
            target: 'step3',
            guard: 'isStep2Valid',
            actions: assign({
              currentStep: () => 3,
            }),
          },
          PREV: {
            target: 'step1',
            actions: assign({
              currentStep: () => 1,
            }),
          },
          UPDATE_DATA: {
            actions: assign({
              formData: ({ context, event }) => ({
                ...context.formData,
                ...event.data,
              }),
            }),
          },
        },
      },
      step3: {
        on: {
          PREV: {
            target: 'step2',
            actions: assign({
              currentStep: () => 2,
            }),
          },
          SUBMIT: {
            target: 'submitting',
            guard: 'isStep3Valid',
          },
          UPDATE_DATA: {
            actions: assign({
              formData: ({ context, event }) => ({
                ...context.formData,
                ...event.data,
              }),
            }),
          },
        },
      },
      submitting: {
        invoke: {
          id: 'submitForm',
          src: 'submitFormData',
          onDone: {
            target: 'success',
            actions: assign({
              formData: ({ event }) => event.output as DemoMachineContext['formData'],
            }),
          },
          onError: {
            target: 'error',
            actions: assign({
              error: ({ event }) => {
                const error = event.error as Error | undefined;
                return error?.message || 'Submission failed';
              },
              retryCount: ({ context }) => context.retryCount + 1,
            }),
          },
        },
      },
      success: {
        on: {
          RESET: {
            target: 'idle',
            actions: assign({
              currentStep: () => 0,
              formData: () => ({}),
              error: () => undefined,
              retryCount: () => 0,
            }),
          },
        },
      },
      error: {
        on: {
          RETRY: {
            target: 'submitting',
            guard: 'canRetry',
            actions: assign({
              error: () => undefined,
            }),
          },
          PREV: {
            target: 'step3',
            actions: assign({
              currentStep: () => 3,
              error: () => undefined,
            }),
          },
        },
      },
    },
  },
  {
    guards: {
      isStep1Valid: ({ context }) => {
        return Boolean(context.formData.name && context.formData.name.length > 0);
      },
      isStep2Valid: ({ context }) => {
        return Boolean(
          context.formData.email &&
          context.formData.email.includes('@') &&
          context.formData.email.length > 0
        );
      },
      isStep3Valid: ({ context }) => {
        return Boolean(
          context.formData.preferences &&
          context.formData.preferences.length > 0
        );
      },
      canRetry: ({ context }) => {
        return context.retryCount < 3;
      },
    },
    actors: {
      submitFormData: async ({ input }: { input: DemoMachineContext }) => {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1500));
        
        // Simulate occasional failure
        if (Math.random() > 0.7) {
          throw new Error('Network error. Please try again.');
        }
        
        return input.formData;
      },
    } as any,
  }
);

export type DemoMachineActor = ActorRefFrom<typeof demoMachine>;
