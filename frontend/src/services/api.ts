import axios from 'axios';
import type {
  // CompanionInput imported but not used - kept for future use
  PromptAssembly,
  AgentOutput,
  UserProfile,
  VibeConfig,
} from '@/types';
import { toast } from '@/components/Toast';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  // Get auth token from Supabase session
  try {
    const { createClient } = await import('@/utils/supabase/client');
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
  } catch (error) {
    console.warn('Failed to get auth token:', error);
  }
  
  return config;
});

// Add response interceptor for error handling and toast notifications
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const requestId = error.config?.headers?.['x-request-id'] || 'unknown';
    
    // Track error to Sentry or analytics
    interface WindowWithSentry extends Window {
      Sentry?: {
        captureException: (error: unknown, options?: Record<string, unknown>) => void;
      };
    }
    const windowWithSentry = window as unknown as WindowWithSentry;
    if (typeof window !== 'undefined' && windowWithSentry.Sentry) {
      windowWithSentry.Sentry.captureException(error, {
        tags: {
          requestId,
          endpoint: error.config?.url,
        },
        extra: {
          status: error.response?.status,
          data: error.response?.data,
        },
      });
    }

    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.error?.message || error.response.data?.message || 'An error occurred';
      
      // Handle specific error codes
      if (status === 403 && error.response.data?.error?.code === 'SUBSCRIPTION_REQUIRED') {
        toast.error('Active subscription required. Please upgrade your plan.');
        // Could redirect to billing page
        if (error.response.data?.error?.upgradeUrl) {
          setTimeout(() => {
            window.location.href = error.response.data.error.upgradeUrl;
          }, 2000);
        }
      } else if (status === 403 && error.response.data?.error?.code === 'PREMIUM_REQUIRED') {
        toast.error('Premium features required. Please upgrade your plan.');
      } else if (status === 429) {
        toast.error('Rate limit exceeded. Please try again later.');
      } else {
        toast.error(message);
      }
    } else if (error.request) {
      toast.error('Network error. Please check your connection.');
    } else {
      toast.error('An unexpected error occurred');
    }
    
    return Promise.reject(error);
  }
);

export const apiService = {
  // Prompt Assembly
  async assemblePrompt(
    taskDescription: string,
    vibeConfig: Partial<VibeConfig>,
    inputFilter?: import('@/types/filters').InputFilter
  ): Promise<PromptAssembly> {
    const response = await api.post('/assemble-prompt', {
      taskDescription,
      vibeConfig,
      inputFilter,
    });
    return response.data;
  },

  // Agent Orchestration
  async orchestrateAgent(
    assembledPrompt: PromptAssembly,
    taskIntent: string,
    naturalLanguageInput: string
  ): Promise<AgentOutput> {
    const response = await api.post('/orchestrate-agent', {
      assembledPrompt,
      taskIntent,
      naturalLanguageInput,
    });
    return response.data;
  },

  // User Profile
  async getUserProfile(userId: string): Promise<UserProfile> {
    const response = await api.get(`/profiles/${userId}`);
    return response.data;
  },

  async updateUserProfile(
    userId: string,
    updates: Partial<UserProfile>
  ): Promise<UserProfile> {
    const response = await api.patch(`/profiles/${userId}`, updates);
    return response.data;
  },

  // Vibe Config
  async getVibeConfig(userId: string): Promise<VibeConfig> {
    const response = await api.get(`/vibe-configs/${userId}`);
    return response.data;
  },

  async updateVibeConfig(
    userId: string,
    updates: Partial<VibeConfig>
  ): Promise<VibeConfig> {
    const response = await api.patch(`/vibe-configs/${userId}`, updates);
    return response.data;
  },

  // Feedback
  async submitFeedback(
    runId: string,
    feedback: 'approved' | 'rejected' | 'revised',
    detail?: string
  ): Promise<void> {
    await api.post('/feedback', {
      runId,
      feedback,
      detail,
    });
  },

  // Input Filters
  async reformatInput(
    input: string,
    filter: import('@/types/filters').InputFilter
  ): Promise<import('@/types/filters').ReformattedInput> {
    const response = await api.post('/input-filters/reformat', {
      input,
      filter,
    });
    return response.data;
  },

  async transcribeVoice(
    audioData: string,
    format: 'webm' | 'mp3' | 'wav' | 'm4a',
    language?: string
  ): Promise<{ transcription: import('@/types/filters').TranscriptionResult }> {
    const response = await api.post('/input-filters/transcribe', {
      audioData,
      format,
      language,
    });
    return response.data;
  },

  async getPremiumFeatures(): Promise<{
    features: import('@/types/filters').PremiumFeatures;
    tokenUsage: { limit: number; remaining: number };
  }> {
    const response = await api.get('/input-filters/premium');
    return response.data;
  },
};

export default api;
