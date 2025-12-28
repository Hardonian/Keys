export type LLMProvider =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'meta'
  | 'custom'
  | 'ollama'
  | 'lmstudio'
  | 'vllm'
  | 'together'
  | 'groq'
  | 'mistral'
  | 'cohere'
  | 'perplexity';

export type InputStyle =
  | 'concise'
  | 'detailed'
  | 'technical'
  | 'conversational'
  | 'structured'
  | 'prompt_engineering'
  | 'chain_of_thought'
  | 'few_shot';

export type OutputFormat =
  | 'markdown'
  | 'json'
  | 'code'
  | 'plain_text'
  | 'structured_prompt'
  | 'provider_native';

export interface InputFilter {
  model?: string;
  provider?: LLMProvider;
  style?: InputStyle;
  outputFormat?: OutputFormat;
  tone?: 'playful' | 'serious' | 'technical' | 'casual' | 'balanced';
  maxTokens?: number;
  temperature?: number;
  useProviderGuidelines?: boolean;
  usePromptEngineering?: boolean;
}

export interface ReformattedInput {
  originalInput: string;
  reformattedInput: string;
  systemPrompt: string;
  userPrompt: string;
  metadata: {
    style: InputStyle;
    provider: LLMProvider;
    model: string;
    estimatedTokens: number;
    techniques: string[];
  };
}

export interface PremiumFeatures {
  voiceToText: boolean;
  increasedTokenLimit: number;
  advancedFilters: boolean;
  customPrompts: boolean;
}

export interface TranscriptionResult {
  text: string;
  confidence?: number;
  language?: string;
  duration?: number;
}
