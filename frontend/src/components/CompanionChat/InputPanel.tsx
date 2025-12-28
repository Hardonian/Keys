'use client';

import React, { useState, useEffect } from 'react';
import { SliderControl } from './SliderControl';
import { InputFilters } from './InputFilters';
import type { VibeConfig, UserProfile } from '@/types';
import type { InputFilter } from '@/types/filters';

interface InputPanelProps {
  onSend: (message: string, vibeConfig: Partial<VibeConfig>, inputFilter?: InputFilter) => void;
  initialVibeConfig?: Partial<VibeConfig>;
  loading?: boolean;
  isPremium?: boolean;
  userProfile?: Partial<UserProfile>;
}

export function InputPanel({
  onSend,
  initialVibeConfig,
  loading = false,
  isPremium = false,
  userProfile,
}: InputPanelProps) {
  const [message, setMessage] = useState('');
  const [playfulness, setPlayfulness] = useState(
    initialVibeConfig?.playfulness ?? 50
  );
  const [revenueFocus, setRevenueFocus] = useState(
    initialVibeConfig?.revenue_focus ?? 60
  );
  const [investorPerspective, setInvestorPerspective] = useState(
    initialVibeConfig?.investor_perspective ?? 40
  );
  const [showSliders, setShowSliders] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [inputFilter, setInputFilter] = useState<InputFilter>({});
  const [isVoiceMode, setIsVoiceMode] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || loading) return;

    onSend(
      message,
      {
        playfulness,
        revenue_focus: revenueFocus,
        investor_perspective: investorPerspective,
      },
      Object.keys(inputFilter).length > 0 ? inputFilter : undefined
    );

    setMessage('');
  };

  const handleVoiceInput = async () => {
    if (!isPremium) {
      alert('Voice input is a premium feature');
      return;
    }

    setIsVoiceMode(true);
    // In production, this would use Web Speech API or upload audio
    try {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript;
        setMessage(transcript);
        setIsVoiceMode(false);
      };

      recognition.onerror = () => {
        setIsVoiceMode(false);
      };

      recognition.start();
    } catch (error) {
      console.error('Voice recognition not supported', error);
      setIsVoiceMode(false);
    }
  };

  return (
    <div className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pb-safe">
      {/* Slider Controls - Collapsible on mobile */}
      <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
        {isMobile && (
          <button
            type="button"
            onClick={() => setShowSliders(!showSliders)}
            className="w-full flex items-center justify-between text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 py-1"
          >
            <span>Vibe Settings</span>
            <span className={`transform transition-transform ${showSliders ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>
        )}
        <div className={`grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 ${isMobile && !showSliders ? 'hidden' : 'grid'}`}>
          <SliderControl
            label="Playfulness"
            value={playfulness}
            onChange={setPlayfulness}
            description="0 = Serious, 100 = Playful"
          />
          <SliderControl
            label="Business Outcome Focus"
            value={revenueFocus}
            onChange={setRevenueFocus}
            description="0 = Exploratory, 100 = ROI-obsessed"
          />
          <SliderControl
            label="Investor Perspective"
            value={investorPerspective}
            onChange={setInvestorPerspective}
            description="0 = Pure operator/tech, 100 = Investor/CFO framing"
          />
        </div>
      </div>

      {/* Input Filters */}
      <InputFilters
        onFilterChange={setInputFilter}
        initialFilter={inputFilter}
        isPremium={isPremium}
        userProfile={userProfile}
      />

      {/* Message Input - Mobile optimized */}
      <form onSubmit={handleSubmit} className="px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 flex gap-2">
        {isPremium && (
          <button
            type="button"
            onClick={handleVoiceInput}
            disabled={loading || isVoiceMode}
            className="px-3 py-2.5 sm:py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            title="Voice input (Premium)"
          >
            {isVoiceMode ? '🎤' : '🎙️'}
          </button>
        )}
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={isVoiceMode ? 'Listening...' : 'Ask anything...'}
          className="flex-1 px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          disabled={loading || isVoiceMode}
        />
        <button
          type="submit"
          disabled={!message.trim() || loading || isVoiceMode}
          className="px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-xl font-medium text-sm sm:text-base disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm hover:shadow"
        >
          <span className="hidden sm:inline">{loading ? 'Sending...' : 'Send'}</span>
          <span className="sm:hidden">{loading ? '...' : '→'}</span>
        </button>
      </form>
    </div>
  );
}
