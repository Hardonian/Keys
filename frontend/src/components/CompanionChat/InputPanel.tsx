'use client';

import { useState, useEffect } from 'react';
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
      interface SpeechRecognition extends EventTarget {
        continuous: boolean;
        interimResults: boolean;
        start(): void;
        onresult: ((event: SpeechRecognitionEvent) => void) | null;
        onerror: ((event: Event) => void) | null;
      }
      interface SpeechRecognitionEvent extends Event {
        results: SpeechRecognitionResultList;
      }
      interface SpeechRecognitionResultList {
        [index: number]: SpeechRecognitionResult;
        length: number;
      }
      interface SpeechRecognitionResult {
        [index: number]: SpeechRecognitionAlternative;
        isFinal: boolean;
      }
      interface SpeechRecognitionAlternative {
        transcript: string;
      }
      
      const SpeechRecognition = (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognition }).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert('Voice recognition not supported in this browser');
        setIsVoiceMode(false);
        return;
      }
      
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = async (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0]?.[0]?.transcript || '';
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
    <div className="border-t border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm pb-safe" role="region" aria-label="Message input">
      {/* Slider Controls - Collapsible on mobile */}
      <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
        {isMobile && (
          <button
            type="button"
            onClick={() => setShowSliders(!showSliders)}
            className="w-full flex items-center justify-between text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg px-2"
            aria-expanded={showSliders}
            aria-controls="vibe-settings"
          >
            <span>Vibe Settings</span>
            <span className={`transform transition-transform ${showSliders ? 'rotate-180' : ''}`} aria-hidden="true">
              ▼
            </span>
          </button>
        )}
        <div 
          id="vibe-settings"
          className={`grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 ${isMobile && !showSliders ? 'hidden' : 'grid'}`}
          role="group"
          aria-label="Vibe configuration settings"
        >
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

      {/* Message Input - Mobile optimized with modern design */}
      <form 
        onSubmit={handleSubmit} 
        className="px-3 sm:px-4 md:px-6 pb-safe pb-3 sm:pb-4 flex gap-2 sm:gap-3 items-end"
        role="form"
        aria-label="Message input form"
      >
        {isPremium && (
          <button
            type="button"
            onClick={handleVoiceInput}
            disabled={loading || isVoiceMode}
            className="flex-shrink-0 px-3 py-2.5 sm:py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 active:scale-95"
            title="Voice input (Premium)"
            aria-label={isVoiceMode ? 'Stop voice input' : 'Start voice input'}
            aria-pressed={isVoiceMode}
          >
            <span className="text-lg" aria-hidden="true">{isVoiceMode ? '🎤' : '🎙️'}</span>
          </button>
        )}
        <label htmlFor="message-input" className="sr-only">
          Type your message
        </label>
        <div className="flex-1 relative">
          <textarea
            id="message-input"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={isVoiceMode ? 'Listening...' : 'Ask anything...'}
            rows={1}
            className="w-full px-4 py-2.5 sm:py-3 pr-12 text-sm sm:text-base border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none min-h-[44px] max-h-32 overflow-y-auto"
            disabled={loading || isVoiceMode}
            aria-label="Message input"
            aria-describedby={isVoiceMode ? 'voice-mode-indicator' : undefined}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          {message.trim() && (
            <button
              type="button"
              onClick={() => setMessage('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
              aria-label="Clear message"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        {isVoiceMode && <span id="voice-mode-indicator" className="sr-only">Voice input mode is active</span>}
        <button
          type="submit"
          disabled={!message.trim() || loading || isVoiceMode}
          className="flex-shrink-0 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-xl font-medium text-sm sm:text-base disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center gap-2"
          aria-label={loading ? 'Sending message' : 'Send message'}
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="hidden sm:inline">Sending...</span>
            </>
          ) : (
            <>
              <span className="hidden sm:inline">Send</span>
              <svg className="w-5 h-5 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
