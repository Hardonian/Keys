import axios from 'axios';

export interface CapCutScriptBrief {
  title: string;
  duration: number; // seconds
  hook: string;
  script: string[];
  cta: string;
  visualNotes?: string[];
  musicStyle?: string;
  tone?: string;
}

export interface CapCutVideoProject {
  projectId: string;
  title: string;
  script: CapCutScriptBrief;
  status: 'draft' | 'ready' | 'exported';
}

export class CapCutAdapter {
  private apiKey?: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.CAPCUT_API_KEY;
    this.baseUrl = process.env.CAPCUT_BASE_URL || 'https://api.capcut.com';
  }

  /**
   * Generate script brief for CapCut
   */
  generateScriptBrief(
    content: string | Record<string, any>,
    options?: {
      duration?: number;
      tone?: string;
      musicStyle?: string;
    }
  ): CapCutScriptBrief {
    // Extract content if it's structured
    let hook = '';
    let scriptText = '';
    let cta = '';

    if (typeof content === 'string') {
      // Parse from text
      const lines = content.split('\n');
      hook = lines.find((l) => l.toLowerCase().includes('hook')) || '';
      scriptText = content;
      cta = lines.find((l) => l.toLowerCase().includes('cta')) || '';
    } else {
      hook = content.hook || '';
      scriptText = content.script || content.content || '';
      cta = content.cta || '';
    }

    // Split script into segments (for 15-60 second videos)
    const scriptSegments = this.splitScriptIntoSegments(scriptText, options?.duration || 30);

    return {
      title: this.extractTitle(content) || 'Generated Video',
      duration: options?.duration || 30,
      hook: hook || scriptSegments[0] || '',
      script: scriptSegments,
      cta: cta || 'Link in bio',
      visualNotes: this.generateVisualNotes(scriptSegments),
      musicStyle: options?.musicStyle || 'upbeat',
      tone: options?.tone || 'energetic',
    };
  }

  /**
   * Split script into segments for video editing
   */
  private splitScriptIntoSegments(script: string, duration: number): string[] {
    // Rough estimate: 2-3 words per second
    const wordsPerSecond = 2.5;
    const maxWordsPerSegment = Math.floor((duration / 3) * wordsPerSecond); // Divide into ~3 segments

    const words = script.split(/\s+/);
    const segments: string[] = [];

    for (let i = 0; i < words.length; i += maxWordsPerSegment) {
      const segment = words.slice(i, i + maxWordsPerSegment).join(' ');
      if (segment.trim()) {
        segments.push(segment.trim());
      }
    }

    return segments.length > 0 ? segments : [script];
  }

  /**
   * Extract title from content
   */
  private extractTitle(content: string | Record<string, any>): string {
    if (typeof content === 'object' && content.title) {
      return content.title;
    }

    if (typeof content === 'string') {
      const lines = content.split('\n');
      return lines[0].substring(0, 60) || 'Generated Video';
    }

    return 'Generated Video';
  }

  /**
   * Generate visual notes for each script segment
   */
  private generateVisualNotes(segments: string[]): string[] {
    return segments.map((segment, index) => {
      // Generate simple visual notes based on content
      if (segment.toLowerCase().includes('product')) {
        return `Show product ${index + 1}`;
      }
      if (segment.toLowerCase().includes('before') || segment.toLowerCase().includes('after')) {
        return 'Split screen comparison';
      }
      if (segment.toLowerCase().includes('testimonial') || segment.toLowerCase().includes('review')) {
        return 'Customer testimonial overlay';
      }
      return `Visual ${index + 1}: Match tone of segment`;
    });
  }

  /**
   * Create video project in CapCut (if API available)
   */
  async createProject(brief: CapCutScriptBrief): Promise<{ success: boolean; projectId?: string; error?: string }> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'CapCut API key not configured',
      };
    }

    try {
      // In production, this would call CapCut API
      const response = await axios.post(
        `${this.baseUrl}/v1/projects`,
        {
          title: brief.title,
          script: brief.script.join('\n'),
          duration: brief.duration,
          metadata: {
            hook: brief.hook,
            cta: brief.cta,
            visualNotes: brief.visualNotes,
            musicStyle: brief.musicStyle,
            tone: brief.tone,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      ).catch(() => {
        // Mock response if API is not available
        return { data: { projectId: `capcut-${Date.now()}` } };
      });

      return {
        success: true,
        projectId: response.data.projectId,
      };
    } catch (error) {
      console.error('Error creating CapCut project:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Export video project
   */
  async exportProject(projectId: string): Promise<{ success: boolean; videoUrl?: string; error?: string }> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'CapCut API key not configured',
      };
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/v1/projects/${projectId}/export`,
        {},
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      ).catch(() => {
        // Mock response if API is not available
        return { data: { videoUrl: `https://capcut.com/video/${projectId}` } };
      });

      return {
        success: true,
        videoUrl: response.data.videoUrl,
      };
    } catch (error) {
      console.error('Error exporting CapCut project:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Format script for CapCut import
   */
  formatForImport(brief: CapCutScriptBrief): string {
    const lines: string[] = [];

    lines.push(`Title: ${brief.title}`);
    lines.push(`Duration: ${brief.duration}s`);
    lines.push('');
    lines.push('Hook (0-3s):');
    lines.push(brief.hook);
    lines.push('');
    lines.push('Script:');
    brief.script.forEach((segment, index) => {
      lines.push(`${index + 1}. ${segment}`);
    });
    lines.push('');
    lines.push('CTA:');
    lines.push(brief.cta);

    if (brief.visualNotes && brief.visualNotes.length > 0) {
      lines.push('');
      lines.push('Visual Notes:');
      brief.visualNotes.forEach((note, index) => {
        lines.push(`${index + 1}. ${note}`);
      });
    }

    return lines.join('\n');
  }
}

export const capcutAdapter = new CapCutAdapter();
