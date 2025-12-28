import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateBody } from '../middleware/validation.js';
import { inputReformatter } from '../services/inputReformatter.js';
import { premiumService } from '../services/premiumService.js';
import { voiceToTextService } from '../services/voiceToTextService.js';
import { authMiddleware } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

const router = Router();

const reformatInputSchema = z.object({
  input: z.string().min(1),
  filter: z.object({
    model: z.string().optional(),
    provider: z.enum(['openai', 'anthropic', 'google', 'meta', 'custom']).optional(),
    style: z
      .enum([
        'concise',
        'detailed',
        'technical',
        'conversational',
        'structured',
        'prompt_engineering',
        'chain_of_thought',
        'few_shot',
      ])
      .optional(),
    outputFormat: z
      .enum(['markdown', 'json', 'code', 'plain_text', 'structured_prompt', 'provider_native'])
      .optional(),
    tone: z.enum(['playful', 'serious', 'technical', 'casual', 'balanced']).optional(),
    maxTokens: z.number().optional(),
    temperature: z.number().min(0).max(2).optional(),
    useProviderGuidelines: z.boolean().optional(),
    usePromptEngineering: z.boolean().optional(),
  }),
});

const transcribeSchema = z.object({
  audioData: z.string(), // Base64 encoded
  format: z.enum(['webm', 'mp3', 'wav', 'm4a']),
  language: z.string().optional(),
});

// Reformat input based on filters
router.post(
  '/reformat',
  authMiddleware,
  validateBody(reformatInputSchema),
  asyncHandler(async (req, res) => {
    const { input, filter } = req.body;
    const userId = (req as any).userId;
    const requestId = req.headers['x-request-id'] as string;

    // Check token limits for premium users
    const reformatted = await inputReformatter.reformatInput(input, filter);
    const tokenCheck = await premiumService.checkTokenLimit(
      userId,
      reformatted.metadata.estimatedTokens
    );

    if (!tokenCheck.allowed) {
      return res.status(429).json({
        error: {
          code: 'TOKEN_LIMIT_EXCEEDED',
          message: `Token limit exceeded. Estimated: ${reformatted.metadata.estimatedTokens}, Remaining: ${tokenCheck.remaining}`,
        },
        requestId,
      });
    }

    logger.info('Input reformatted', {
      userId,
      requestId,
      style: reformatted.metadata.style,
      provider: reformatted.metadata.provider,
      estimatedTokens: reformatted.metadata.estimatedTokens,
    });

    res.json({
      ...reformatted,
      tokenLimit: tokenCheck,
    });
  })
);

// Transcribe voice to text (premium)
router.post(
  '/transcribe',
  authMiddleware,
  validateBody(transcribeSchema),
  asyncHandler(async (req, res) => {
    const { audioData, format, language } = req.body;
    const userId = (req as any).userId;
    const requestId = req.headers['x-request-id'] as string;

    // Validate audio input
    const voiceInput = {
      audioData,
      format,
      language,
    };

    if (!voiceToTextService.validateAudioInput(voiceInput)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_AUDIO',
          message: 'Audio file too large or invalid format',
        },
        requestId,
      });
    }

    try {
      const transcription = await voiceToTextService.transcribe(userId, voiceInput);

      logger.info('Voice transcribed', {
        userId,
        requestId,
        textLength: transcription.text.length,
        language: transcription.language,
      });

      res.json({
        transcription,
        requestId,
      });
    } catch (error) {
      if ((error as Error).message.includes('premium')) {
        return res.status(403).json({
          error: {
            code: 'PREMIUM_REQUIRED',
            message: 'Voice-to-text is a premium feature',
          },
          requestId,
        });
      }
      throw error;
    }
  })
);

// Get available filters and models
router.get(
  '/options',
  asyncHandler(async (req, res) => {
    const { llmService } = await import('../services/llmService.js');
    const { extendedLLMService } = await import('../services/llmServiceExtended.js');

    // Detect local LLMs
    const [ollama, lmStudio, vllm] = await Promise.all([
      extendedLLMService.detectOllama(),
      extendedLLMService.detectLMStudio(),
      extendedLLMService.detectVLLM(),
    ]);

    const models: Record<string, string[]> = {
      openai: ['gpt-4-turbo-preview', 'gpt-4', 'gpt-3.5-turbo', 'o1-preview', 'o1-mini'],
      anthropic: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
      google: ['gemini-pro', 'gemini-ultra', 'gemini-1.5-pro'],
      meta: ['llama-3-70b', 'llama-3-8b', 'llama-2-70b', 'llama-2-13b', 'llama-2-7b'],
      ollama: ollama.models,
      lmstudio: lmStudio.models,
      vllm: vllm.models,
      together: [
        'meta-llama/Llama-3-70b-chat-hf',
        'mistralai/Mixtral-8x7B-Instruct-v0.1',
        'Qwen/Qwen2.5-72B-Instruct',
      ],
      groq: ['llama-3-70b-8192', 'mixtral-8x7b-32768', 'gemma-7b-it'],
      mistral: ['mistral-large', 'mistral-medium', 'mistral-small'],
      cohere: ['command-r-plus', 'command-r', 'command'],
      perplexity: ['llama-3-sonar-large-32k-online', 'llama-3-sonar-small-32k-online'],
    };

    // Filter out providers that aren't available
    const availableProviders = [
      'openai',
      'anthropic',
      'google',
      ...(ollama.available ? ['ollama'] : []),
      ...(lmStudio.available ? ['lmstudio'] : []),
      ...(vllm.available ? ['vllm'] : []),
      ...(process.env.TOGETHER_API_KEY ? ['together'] : []),
      ...(process.env.GROQ_API_KEY ? ['groq'] : []),
      ...(process.env.MISTRAL_API_KEY ? ['mistral'] : []),
      ...(process.env.COHERE_API_KEY ? ['cohere'] : []),
      ...(process.env.PERPLEXITY_API_KEY ? ['perplexity'] : []),
      'meta',
      'custom',
    ];

    res.json({
      providers: availableProviders,
      styles: [
        'concise',
        'detailed',
        'technical',
        'conversational',
        'structured',
        'prompt_engineering',
        'chain_of_thought',
        'few_shot',
      ],
      outputFormats: [
        'markdown',
        'json',
        'code',
        'plain_text',
        'structured_prompt',
        'provider_native',
      ],
      models,
      localLLMs: {
        ollama: ollama.available,
        lmStudio: lmStudio.available,
        vllm: vllm.available,
      },
    });
  })
);

// Get premium features status
router.get(
  '/premium',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const userId = (req as any).userId;
    const features = await premiumService.getPremiumFeatures(userId);
    const tokenCheck = await premiumService.checkTokenLimit(userId, 0);

    res.json({
      features,
      tokenUsage: {
        limit: tokenCheck.limit,
        remaining: tokenCheck.remaining,
      },
    });
  })
);

export { router as inputFiltersRouter };
