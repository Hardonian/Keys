/**
 * UX System Playground
 * 
 * Internal route for verifying motion and state machine systems.
 * This is NOT a marketing page - it's for development/testing.
 */

'use client';

import { useState } from 'react';
import { AnimatedButton, AnimatedCard, Reveal, PageTransition } from '@/systems/motion';
import { useMachineState } from '@/systems/state';
import { demoMachine } from '@/systems/state/machines/demoMachine';

export default function PlaygroundPage() {
  const [showMotionDemo, setShowMotionDemo] = useState(true);
  const [showStateDemo, setShowStateDemo] = useState(false);

  return (
    <PageTransition className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <Reveal direction="down">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-50 mb-2">
              UX System Playground
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Internal verification of motion and state machine systems
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Reveal direction="left" delay={100}>
            <AnimatedCard variant="elevated" hoverable className="p-6">
              <h2 className="text-2xl font-semibold mb-4">Motion System</h2>
              <div className="space-y-4">
                <AnimatedButton
                  variant="primary"
                  onClick={() => setShowMotionDemo(!showMotionDemo)}
                >
                  Toggle Motion Demo
                </AnimatedButton>
                {showMotionDemo && (
                  <Reveal direction="fade" delay={200}>
                    <div className="space-y-4">
                      <AnimatedButton variant="primary">Primary Button</AnimatedButton>
                      <AnimatedButton variant="secondary">Secondary Button</AnimatedButton>
                      <AnimatedButton variant="ghost">Ghost Button</AnimatedButton>
                      <AnimatedButton variant="danger">Danger Button</AnimatedButton>
                      <AnimatedButton isLoading>Loading Button</AnimatedButton>
                      <AnimatedButton isDisabled>Disabled Button</AnimatedButton>
                    </div>
                  </Reveal>
                )}
              </div>
            </AnimatedCard>
          </Reveal>

          <Reveal direction="right" delay={100}>
            <AnimatedCard variant="elevated" hoverable className="p-6">
              <h2 className="text-2xl font-semibold mb-4">State Machine System</h2>
              <div className="space-y-4">
                <AnimatedButton
                  variant="primary"
                  onClick={() => setShowStateDemo(!showStateDemo)}
                >
                  Toggle State Demo
                </AnimatedButton>
                {showStateDemo && <StateMachineDemo />}
              </div>
            </AnimatedCard>
          </Reveal>
        </div>

        <Reveal direction="up" delay={200}>
          <AnimatedCard variant="outlined" className="p-6">
            <h2 className="text-2xl font-semibold mb-4">System Status</h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span>Motion system initialized</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span>State machine system initialized</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span>Accessibility checks enabled</span>
              </div>
            </div>
          </AnimatedCard>
        </Reveal>
      </div>
    </PageTransition>
  );
}

function StateMachineDemo() {
  const { state, send, context } = useMachineState(demoMachine as any);

  const currentStep = context.currentStep;
  const totalSteps = context.totalSteps;

  return (
    <div className="space-y-4">
      <div className="text-sm text-slate-600 dark:text-slate-400">
        State: <span className="font-mono font-semibold">{String(state.value)}</span>
      </div>

      {/* Progress indicator */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
          <span>Step {currentStep} of {totalSteps}</span>
          <span>{Math.round((currentStep / totalSteps) * 100)}%</span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Step content */}
      {state.matches('idle') && (
        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <p className="text-sm text-slate-700 dark:text-slate-300 mb-4">
            Welcome! Click Next to start the demo flow.
          </p>
          <AnimatedButton variant="primary" onClick={() => send({ type: 'NEXT' })}>
            Start Demo
          </AnimatedButton>
        </div>
      )}

      {state.matches('step1') && (
        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <p className="text-sm text-slate-700 dark:text-slate-300 mb-4">
            Step 1: Enter your name
          </p>
          <input
            type="text"
            placeholder="Name"
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg mb-4 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            onChange={(e) =>
              send({ type: 'UPDATE_DATA', data: { name: e.target.value } } as any)
            }
          />
          <div className="flex gap-2">
            <AnimatedButton
              variant="primary"
              onClick={() => send({ type: 'NEXT' })}
              isDisabled={!context.formData.name}
            >
              Next
            </AnimatedButton>
          </div>
        </div>
      )}

      {state.matches('step2') && (
        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <p className="text-sm text-slate-700 dark:text-slate-300 mb-4">
            Step 2: Enter your email
          </p>
          <input
            type="email"
            placeholder="email@example.com"
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg mb-4 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            onChange={(e) =>
              send({ type: 'UPDATE_DATA', data: { email: e.target.value } } as any)
            }
          />
          <div className="flex gap-2">
            <AnimatedButton variant="secondary" onClick={() => send({ type: 'PREV' })}>
              Previous
            </AnimatedButton>
            <AnimatedButton
              variant="primary"
              onClick={() => send({ type: 'NEXT' })}
              isDisabled={!context.formData.email?.includes('@')}
            >
              Next
            </AnimatedButton>
          </div>
        </div>
      )}

      {state.matches('step3') && (
        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <p className="text-sm text-slate-700 dark:text-slate-300 mb-4">
            Step 3: Select preferences
          </p>
          <div className="space-y-2 mb-4">
            {['Option A', 'Option B', 'Option C'].map((option) => (
              <label key={option} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  onChange={(e) => {
                    const current = context.formData.preferences || [];
                    const updated = e.target.checked
                      ? [...current, option]
                      : current.filter((p: string) => p !== option);
                    send({ type: 'UPDATE_DATA', data: { preferences: updated } } as any);
                  }}
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">{option}</span>
              </label>
            ))}
          </div>
          <div className="flex gap-2">
            <AnimatedButton variant="secondary" onClick={() => send({ type: 'PREV' })}>
              Previous
            </AnimatedButton>
            <AnimatedButton
              variant="primary"
              onClick={() => send({ type: 'SUBMIT' })}
              isDisabled={!context.formData.preferences?.length}
            >
              Submit
            </AnimatedButton>
          </div>
        </div>
      )}

      {state.matches('submitting') && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Submitting...
          </p>
        </div>
      )}

      {state.matches('success') && (
        <Reveal direction="fade">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-sm font-semibold text-green-700 dark:text-green-300 mb-2">
              ✓ Success!
            </p>
            <p className="text-sm text-green-600 dark:text-green-400 mb-4">
              Form submitted successfully.
            </p>
            <AnimatedButton variant="primary" onClick={() => send({ type: 'RESET' })}>
              Reset Demo
            </AnimatedButton>
          </div>
        </Reveal>
      )}

      {state.matches('error') && (
        <Reveal direction="fade">
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-sm font-semibold text-red-700 dark:text-red-300 mb-2">
              ✗ Error
            </p>
            <p className="text-sm text-red-600 dark:text-red-400 mb-4">
              {context.error || 'Something went wrong'}
            </p>
            <div className="flex gap-2">
              <AnimatedButton variant="danger" onClick={() => send({ type: 'RETRY' })}>
                Retry ({3 - context.retryCount} left)
              </AnimatedButton>
              <AnimatedButton variant="secondary" onClick={() => send({ type: 'PREV' })}>
                Go Back
              </AnimatedButton>
            </div>
          </div>
        </Reveal>
      )}
    </div>
  );
}
