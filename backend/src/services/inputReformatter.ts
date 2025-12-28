import type { InputFilter, ReformattedInput, LLMProvider, InputStyle } from '../types/filters.js';
import { logger } from '../utils/logger.js';

export class InputReformatter {
  /**
   * Reformat user input based on selected filters
   */
  async reformatInput(
    userInput: string,
    filter: InputFilter
  ): Promise<ReformattedInput> {
    const style: InputStyle = filter.style || 'conversational';
    const provider = filter.provider || 'openai';
    const model = filter.model || this.getDefaultModel(provider);

    // Apply style-based reformatting
    const reformattedInput = this.applyStyleFormatting(userInput, style);

    // Generate system prompt based on provider and style
    const systemPrompt = this.generateSystemPrompt(provider, model, style, filter);

    // Generate user prompt (may be reformatted)
    const userPrompt = this.formatUserPrompt(reformattedInput, style, provider);

    // Estimate tokens
    const estimatedTokens = this.estimateTokens(systemPrompt + userPrompt);

    // Identify techniques used
    const techniques = this.identifyTechniques(style, filter);

    return {
      originalInput: userInput,
      reformattedInput,
      systemPrompt,
      userPrompt,
      metadata: {
        style,
        provider,
        model,
        estimatedTokens,
        techniques,
      },
    };
  }

  /**
   * Apply style-based formatting to input
   * Optimized for common cases
   */
  private applyStyleFormatting(input: string, style: InputStyle): string {
    switch (style) {
      case 'concise':
        return this.makeConcise(input);

      case 'detailed':
        return this.addDetail(input);

      case 'technical':
        return this.makeTechnical(input);

      case 'conversational':
        return this.makeConversational(input);

      case 'structured':
        return this.makeStructured(input);

      case 'prompt_engineering':
        return this.applyPromptEngineering(input);

      case 'chain_of_thought':
        return this.applyChainOfThought(input);

      case 'few_shot':
        return this.applyFewShot(input);

      default:
        // TypeScript exhaustiveness check - should never reach here
        return input;
    }
  }

  /**
   * Generate system prompt based on provider guidelines
   */
  private generateSystemPrompt(
    provider: LLMProvider,
    model: string,
    style: InputStyle,
    filter: InputFilter
  ): string {
    const basePrompt = this.getProviderBasePrompt(provider, model);
    const styleInstructions = this.getStyleInstructions(style);
    const formatInstructions = filter.outputFormat
      ? this.getFormatInstructions(filter.outputFormat)
      : '';

    const guidelines = filter.useProviderGuidelines
      ? this.getProviderGuidelines(provider, model)
      : '';

    const promptEngineering = filter.usePromptEngineering
      ? this.getPromptEngineeringGuidelines(style)
      : '';

    return [
      basePrompt,
      styleInstructions,
      formatInstructions,
      guidelines,
      promptEngineering,
    ]
      .filter(Boolean)
      .join('\n\n');
  }

  /**
   * Format user prompt according to style and provider
   */
  private formatUserPrompt(
    input: string,
    style: InputStyle,
    provider: LLMProvider
  ): string {
    switch (style) {
      case 'chain_of_thought':
        return `Let's think step by step:\n\n${input}`;

      case 'few_shot':
        return this.formatFewShot(input, provider);

      case 'structured':
        return this.formatStructured(input);

      case 'prompt_engineering':
        return this.formatPromptEngineering(input, provider);

      default:
        return input;
    }
  }

  // Style formatting methods
  private makeConcise(input: string): string {
    // Remove filler words, shorten sentences
    return input
      .replace(/\b(very|really|quite|rather|pretty|somewhat)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private addDetail(input: string): string {
    // Add context and detail markers
    return `Please provide a detailed response with examples and context:\n\n${input}`;
  }

  private makeTechnical(input: string): string {
    // Add technical precision markers
    return `[Technical Request] ${input}\n\nProvide a technically precise response with implementation details.`;
  }

  private makeConversational(input: string): string {
    // Keep natural flow
    return input;
  }

  private makeStructured(input: string): string {
    // Add structure markers
    return `Task: ${input}\n\nPlease structure your response with:\n1. Overview\n2. Key Points\n3. Implementation\n4. Considerations`;
  }

  private applyPromptEngineering(input: string): string {
    return `You are an expert AI assistant. Follow these guidelines:\n- Be precise and actionable\n- Provide examples when helpful\n- Structure your response clearly\n\nTask: ${input}`;
  }

  private applyChainOfThought(input: string): string {
    return `${input}\n\nThink through this step by step, showing your reasoning.`;
  }

  private applyFewShot(input: string): string {
    return `Here are some examples:\n\n[Examples would be inserted here]\n\nNow, for this request: ${input}`;
  }

  // Provider-specific prompts
  private getProviderBasePrompt(provider: LLMProvider, model: string): string {
    const prompts: Partial<Record<LLMProvider, string>> = {
      openai: `You are a helpful AI assistant. You are ${model}, a large language model trained by OpenAI.`,
      anthropic: `You are Claude, an AI assistant created by Anthropic. You are helpful, harmless, and honest.`,
      google: `You are a helpful AI assistant powered by Google's ${model}.`,
      meta: `You are a helpful AI assistant powered by Meta's ${model}.`,
      ollama: `You are a helpful AI assistant running locally via Ollama (${model}).`,
      lmstudio: `You are a helpful AI assistant running locally via LM Studio (${model}).`,
      vllm: `You are a helpful AI assistant running locally via vLLM (${model}).`,
      together: `You are a helpful AI assistant powered by Together AI (${model}).`,
      groq: `You are a helpful AI assistant powered by Groq (${model}).`,
      mistral: `You are a helpful AI assistant powered by Mistral AI (${model}).`,
      cohere: `You are a helpful AI assistant powered by Cohere (${model}).`,
      perplexity: `You are a helpful AI assistant powered by Perplexity (${model}).`,
      custom: 'You are a helpful AI assistant.',
    };

    return prompts[provider] || prompts.custom || 'You are a helpful AI assistant.';
  }

  private getProviderGuidelines(provider: LLMProvider, model: string): string {
    const guidelines: Partial<Record<LLMProvider, string>> = {
      openai: `
OpenAI Best Practices:
- Use clear, direct language
- Structure responses with headers when appropriate
- Provide code examples in markdown code blocks
- Be concise but thorough
- Use numbered lists for step-by-step instructions
`.trim(),

      anthropic: `
Anthropic Guidelines:
- Be helpful, harmless, and honest
- Acknowledge uncertainty when appropriate
- Provide balanced perspectives
- Use clear, natural language
- Structure longer responses with clear sections
`.trim(),

      google: `
Google AI Guidelines:
- Be factual and accurate
- Cite sources when possible
- Use clear, structured responses
- Provide actionable insights
`.trim(),

      meta: `
Meta AI Guidelines:
- Be helpful and informative
- Use clear, structured responses
- Provide practical examples
`.trim(),

      ollama: 'Use clear, natural language. Optimize for local inference.',
      lmstudio: 'Use clear, natural language. Optimize for local inference.',
      vllm: 'Use clear, natural language. Optimize for high-throughput inference.',
      together: 'Use clear, structured responses. Optimize for cost-effective inference.',
      groq: 'Use clear, fast responses. Optimize for low-latency inference.',
      mistral: 'Use clear, structured responses. Follow Mistral AI best practices.',
      cohere: 'Use clear, factual responses. Optimize for command models.',
      perplexity: 'Use clear, research-backed responses. Cite sources when possible.',
      custom: '',
    };

    return guidelines[provider] || '';
  }

  private getStyleInstructions(style: InputStyle): string {
    const instructions: Record<InputStyle, string> = {
      concise: 'Be concise and to the point. Remove unnecessary words.',
      detailed: 'Provide comprehensive details, examples, and context.',
      technical: 'Use technical terminology and provide implementation details.',
      conversational: 'Use natural, conversational language.',
      structured: 'Structure your response with clear sections and formatting.',
      prompt_engineering: 'Apply prompt engineering best practices for optimal results.',
      chain_of_thought: 'Show your reasoning process step by step.',
      few_shot: 'Use examples to guide your response pattern.',
    };

    return instructions[style] || '';
  }

  private getFormatInstructions(format: string): string {
    const instructions: Record<string, string> = {
      markdown: 'Format your response using Markdown syntax with headers, lists, and code blocks.',
      json: 'Respond in valid JSON format.',
      code: 'Provide code examples with proper syntax highlighting.',
      plain_text: 'Use plain text formatting.',
      structured_prompt: 'Format as a structured prompt template.',
      provider_native: 'Use the native format recommended by the LLM provider.',
    };

    return instructions[format] || '';
  }

  private getPromptEngineeringGuidelines(style: InputStyle): string {
    return `
Prompt Engineering Techniques Applied:
- ${style === 'chain_of_thought' ? 'Chain-of-Thought reasoning' : 'Standard reasoning'}
- ${style === 'few_shot' ? 'Few-shot learning with examples' : 'Zero-shot learning'}
- Clear task definition
- Structured output format
`.trim();
  }

  private formatFewShot(input: string, provider: LLMProvider): string {
    // In production, this would include actual examples from user's history
    return `Example 1: [Previous successful interaction]\nExample 2: [Another example]\n\nNow: ${input}`;
  }

  private formatStructured(input: string): string {
    return `## Task\n${input}\n\n## Requirements\n- Clear structure\n- Actionable steps\n- Examples where relevant`;
  }

  private formatPromptEngineering(input: string, provider: LLMProvider): string {
    const role = this.getRoleForProvider(provider);
    return `Role: ${role}\n\nTask: ${input}\n\nInstructions:\n- Be precise\n- Provide examples\n- Structure clearly`;
  }

  private getRoleForProvider(provider: LLMProvider): string {
    const roles: Partial<Record<LLMProvider, string>> = {
      openai: 'Expert AI Assistant',
      anthropic: 'Claude, Expert Assistant',
      google: 'Expert AI Assistant',
      meta: 'Expert AI Assistant',
      ollama: 'Expert AI Assistant (Local)',
      lmstudio: 'Expert AI Assistant (Local)',
      vllm: 'Expert AI Assistant (Local)',
      together: 'Expert AI Assistant',
      groq: 'Expert AI Assistant',
      mistral: 'Expert AI Assistant',
      cohere: 'Expert AI Assistant',
      perplexity: 'Expert AI Assistant',
      custom: 'Expert Assistant',
    };
    return roles[provider] || roles.custom || 'Expert Assistant';
  }

  private identifyTechniques(style: InputStyle, filter: InputFilter): string[] {
    const techniques: string[] = [];

    if (filter.usePromptEngineering) {
      techniques.push('Prompt Engineering');
    }

    if (filter.useProviderGuidelines) {
      techniques.push('Provider Guidelines');
    }

    switch (style) {
      case 'chain_of_thought':
        techniques.push('Chain-of-Thought');
        break;
      case 'few_shot':
        techniques.push('Few-Shot Learning');
        break;
      case 'prompt_engineering':
        techniques.push('Advanced Prompt Engineering');
        break;
    }

    if (filter.outputFormat) {
      techniques.push(`${filter.outputFormat} Formatting`);
    }

    return techniques;
  }

  private estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token for English text
    return Math.ceil(text.length / 4);
  }

  private getDefaultModel(provider: LLMProvider): string {
    const defaults: Partial<Record<LLMProvider, string>> = {
      openai: 'gpt-4-turbo-preview',
      anthropic: 'claude-3-sonnet',
      google: 'gemini-pro',
      meta: 'llama-3',
      ollama: 'llama3',
      lmstudio: 'llama-3',
      vllm: 'llama-3',
      together: 'meta-llama/Llama-3-70b-chat-hf',
      groq: 'llama-3-70b-8192',
      mistral: 'mistral-medium',
      cohere: 'command-r-plus',
      perplexity: 'llama-3-sonar-large-32k-online',
      custom: 'custom-model',
    };
    return defaults[provider] || defaults.openai || 'gpt-4-turbo-preview';
  }
}

export const inputReformatter = new InputReformatter();
