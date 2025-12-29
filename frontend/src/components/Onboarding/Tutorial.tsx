'use client';

import { useState, useEffect } from 'react';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: () => void;
}

interface TutorialProps {
  steps: TutorialStep[];
  onComplete?: () => void;
  skipable?: boolean;
}

export function Tutorial({ steps, onComplete, skipable = true }: TutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    // Check if tutorial was already completed
    const completed = localStorage.getItem('tutorial_completed');
    if (!completed) {
      setIsActive(true);
    }
  }, []);

  useEffect(() => {
    const updatePosition = () => {
      if (!steps[currentStep]?.target) return;
      const element = document.querySelector(steps[currentStep].target!);
      if (!element) return;

      const rect = element.getBoundingClientRect();
      const step = steps[currentStep];
      const position = step.position || 'bottom';

      let top = 0;
      let left = 0;

      switch (position) {
        case 'top':
          top = rect.top - 20;
          left = rect.left + rect.width / 2;
          break;
        case 'bottom':
          top = rect.bottom + 20;
          left = rect.left + rect.width / 2;
          break;
        case 'left':
          top = rect.top + rect.height / 2;
          left = rect.left - 20;
          break;
        case 'right':
          top = rect.top + rect.height / 2;
          left = rect.right + 20;
          break;
        case 'center':
          top = window.innerHeight / 2;
          left = window.innerWidth / 2;
          break;
      }

      setPosition({ top, left });
    };

    if (isActive && steps[currentStep]?.target) {
      updatePosition();
      const element = document.querySelector(steps[currentStep].target!);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentStep, isActive, steps]);


  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTutorial();
    }
  };

  const completeTutorial = () => {
    setIsActive(false);
    localStorage.setItem('tutorial_completed', 'true');
    onComplete?.();
  };

  if (!isActive || currentStep >= steps.length) return null;

  const step = steps[currentStep];

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={skipable ? nextStep : undefined}
      />
      
      {/* Highlight */}
      {step.target && (
        <div
          className="fixed z-41 border-2 border-blue-500 rounded-lg pointer-events-none"
          style={{
            top: document.querySelector(step.target)?.getBoundingClientRect().top,
            left: document.querySelector(step.target)?.getBoundingClientRect().left,
            width: document.querySelector(step.target)?.getBoundingClientRect().width,
            height: document.querySelector(step.target)?.getBoundingClientRect().height,
          }}
        />
      )}

      {/* Tooltip */}
      <div
        className="fixed z-50 bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 max-w-sm transform -translate-x-1/2"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
        }}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
              Step {currentStep + 1} of {steps.length}
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-2">
              {step.title}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {step.description}
            </p>
          </div>
          {skipable && (
            <button
              onClick={completeTutorial}
              className="ml-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              aria-label="Skip tutorial"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex gap-1">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all ${
                  idx === currentStep ? 'bg-blue-600 w-6' : 'bg-slate-300 dark:bg-slate-600 w-1.5'
                }`}
              />
            ))}
          </div>
          <button
            onClick={nextStep}
            className="px-5 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all active:scale-95"
          >
            {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
          </button>
        </div>
      </div>
    </>
  );
}
