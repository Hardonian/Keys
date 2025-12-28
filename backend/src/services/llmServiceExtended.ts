import { llmService } from './llmService.js';
import type { LLMProvider } from '../types/filters.js';
import { logger } from '../utils/logger.js';

/**
 * Extended LLM service supporting additional providers
 */
export class ExtendedLLMService {
  /**
   * Call Together AI
   */
  async callTogetherAI(
    model: string,
    messages: Array<{ role: string; content: string }>,
    options?: { temperature?: number; maxTokens?: number; systemPrompt?: string }
  ) {
    const apiKey = process.env.TOGETHER_API_KEY;
    if (!apiKey) {
      throw new Error('Together AI API key not configured');
    }

    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: options?.systemPrompt
          ? [{ role: 'system', content: options.systemPrompt }, ...messages]
          : messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Together AI error: ${error}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      model?: string;
      usage?: { total_tokens?: number };
    };
    return {
      content: data.choices?.[0]?.message?.content || '',
      model: data.model || model,
      provider: 'together' as LLMProvider,
      tokensUsed: data.usage?.total_tokens,
      finishReason: undefined,
    };
  }

  /**
   * Call Groq
   */
  async callGroq(
    model: string,
    messages: Array<{ role: string; content: string }>,
    options?: { temperature?: number; maxTokens?: number; systemPrompt?: string }
  ) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('Groq API key not configured');
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: options?.systemPrompt
          ? [{ role: 'system', content: options.systemPrompt }, ...messages]
          : messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Groq error: ${error}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      model?: string;
      usage?: { total_tokens?: number };
    };
    return {
      content: data.choices?.[0]?.message?.content || '',
      model: data.model || model,
      provider: 'groq' as LLMProvider,
      tokensUsed: data.usage?.total_tokens,
      finishReason: undefined,
    };
  }

  /**
   * Call Mistral AI
   */
  async callMistral(
    model: string,
    messages: Array<{ role: string; content: string }>,
    options?: { temperature?: number; maxTokens?: number; systemPrompt?: string }
  ) {
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      throw new Error('Mistral API key not configured');
    }

    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: options?.systemPrompt
          ? [{ role: 'system', content: options.systemPrompt }, ...messages]
          : messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Mistral error: ${error}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      model?: string;
      usage?: { total_tokens?: number };
    };
    return {
      content: data.choices?.[0]?.message?.content || '',
      model: data.model || model,
      provider: 'mistral' as LLMProvider,
      tokensUsed: data.usage?.total_tokens,
      finishReason: undefined,
    };
  }

  /**
   * Call Cohere
   */
  async callCohere(
    model: string,
    messages: Array<{ role: string; content: string }>,
    options?: { temperature?: number; maxTokens?: number; systemPrompt?: string }
  ) {
    const apiKey = process.env.COHERE_API_KEY;
    if (!apiKey) {
      throw new Error('Cohere API key not configured');
    }

    // Cohere uses a different format
    const prompt = messages.map((m) => `${m.role}: ${m.content}`).join('\n');
    const fullPrompt = options?.systemPrompt ? `${options.systemPrompt}\n\n${prompt}` : prompt;

    const response = await fetch('https://api.cohere.ai/v1/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        prompt: fullPrompt,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Cohere error: ${error}`);
    }

    const data = (await response.json()) as {
      generations?: Array<{ text?: string }>;
      meta?: {
        tokens?: {
          input_tokens?: number;
          output_tokens?: number;
        };
      };
    };
    return {
      content: data.generations?.[0]?.text || '',
      model,
      provider: 'cohere' as LLMProvider,
      tokensUsed: data.meta?.tokens?.input_tokens
        ? data.meta.tokens.input_tokens + (data.meta.tokens.output_tokens || 0)
        : undefined,
      finishReason: undefined,
    };
  }

  /**
   * Call Perplexity
   */
  async callPerplexity(
    model: string,
    messages: Array<{ role: string; content: string }>,
    options?: { temperature?: number; maxTokens?: number; systemPrompt?: string }
  ) {
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) {
      throw new Error('Perplexity API key not configured');
    }

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: options?.systemPrompt
          ? [{ role: 'system', content: options.systemPrompt }, ...messages]
          : messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Perplexity error: ${error}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      model?: string;
      usage?: { total_tokens?: number };
    };
    return {
      content: data.choices?.[0]?.message?.content || '',
      model: data.model || model,
      provider: 'perplexity' as LLMProvider,
      tokensUsed: data.usage?.total_tokens,
      finishReason: undefined,
    };
  }

  /**
   * Detect local Ollama instance
   */
  async detectOllama(): Promise<{ available: boolean; models: string[] }> {
    try {
      const response = await fetch('http://localhost:11434/api/tags', {
        method: 'GET',
        signal: AbortSignal.timeout(2000), // 2 second timeout
      });

      if (response.ok) {
        const data = (await response.json()) as { models?: Array<{ name?: string }> };
        return {
          available: true,
          models: (data.models || []).map((m) => m.name || ''),
        };
      }
    } catch (error) {
      logger.debug('Ollama not detected', error as Error);
    }

    return { available: false, models: [] };
  }

  /**
   * Detect LM Studio instance
   */
  async detectLMStudio(): Promise<{ available: boolean; models: string[] }> {
    try {
      const response = await fetch('http://localhost:1234/v1/models', {
        method: 'GET',
        signal: AbortSignal.timeout(2000),
      });

      if (response.ok) {
        const data = (await response.json()) as { data?: Array<{ id?: string }> };
        return {
          available: true,
          models: (data.data || []).map((m) => m.id || ''),
        };
      }
    } catch (error) {
      logger.debug('LM Studio not detected', error as Error);
    }

    return { available: false, models: [] };
  }

  /**
   * Detect vLLM instance
   */
  async detectVLLM(baseUrl?: string): Promise<{ available: boolean; models: string[] }> {
    const url = baseUrl || process.env.VLLM_BASE_URL || 'http://localhost:8000';
    try {
      const response = await fetch(`${url}/v1/models`, {
        method: 'GET',
        signal: AbortSignal.timeout(2000),
      });

      if (response.ok) {
        const data = (await response.json()) as { data?: Array<{ id?: string }> };
        return {
          available: true,
          models: (data.data || []).map((m) => m.id || ''),
        };
      }
    } catch (error) {
      logger.debug('vLLM not detected', error as Error);
    }

    return { available: false, models: [] };
  }
}

export const extendedLLMService = new ExtendedLLMService();
