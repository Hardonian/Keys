'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { SituationKeyCard } from '@/components/Marketplace/SituationKeyCard';
import { getKeySituation } from '@/utils/keySituations';

interface DiscoveryStep {
  id: string;
  title: string;
  description: string;
}

interface DiscoveryRecommendation {
  id: string;
  slug: string;
  title: string;
  description?: string;
  keyType: string;
  category?: string;
  whyThisKey: string;
}

interface DiscoveryFlowProps {
  onComplete?: (recommendations: DiscoveryRecommendation[]) => void;
  initialRecommendations?: DiscoveryRecommendation[];
}

const SITUATIONS = [
  { id: 'incident-response', label: "I'm responsible for something breaking" },
  { id: 'shipping', label: 'I want to ship faster without messing things up' },
  { id: 'understanding', label: "I inherited a system I don't fully trust" },
  { id: 'knowledge-sharing', label: "I don't want to be the only one who understands this" },
];

const ROLES = [
  { id: 'founder', label: 'Founder / Non-technical' },
  { id: 'operator', label: 'Operator / Manager' },
  { id: 'engineer', label: 'Senior Engineer' },
  { id: 'other', label: 'Other' },
];

const TOOLS = [
  { id: 'cursor', label: 'Cursor' },
  { id: 'jupyter', label: 'Jupyter' },
  { id: 'github', label: 'GitHub' },
  { id: 'stripe', label: 'Stripe' },
  { id: 'node', label: 'Node.js' },
  { id: 'next', label: 'Next.js' },
];

const RISK_TOLERANCE_OPTIONS = [
  { id: 'low', label: 'Low - I prefer proven, tested patterns' },
  { id: 'medium', label: 'Medium - I can handle some experimentation' },
  { id: 'high', label: 'High - I want cutting-edge approaches' },
];

export function DiscoveryFlow({ onComplete, initialRecommendations = [] }: DiscoveryFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [situation, setSituation] = useState<string>('');
  const [role, setRole] = useState<string>('');
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [riskTolerance, setRiskTolerance] = useState<string>('');
  const [recommendations, setRecommendations] = useState<DiscoveryRecommendation[]>(initialRecommendations);

  const steps: DiscoveryStep[] = [
    {
      id: 'situation',
      title: 'What situation are you facing?',
      description: 'Choose the situation that best describes your current need.',
    },
    {
      id: 'role',
      title: 'What\'s your role? (Optional)',
      description: 'This helps us recommend Keys that match your experience level.',
    },
    {
      id: 'tools',
      title: 'What tools do you already use? (Optional)',
      description: 'Select the tools you work with regularly.',
    },
    {
      id: 'risk',
      title: 'What\'s your risk tolerance?',
      description: 'This helps us recommend Keys that match your comfort level.',
    },
    {
      id: 'results',
      title: 'Recommended Keys',
      description: 'Based on your answers, here are Keys that might help.',
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      
      // Generate recommendations when reaching results step
      if (currentStep === steps.length - 2) {
        generateRecommendations();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const generateRecommendations = () => {
    // Mock recommendations - in production, this would call an API
    const mockRecommendations: DiscoveryRecommendation[] = [
      {
        id: 'demo-cursor-auth-scaffold',
        slug: 'cursor-authentication-scaffold',
        title: 'Cursor Keys: Authentication Scaffolding',
        description: 'Unlock consistent JWT authentication patterns in Cursor.',
        keyType: 'node',
        category: 'Authentication',
        whyThisKey: 'Matches your situation and includes proven patterns for secure authentication.',
      },
      {
        id: 'demo-jupyter-data-analysis',
        slug: 'jupyter-data-analysis-basics',
        title: 'Jupyter Keys: Data Analysis Basics',
        description: 'Unlock fundamental data science workflows in Jupyter.',
        keyType: 'jupyter',
        category: 'Data Science',
        whyThisKey: 'Provides clear, step-by-step workflows for data analysis.',
      },
    ];
    
    setRecommendations(mockRecommendations);
    if (onComplete) {
      onComplete(mockRecommendations);
    }
  };

  const toggleTool = (toolId: string) => {
    setSelectedTools(prev =>
      prev.includes(toolId)
        ? prev.filter(id => id !== toolId)
        : [...prev, toolId]
    );
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return situation !== '';
      case 1:
        return true; // Optional
      case 2:
        return true; // Optional
      case 3:
        return riskTolerance !== '';
      default:
        return true;
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 sm:p-8 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-lg">
      {/* Progress Indicator */}
      <div className="mb-8" role="progressbar" aria-valuenow={currentStep + 1} aria-valuemin={1} aria-valuemax={steps.length}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Step {currentStep + 1} of {steps.length}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {Math.round(((currentStep + 1) / steps.length) * 100)}%
          </span>
        </div>
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-blue-600 dark:bg-blue-500"
            initial={{ width: 0 }}
            animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {steps[currentStep].title}
          </h2>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 mb-6">
            {steps[currentStep].description}
          </p>

          {/* Situation Selection */}
          {currentStep === 0 && (
            <div className="space-y-3">
              {SITUATIONS.map(sit => (
                <button
                  key={sit.id}
                  onClick={() => setSituation(sit.id)}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 ${
                    situation === sit.id
                      ? 'border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
                  }`}
                >
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {sit.label}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Role Selection */}
          {currentStep === 1 && (
            <div className="space-y-3">
              {ROLES.map(r => (
                <button
                  key={r.id}
                  onClick={() => setRole(r.id)}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 ${
                    role === r.id
                      ? 'border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
                  }`}
                >
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {r.label}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Tools Selection */}
          {currentStep === 2 && (
            <div className="space-y-3">
              {TOOLS.map(tool => (
                <button
                  key={tool.id}
                  onClick={() => toggleTool(tool.id)}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 ${
                    selectedTools.includes(tool.id)
                      ? 'border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
                  }`}
                >
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {tool.label}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Risk Tolerance */}
          {currentStep === 3 && (
            <div className="space-y-3">
              {RISK_TOLERANCE_OPTIONS.map(option => (
                <button
                  key={option.id}
                  onClick={() => setRiskTolerance(option.id)}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 ${
                    riskTolerance === option.id
                      ? 'border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
                  }`}
                >
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Results */}
          {currentStep === 4 && (
            <div className="space-y-6">
              {recommendations.length > 0 ? (
                <>
                  <p className="text-base text-gray-600 dark:text-gray-300">
                    Based on your answers, here are {recommendations.length} Keys that might help:
                  </p>
                  <div className="grid grid-cols-1 gap-4">
                    {recommendations.map((rec, index) => {
                      const situation = getKeySituation(rec.slug);
                      return (
                        <div key={rec.id} className="border rounded-lg p-4 bg-gray-50 dark:bg-slate-900">
                          <SituationKeyCard
                            id={rec.id}
                            slug={rec.slug}
                            title={rec.title}
                            description={rec.description}
                            whenYouNeedThis={situation.whenYouNeedThis}
                            whatThisPrevents={situation.whatThisPrevents}
                            hasAccess={false}
                            keyType={rec.keyType}
                            category={rec.category}
                            index={index}
                          />
                          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-slate-700">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                              Why this Key:
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {rec.whyThisKey}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
                    <Link
                      href="/marketplace"
                      className="inline-block px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    >
                      Browse all Keys instead
                    </Link>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    No specific recommendations at this time.
                  </p>
                  <Link
                    href="/marketplace"
                    className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Browse Marketplace
                  </Link>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-slate-700">
        <button
          onClick={handleBack}
          disabled={currentStep === 0}
          className="px-4 py-2 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          ← Back
        </button>
        {currentStep < steps.length - 1 ? (
          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Continue →
          </button>
        ) : (
          <Link
            href="/marketplace"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Explore Marketplace
          </Link>
        )}
      </div>
    </div>
  );
}
