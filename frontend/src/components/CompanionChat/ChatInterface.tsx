'use client';

import { useState, useRef, useEffect } from 'react';
import { InputPanel } from './InputPanel';
import { SuggestionCard } from '../OutputPanel/SuggestionCard';
import { ReadOnlyBanner } from '@/components/Security/ReadOnlyBanner';
import { CannotDoStatement } from '@/components/Security/CannotDoStatement';
import { usePromptAssembly } from '@/hooks/usePromptAssembly';
import { useAgentOrchestration } from '@/hooks/useAgentOrchestration';
import { usePremiumFeatures } from '@/hooks/usePremiumFeatures';
import { useUserProfile } from '@/hooks/useUserProfile';
import type { VibeConfig, AgentOutput } from '@/types';
import type { InputFilter } from '@/types/filters';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  output?: AgentOutput;
}

interface ChatInterfaceProps {
  userId: string;
  initialVibeConfig?: Partial<VibeConfig>;
}

export function ChatInterface({ userId, initialVibeConfig }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentVibeConfig, setCurrentVibeConfig] = useState<Partial<VibeConfig>>(
    initialVibeConfig || {}
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { assemblePrompt, loading: assembling } = usePromptAssembly();
  const { orchestrate, loading: orchestrating } = useAgentOrchestration();

  const loading = assembling || orchestrating;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const { isPremium } = usePremiumFeatures(userId);
  const { profile } = useUserProfile(userId);

  const handleSend = async (
    messageText: string,
    vibeConfig: Partial<VibeConfig>,
    inputFilter?: InputFilter
  ) => {
    // Update vibe config
    setCurrentVibeConfig(vibeConfig);

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      // Assemble prompt (will apply input filters internally if provided)
      const promptAssembly = await assemblePrompt(
        messageText,
        vibeConfig,
        inputFilter
      );

      // Orchestrate agent
      const agentOutput = await orchestrate(
        promptAssembly,
        messageText,
        messageText
      );

      // Add assistant message with output
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: agentOutput.content as string,
        timestamp: new Date(),
        output: agentOutput,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error processing message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900" role="region" aria-label="Chat interface">
      {/* Read-only mode banner */}
      <ReadOnlyBanner />
      
      {/* Messages Area - Mobile optimized with better spacing */}
      <div 
        className="flex-1 overflow-y-auto scrollbar-thin px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-5 md:space-y-6"
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        {messages.length === 0 && (
          <div className="text-center text-slate-600 dark:text-slate-400 mt-8 sm:mt-12 md:mt-16 px-4 max-w-3xl mx-auto">
            <div className="mb-6 sm:mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mb-4 shadow-lg">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Welcome to Cursor Venture Companion
              </h2>
              <p className="text-base sm:text-lg md:text-xl mb-2 text-slate-700 dark:text-slate-300">
                Your AI cofounder for ideation, specification, implementation, and operations.
              </p>
              <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mb-6 sm:mb-8">
                Start a conversation to get personalized assistance tailored to your needs.
              </p>
            </div>
            <div className="text-left max-w-2xl mx-auto mt-8 sm:mt-10 space-y-3">
              <p className="text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Try these prompts:
              </p>
              <div className="grid gap-2 sm:gap-3" role="list">
                {[
                  'Draft an RFC for adding SSO to our SaaS app',
                  'Design the architecture for a telemetry pipeline',
                  'Refactor our monolith into modular boundaries',
                  'Create a test plan for this critical module',
                  'Propose a weekly evolution cycle to reduce tech debt',
                ].map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(prompt, currentVibeConfig)}
                    className="text-left px-4 py-3 sm:px-5 sm:py-3.5 text-sm sm:text-base text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all duration-200 group"
                    role="listitem"
                  >
                    <span className="flex items-start gap-3">
                      <span className="text-blue-500 mt-0.5 group-hover:scale-110 transition-transform" aria-hidden="true">💡</span>
                      <span className="flex-1">{prompt}</span>
                      <svg className="w-4 h-4 text-slate-400 group-hover:text-blue-500 mt-0.5 opacity-0 group-hover:opacity-100 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            } animate-in fade-in slide-in-from-bottom-2 duration-300`}
            role="article"
            aria-label={`${message.role === 'user' ? 'Your' : 'Assistant'} message`}
          >
            <div
              className={`max-w-[90%] xs:max-w-[85%] sm:max-w-[75%] md:max-w-[65%] lg:max-w-[55%] xl:max-w-[50%] rounded-2xl px-4 py-3 sm:px-5 sm:py-4 md:px-6 md:py-4 shadow-sm hover:shadow-md transition-shadow ${
                message.role === 'user'
                  ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 rounded-bl-sm border border-slate-200 dark:border-slate-700'
              }`}
            >
              <p className="whitespace-pre-wrap text-sm sm:text-base md:text-[15px] leading-relaxed break-words prose prose-sm dark:prose-invert max-w-none">
                {message.content}
              </p>
              {message.output && (
                <div className="mt-3 sm:mt-4" role="region" aria-label="AI suggestions">
                  <SuggestionCard output={message.output} />
                </div>
              )}
              <time 
                className={`text-xs mt-2 block ${
                  message.role === 'user' 
                    ? 'text-blue-100' 
                    : 'text-slate-500 dark:text-slate-400'
                }`}
                dateTime={message.timestamp.toISOString()}
              >
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </time>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start animate-in fade-in" role="status" aria-live="polite" aria-label="AI is thinking">
            <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-bl-sm px-4 py-3 sm:px-5 sm:py-4 border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5" aria-hidden="true">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  <span className="sr-only">AI is </span>Thinking...
                </p>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Panel */}
      <InputPanel
        onSend={handleSend}
        initialVibeConfig={currentVibeConfig}
        loading={loading}
        isPremium={isPremium}
        userProfile={profile || undefined}
      />
      
      {/* Cannot-do statement */}
      <CannotDoStatement />
    </div>
  );
}
