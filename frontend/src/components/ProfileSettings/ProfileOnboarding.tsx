'use client';

import React, { useState } from 'react';
import { StackSelector } from './StackSelector';
import { VibeTuner } from './VibeTuner';
// PerspectiveToggle imported but not used - kept for future use
import type { UserProfile } from '@/types';

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
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    user_id: userId,
  });

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    onComplete(profile);
  };

  const renderStep = () => {
    switch (STEPS[currentStep]) {
      case 'welcome':
        return (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Welcome to System Prompts</h2>
            <p className="text-gray-600 mb-6">
              Your Cursor business and development operations companion for ideation, specification, implementation, DevOps, and continuous evolution.
            </p>
            <button
              onClick={nextStep}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Get Started
            </button>
          </div>
        );

      case 'role':
        return (
          <div>
            <h2 className="text-xl font-bold mb-4">Tell us about your role</h2>
            <div className="space-y-3">
              {(['founder', 'pm', 'staff_engineer', 'devops', 'cfo', 'investor'] as const).map(
                (role) => (
                  <button
                    key={role}
                    onClick={() => {
                      updateProfile({ role });
                      nextStep();
                    }}
                    className={`w-full p-4 text-left border-2 rounded-lg transition-colors ${
                      profile.role === role
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="font-medium capitalize">{role.replace('_', ' ')}</span>
                  </button>
                )
              )}
            </div>
            <div className="mt-6">
              <label className="block text-sm font-medium mb-2">Project Type</label>
              <select
                value={profile.vertical || ''}
                onChange={(e) => updateProfile({ vertical: e.target.value as UserProfile['vertical'] })}
                className="w-full p-2 border border-gray-300 rounded-lg"
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
        );

      case 'stack':
        return (
          <div>
            <h2 className="text-xl font-bold mb-4">What&apos;s in your tech stack?</h2>
            <StackSelector
              stack={(profile.stack || {}) as Record<string, boolean>}
              onChange={(stack) => updateProfile({ stack: stack as UserProfile['stack'] })}
            />
          </div>
        );

      case 'vibe':
        return (
          <div>
            <h2 className="text-xl font-bold mb-4">Tune your vibe</h2>
            <VibeTuner
              playfulness={50}
              revenueFocus={60}
              investorPerspective={40}
              onChange={(vibe) => {
                // Store vibe preferences in profile
                updateProfile({
                  tone: vibe.playfulness > 70 ? 'playful' : vibe.playfulness < 30 ? 'serious' : 'balanced',
                  kpi_focus: vibe.revenueFocus > 70 ? 'revenue' : 'growth',
                  perspective: vibe.investorPerspective > 70 ? 'cfo' : 'founder',
                });
              }}
            />
            <div className="mt-6">
              <p className="text-sm text-gray-600 mb-2">
                You can save this configuration as a preset later in your profile settings.
              </p>
            </div>
          </div>
        );

      case 'brand':
        return (
          <div>
            <h2 className="text-xl font-bold mb-4">Brand & Context (Optional)</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Brand Name</label>
                <input
                  type="text"
                  value={profile.brand_voice || ''}
                  onChange={(e) => updateProfile({ brand_voice: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  placeholder="Your brand name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Company Context</label>
                <textarea
                  value={profile.company_context || ''}
                  onChange={(e) => updateProfile({ company_context: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  rows={4}
                  placeholder="E.g., '$2M ARR SaaS, 5 person team, building developer tools'"
                />
              </div>
            </div>
          </div>
        );

      case 'complete':
        return (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">You&apos;re all set!</h2>
            <p className="text-gray-600 mb-6">
              Your profile has been created. Let&apos;s start using your AI companion.
            </p>
            <button
              onClick={handleComplete}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Start Using Companion
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          {STEPS.map((step, index) => (
            <div
              key={step}
              className={`flex-1 h-2 mx-1 rounded ${
                index <= currentStep ? 'bg-primary-600' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        <p className="text-sm text-gray-500 text-center">
          Step {currentStep + 1} of {STEPS.length}
        </p>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg p-6 shadow-sm min-h-[400px]">
        {renderStep()}
      </div>

      {/* Navigation */}
      {STEPS[currentStep] !== 'welcome' && STEPS[currentStep] !== 'complete' && (
        <div className="flex justify-between mt-6">
          <button
            onClick={prevStep}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            ← Back
          </button>
          {STEPS[currentStep] !== 'role' && (
            <button
              onClick={nextStep}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Next →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
