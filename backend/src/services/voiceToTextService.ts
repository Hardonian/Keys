import type { PremiumFeatures } from '../types/filters.js';
import { premiumService } from './premiumService.js';
import { logger } from '../utils/logger.js';

export interface VoiceInput {
  audioData: Buffer | string; // Base64 or Buffer
  format: 'webm' | 'mp3' | 'wav' | 'm4a';
  language?: string;
}

export interface TranscriptionResult {
  text: string;
  confidence?: number;
  language?: string;
  duration?: number;
}

export class VoiceToTextService {
  /**
   * Transcribe audio to text (premium feature)
   */
  async transcribe(
    userId: string,
    voiceInput: VoiceInput
  ): Promise<TranscriptionResult> {
    // Check premium status
    const features = await premiumService.getPremiumFeatures(userId);
    if (!features.voiceToText) {
      throw new Error('Voice-to-text is a premium feature');
    }

    // Use OpenAI Whisper API (or other service)
    return await this.transcribeWithWhisper(voiceInput);
  }

  /**
   * Transcribe using OpenAI Whisper API
   */
  private async transcribeWithWhisper(
    voiceInput: VoiceInput
  ): Promise<TranscriptionResult> {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      // Convert base64 to buffer if needed
      const audioBuffer =
        typeof voiceInput.audioData === 'string'
          ? Buffer.from(voiceInput.audioData, 'base64')
          : voiceInput.audioData;

      // Create form data for OpenAI Whisper API
      const FormDataModule = await import('form-data');
      const FormData = FormDataModule.default;
      const formData = new FormData();
      formData.append('file', audioBuffer, {
        filename: `audio.${voiceInput.format}`,
        contentType: `audio/${voiceInput.format}`,
      });
      formData.append('model', 'whisper-1');
      if (voiceInput.language) {
        formData.append('language', voiceInput.language);
      }

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openaiApiKey}`,
        },
        body: formData as any,
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: { message?: string } };
        throw new Error(`Whisper API error: ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = (await response.json()) as { text: string; language?: string };

      return {
        text: data.text,
        language: data.language,
      };
    } catch (error) {
      logger.error('Error transcribing audio', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Validate audio format and size
   */
  validateAudioInput(voiceInput: VoiceInput, maxSizeMB: number = 25): boolean {
    const audioBuffer =
      typeof voiceInput.audioData === 'string'
        ? Buffer.from(voiceInput.audioData, 'base64')
        : voiceInput.audioData;

    const sizeMB = audioBuffer.length / (1024 * 1024);
    return sizeMB <= maxSizeMB;
  }
}

export const voiceToTextService = new VoiceToTextService();
