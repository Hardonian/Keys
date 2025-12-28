'use client';

import React, { useState, useRef, useEffect } from 'react';
import { InputPanel } from './InputPanel';
import { SuggestionCard } from '../OutputPanel/SuggestionCard';
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
        userId,
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
    <div className="flex flex-col h-full min-h-0">
      {/* Messages Area - Mobile optimized */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-3 sm:px-4 md:px-6 py-4 space-y-3 sm:space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-slate-600 dark:text-slate-400 mt-4 sm:mt-8 px-4">
            <h2 className="text-xl sm:text-2xl font-bold mb-2 text-slate-900 dark:text-slate-50">
              Welcome to System Prompts
            </h2>
            <p className="text-sm sm:text-base mb-4 max-w-2xl mx-auto">
              Your Cursor business and development operations companion.
            </p>
            <div className="text-left max-w-2xl mx-auto mt-6 space-y-2">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Try these prompts:
              </p>
              <ul className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 space-y-1.5 list-none">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>&quot;Draft an RFC for adding SSO to our SaaS app&quot;</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>&quot;Design the architecture for a telemetry pipeline&quot;</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>&quot;Refactor our monolith into modular boundaries&quot;</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>&quot;Create a test plan for this critical module&quot;</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>&quot;Propose a weekly evolution cycle to reduce tech debt&quot;</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            } animate-in fade-in slide-in-from-bottom-2 duration-300`}
          >
            <div
              className={`max-w-[85%] sm:max-w-[75%] md:max-w-[65%] lg:max-w-[55%] rounded-2xl px-4 py-3 sm:px-5 sm:py-4 shadow-sm ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 rounded-bl-sm border border-slate-200 dark:border-slate-700'
              }`}
            >
              <p className="whitespace-pre-wrap text-sm sm:text-base leading-relaxed break-words">
                {message.content}
              </p>
              {message.output && (
                <div className="mt-3 sm:mt-4">
                  <SuggestionCard output={message.output} />
                </div>
              )}
              <p className={`text-xs mt-2 ${
                message.role === 'user' 
                  ? 'text-blue-100' 
                  : 'text-slate-500 dark:text-slate-400'
              }`}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start animate-in fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-bl-sm px-4 py-3 sm:px-5 sm:py-4 border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Thinking...</p>
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
    </div>
  );
}
