'use client';

import React, { useEffect } from 'react';
import { StackSelector } from './StackSelector';
import { VibeTuner } from './VibeTuner';
import type { UserProfile } from '@/types';
import { useMachineState } from '@/systems/state';
import { onboardingMachine, type OnboardingMachineContext } from '@/systems/state/machines/onboardingMachine';
import { profileService } from '@/services/profileService';
import { AnimatedButton, AnimatedCard, Reveal } from '@/systems/motion';
import { ProgressIndicator } from '@/components/Feedback/ProgressIndicator';
import { logUXEvent } from '@/systems/analytics/uxEvents';
import { withTimeout } from '@/systems/utils/timeout';

interface ProfileOnboardingProps {
  userId: string;
  onComplete: (profile: Partial<UserProfile>) => void;
}

const STEPS = [
  'welcome',
  'role',
  'stack',
  'vibe',
  'brand',
  'complete',
] as const;

export function ProfileOnboarding({ userId, onComplete }: ProfileOnboardingProps) {
  const { send, context, isLoading, isError, isSuccess } = useMachineState(
    onboardingMachine.provide({
      actors: {
        submitProfileData: async ({ input }: { input: OnboardingMachineContext }) => {
          try {
            const result = await withTimeout(
              profileService.createProfile({
                ...input.profile,
                user_id: input.userId,
              }),
              { timeout: 30000 }
            );
            if (!result) {
              throw new Error('Failed to create profile');
            }
            logUXEvent.flowCompleted('onboarding', context.totalSteps);
            return result;
          } catch (error) {
            logUXEvent.errorOccurred('onboarding', error as Error);
            throw error;
          }
        },
      } as any,
    }) as any,
    {
      input: {
        userId,
        currentStep: 0,
        totalSteps: STEPS.length,
        profile: {
          user_id: userId,
        },
        retryCount: 0,
      },
    }
  );

  // Handle success state
  useEffect(() => {
    if (isSuccess && context.profile) {
      logUXEvent.successCelebrated('onboarding');
      onComplete(context.profile);
    }
  }, [isSuccess, context.profile, onComplete]);

  // Log step views
  useEffect(() => {
    const stepName = STEPS[context.currentStep];
    logUXEvent.stepViewed('onboarding', stepName, context.currentStep, context.totalSteps);
  }, [context.currentStep, context.totalSteps]);

  const updateProfile = (updates: Partial<UserProfile>) => {
    send({ type: 'UPDATE_PROFILE', updates } as any);
  };

  const currentStepIndex = context.currentStep;
  const currentStepName = STEPS[currentStepIndex];

  const renderStep = () => {
    switch (currentStepName) {
      case 'welcome':
        return (
          <Reveal direction="fade">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-slate-50">
                Welcome to Cursor Venture Companion
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Your AI cofounder for the entire product lifecycle: ideation, specification, implementation, DevOps, and continuous evolution.
              </p>
              <AnimatedButton
                variant="primary"
                onClick={() => send({ type: 'NEXT' } as any)}
              >
                Get Started
              </AnimatedButton>
            </div>
          </Reveal>
        );

      case 'role':
        return (
          <Reveal direction="left">
            <div>
              <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-slate-50">
                Tell us about your role
              </h2>
              <div className="space-y-3">
                {(['founder', 'pm', 'staff_engineer', 'devops', 'cfo', 'investor'] as const).map(
                  (role) => (
                    <AnimatedButton
                      key={role}
                      variant={context.profile.role === role ? 'primary' : 'secondary'}
                      fullWidth
                      className="justify-start text-left"
                      onClick={() => {
                        updateProfile({ role });
                        send({ type: 'NEXT' } as any);
                      }}
                    >
                      <span className="font-medium capitalize">{role.replace('_', ' ')}</span>
                    </AnimatedButton>
                  )
                )}
              </div>
              <div className="mt-6">
                <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                  Project Type
                </label>
                <select
                  value={context.profile.vertical || ''}
                  onChange={(e) => updateProfile({ vertical: e.target.value as UserProfile['vertical'] })}
                  className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select...</option>
                  <option value="software">Software / SaaS</option>
                  <option value="agency">Agency</option>
                  <option value="internal_tools">Internal Tools</option>
                  <option value="content">Content Platform</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </Reveal>
        );

      case 'stack':
        return (
          <Reveal direction="left">
            <div>
              <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-slate-50">
                What&apos;s in your tech stack?
              </h2>
              <StackSelector
                stack={(context.profile.stack || {}) as Record<string, boolean>}
                onChange={(stack) => updateProfile({ stack: stack as UserProfile['stack'] })}
              />
            </div>
          </Reveal>
        );

      case 'vibe':
        return (
          <Reveal direction="left">
            <div>
              <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-slate-50">
                Tune your vibe
              </h2>
              <VibeTuner
                playfulness={50}
                revenueFocus={60}
                investorPerspective={40}
                onChange={(vibe) => {
                  updateProfile({
                    tone: vibe.playfulness > 70 ? 'playful' : vibe.playfulness < 30 ? 'serious' : 'balanced',
                    kpi_focus: vibe.revenueFocus > 70 ? 'revenue' : 'growth',
                    perspective: vibe.investorPerspective > 70 ? 'cfo' : 'founder',
                  });
                }}
              />
              <div className="mt-6">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                  You can save this configuration as a preset later in your profile settings.
                </p>
              </div>
            </div>
          </Reveal>
        );

      case 'brand':
        return (
          <Reveal direction="left">
            <div>
              <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-slate-50">
                Brand & Context (Optional)
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                    Brand Name
                  </label>
                  <input
                    type="text"
                    value={context.profile.brand_voice || ''}
                    onChange={(e) => updateProfile({ brand_voice: e.target.value })}
                    className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Your brand name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                    Company Context
                  </label>
                  <textarea
                    value={context.profile.company_context || ''}
                    onChange={(e) => updateProfile({ company_context: e.target.value })}
                    className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                    placeholder="E.g., '$2M ARR SaaS, 5 person team, building developer tools'"
                  />
                </div>
              </div>
            </div>
          </Reveal>
        );

      case 'complete':
        return (
          <Reveal direction="fade">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-slate-50">
                You&apos;re all set!
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Your profile has been created. Let&apos;s start using your AI companion.
              </p>
              <AnimatedButton
                variant="primary"
                onClick={() => send({ type: 'SUBMIT' } as any)}
                isLoading={isLoading}
                isDisabled={isLoading}
              >
                Start Using Companion
              </AnimatedButton>
            </div>
          </Reveal>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Progress Indicator */}
      <div className="mb-8">
        <ProgressIndicator
          currentStep={currentStepIndex}
          totalSteps={STEPS.length}
        />
      </div>

      {/* Step Content */}
      <AnimatedCard variant="elevated" className="p-6 min-h-[400px]">
        {renderStep()}
      </AnimatedCard>

      {/* Error State */}
      {isError && (
        <Reveal direction="fade">
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <p className="text-sm font-semibold text-red-700 dark:text-red-300 mb-2">
              ✗ Error
            </p>
            <p className="text-sm text-red-600 dark:text-red-400 mb-4">
              {context.error || 'Something went wrong'}
            </p>
            <div className="flex gap-2">
              <AnimatedButton
                variant="danger"
                onClick={() => {
                  logUXEvent.retryAttempted('onboarding', context.retryCount);
                  send({ type: 'RETRY' } as any);
                }}
                isDisabled={context.retryCount >= 3}
              >
                Retry ({3 - context.retryCount} left)
              </AnimatedButton>
              <AnimatedButton
                variant="secondary"
                onClick={() => send({ type: 'PREV' } as any)}
              >
                Go Back
              </AnimatedButton>
            </div>
          </div>
        </Reveal>
      )}

      {/* Navigation */}
      {currentStepName !== 'welcome' && currentStepName !== 'complete' && !isLoading && (
        <div className="flex justify-between mt-6">
          <AnimatedButton
            variant="ghost"
            onClick={() => send({ type: 'PREV' } as any)}
          >
            ← Back
          </AnimatedButton>
          {currentStepName !== 'role' && (
            <AnimatedButton
              variant="primary"
              onClick={() => send({ type: 'NEXT' } as any)}
            >
              Next →
            </AnimatedButton>
          )}
        </div>
      )}
    </div>
  );
}
