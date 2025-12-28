import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../utils/logger.js';
import type { LLMProvider } from '../types/filters.js';

export interface LLMRequest {
  provider: LLMProvider;
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface LLMResponse {
  content: string;
  model: string;
  provider: LLMProvider;
  tokensUsed?: number;
  finishReason?: string;
}

export class UnifiedLLMService {
  private openai: OpenAI | null = null;
  private anthropic: Anthropic | null = null;
  private googleAI: GoogleGenerativeAI | null = null;
  private localLLMBaseUrl: string | null = null;

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    // OpenAI
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        baseURL: process.env.OPENAI_BASE_URL, // For local OpenAI-compatible APIs
      });
    }

    // Anthropic
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    }

    // Google Gemini
    if (process.env.GOOGLE_AI_API_KEY) {
      this.googleAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
    }

    // Local LLM (Ollama, LM Studio, vLLM, etc.)
    this.localLLMBaseUrl = process.env.LOCAL_LLM_BASE_URL || null;
  }

  /**
   * Unified method to call any LLM provider
   */
  async generate(request: LLMRequest): Promise<LLMResponse> {
    try {
      switch (request.provider) {
        case 'openai':
          return await this.callOpenAI(request);
        case 'anthropic':
          return await this.callAnthropic(request);
        case 'google':
          return await this.callGoogle(request);
      case 'meta':
        return await this.callLocalLLM(request, 'meta');
      case 'custom':
        return await this.callLocalLLM(request, 'custom');
      case 'ollama':
      case 'lmstudio':
      case 'vllm':
        return await this.callLocalLLM(request, request.provider);
      case 'together':
      case 'groq':
      case 'mistral':
      case 'cohere':
      case 'perplexity':
        return await this.callExtendedProvider(request);
      default:
        throw new Error(`Unsupported provider: ${request.provider}`);
      }
    } catch (error) {
      logger.error('LLM generation error', error as Error, { provider: request.provider });
      throw error;
    }
  }

  /**
   * OpenAI / OpenAI-compatible API (Ollama, LM Studio, etc.)
   */
  private async callOpenAI(request: LLMRequest): Promise<LLMResponse> {
    if (!this.openai) {
      throw new Error('OpenAI API key not configured');
    }

    const messages = request.systemPrompt
      ? [{ role: 'system', content: request.systemPrompt }, ...request.messages]
      : request.messages;

    const response = await this.openai.chat.completions.create({
      model: request.model,
      messages: messages as any,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens,
    });

    const choice = response.choices[0];
    if (!choice || !choice.message) {
      throw new Error('No response from OpenAI');
    }

    return {
      content: choice.message.content || '',
      model: response.model,
      provider: 'openai',
      tokensUsed: response.usage?.total_tokens,
      finishReason: choice.finish_reason || undefined,
    };
  }

  /**
   * Anthropic Claude
   */
  private async callAnthropic(request: LLMRequest): Promise<LLMResponse> {
    if (!this.anthropic) {
      throw new Error('Anthropic API key not configured');
    }

    // Convert messages format for Anthropic
    const systemMessage = request.systemPrompt || '';
    const anthropicMessages = request.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })) as any;

    const response = await (this.anthropic as any).messages.create({
      model: request.model,
      system: systemMessage,
      messages: anthropicMessages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? 4096,
    });

    const content = response.content.find((c: any) => c.type === 'text');
    if (!content || content.type !== 'text') {
      throw new Error('No text content in Anthropic response');
    }

    return {
      content: content.text,
      model: response.model,
      provider: 'anthropic',
      tokensUsed: response.usage?.input_tokens
        ? response.usage.input_tokens + (response.usage.output_tokens || 0)
        : undefined,
      finishReason: response.stop_reason || undefined,
    };
  }

  /**
   * Google Gemini
   */
  private async callGoogle(request: LLMRequest): Promise<LLMResponse> {
    if (!this.googleAI) {
      throw new Error('Google AI API key not configured');
    }

    const model = this.googleAI.getGenerativeModel({
      model: request.model,
      ...(request.systemPrompt && { systemInstruction: request.systemPrompt }),
    });

    // Convert messages format for Gemini
    const geminiMessages = request.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    const generationConfig = {
      temperature: request.temperature ?? 0.7,
      maxOutputTokens: request.maxTokens,
    };

    const chat = model.startChat({
      history: geminiMessages.slice(0, -1) as any,
      generationConfig,
    });

    const lastMessage = geminiMessages[geminiMessages.length - 1];
    const result = await chat.sendMessage(lastMessage.parts[0].text);
    const response = await result.response;
    const text = response.text();

    return {
      content: text,
      model: request.model,
      provider: 'google',
      finishReason: response.candidates?.[0]?.finishReason || undefined,
    };
  }

  /**
   * Local LLM (Ollama, LM Studio, vLLM, etc.) - OpenAI-compatible
   */
  private async callLocalLLM(
    request: LLMRequest,
    providerType: 'meta' | 'custom' | 'ollama' | 'lmstudio' | 'vllm'
  ): Promise<LLMResponse> {
    // Determine base URL based on provider
    let baseUrl = this.localLLMBaseUrl;
    if (!baseUrl) {
      switch (providerType) {
        case 'ollama':
          baseUrl = 'http://localhost:11434';
          break;
        case 'lmstudio':
          baseUrl = 'http://localhost:1234';
          break;
        case 'vllm':
          baseUrl = process.env.VLLM_BASE_URL || 'http://localhost:8000';
          break;
        default:
          baseUrl = 'http://localhost:11434'; // Default to Ollama
      }
    }

    // Use OpenAI-compatible API format
    const messages = request.systemPrompt
      ? [{ role: 'system', content: request.systemPrompt }, ...request.messages]
      : request.messages;

    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: request.model,
        messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Local LLM error: ${error}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string }; finish_reason?: string }>;
      model?: string;
      usage?: { total_tokens?: number };
    };
    const choice = data.choices?.[0];

    if (!choice || !choice.message) {
      throw new Error('No response from local LLM');
    }

    return {
      content: choice.message.content || '',
      model: data.model || request.model,
      provider: providerType,
      tokensUsed: data.usage?.total_tokens,
      finishReason: choice.finish_reason || undefined,
    };
  }

  /**
   * Detect available local LLM models
   */
  async detectLocalModels(): Promise<string[]> {
    const baseUrl = this.localLLMBaseUrl || 'http://localhost:11434';

    try {
      // Try Ollama API
      const response = await fetch(`${baseUrl}/api/tags`, {
        method: 'GET',
      });

      if (response.ok) {
        const data = (await response.json()) as { models?: Array<{ name?: string; model?: string }> };
        return (data.models || []).map((m) => m.name || m.model || '');
      }

      // Try OpenAI-compatible list models endpoint
      const modelsResponse = await fetch(`${baseUrl}/v1/models`, {
        method: 'GET',
      });

      if (modelsResponse.ok) {
        const modelsData = (await modelsResponse.json()) as { data?: Array<{ id: string }> };
        return (modelsData.data || []).map((m) => m.id);
      }
    } catch (error) {
      logger.debug('Local LLM detection failed', error as Error);
    }

    return [];
  }

  /**
   * Check if a provider is available
   */
  isProviderAvailable(provider: LLMProvider): boolean {
    switch (provider) {
      case 'openai':
        return this.openai !== null;
      case 'anthropic':
        return this.anthropic !== null;
      case 'google':
        return this.googleAI !== null;
      case 'meta':
      case 'custom':
        return this.localLLMBaseUrl !== null;
      default:
        return false;
    }
  }

  /**
   * Call extended providers (Together, Groq, etc.)
   */
  private async callExtendedProvider(request: LLMRequest): Promise<LLMResponse> {
    const { extendedLLMService } = await import('./llmServiceExtended.js');

    switch (request.provider) {
      case 'together':
        return await extendedLLMService.callTogetherAI(
          request.model,
          request.messages,
          {
            temperature: request.temperature,
            maxTokens: request.maxTokens,
            systemPrompt: request.systemPrompt,
          }
        );
      case 'groq':
        return await extendedLLMService.callGroq(
          request.model,
          request.messages,
          {
            temperature: request.temperature,
            maxTokens: request.maxTokens,
            systemPrompt: request.systemPrompt,
          }
        );
      case 'mistral':
        return await extendedLLMService.callMistral(
          request.model,
          request.messages,
          {
            temperature: request.temperature,
            maxTokens: request.maxTokens,
            systemPrompt: request.systemPrompt,
          }
        );
      case 'cohere':
        return await extendedLLMService.callCohere(
          request.model,
          request.messages,
          {
            temperature: request.temperature,
            maxTokens: request.maxTokens,
            systemPrompt: request.systemPrompt,
          }
        );
      case 'perplexity':
        return await extendedLLMService.callPerplexity(
          request.model,
          request.messages,
          {
            temperature: request.temperature,
            maxTokens: request.maxTokens,
            systemPrompt: request.systemPrompt,
          }
        );
      default:
        throw new Error(`Unsupported extended provider: ${request.provider}`);
    }
  }

  /**
   * Get available models for a provider
   */
  getAvailableModels(provider: LLMProvider): string[] {
    const models: Record<string, string[]> = {
      openai: [
        'gpt-4-turbo-preview',
        'gpt-4',
        'gpt-3.5-turbo',
        'o1-preview',
        'o1-mini',
      ],
      anthropic: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
      google: ['gemini-pro', 'gemini-ultra', 'gemini-1.5-pro'],
      meta: ['llama-3-70b', 'llama-3-8b', 'llama-2-70b', 'llama-2-13b', 'llama-2-7b'],
      ollama: [],
      lmstudio: [],
      vllm: [],
      together: [
        'meta-llama/Llama-3-70b-chat-hf',
        'mistralai/Mixtral-8x7B-Instruct-v0.1',
        'Qwen/Qwen2.5-72B-Instruct',
      ],
      groq: ['llama-3-70b-8192', 'mixtral-8x7b-32768', 'gemma-7b-it'],
      mistral: ['mistral-large', 'mistral-medium', 'mistral-small'],
      cohere: ['command-r-plus', 'command-r', 'command'],
      perplexity: ['llama-3-sonar-large-32k-online', 'llama-3-sonar-small-32k-online'],
      custom: [],
    };

    return models[provider] || [];
  }
}

export const llmService = new UnifiedLLMService();
