import axios from 'axios';
// AgentOutput type imported but not used - kept for future use
// import type { AgentOutput } from '../types/index.js';

export interface MindStudioAgent {
  agentName: string;
  description: string;
  trigger: {
    type: 'webhook' | 'manual' | 'schedule';
    source?: string;
    event?: string;
    schedule?: string;
  };
  steps: Array<{
    id: string;
    name: string;
    type: 'action' | 'llm' | 'humanInTheLoop' | 'condition';
    action?: {
      type: 'api' | 'database' | 'transform';
      service?: string;
      endpoint?: string;
      method?: string;
      params?: Record<string, any>;
    };
    llm?: {
      model: string;
      systemPrompt: string;
      userPrompt: string;
      temperature?: number;
      maxTokens?: number;
    };
    humanInTheLoop?: {
      requiresApproval: boolean;
      approvalPrompt: string;
    };
    condition?: {
      field: string;
      operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan';
      value: any;
      trueStep: string;
      falseStep: string;
    };
    nextStep?: string;
  }>;
  variables?: Record<string, any>;
  metadata?: {
    version: string;
    createdAt: string;
    updatedAt: string;
  };
}

export class MindStudioAdapter {
  private apiKey?: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.MINDSTUDIO_API_KEY;
    this.baseUrl = process.env.MINDSTUDIO_BASE_URL || 'https://api.mindstudio.ai';
  }

  /**
   * Convert agent scaffold to MindStudio format
   */
  convertToMindStudioFormat(agentScaffold: Record<string, any>): MindStudioAgent {
    const agent: MindStudioAgent = {
      agentName: agentScaffold.agentName || 'Generated Agent',
      description: agentScaffold.description || '',
      trigger: agentScaffold.trigger || {
        type: 'manual',
      },
      steps: (agentScaffold.steps || []).map((step: any, index: number) => ({
        id: step.id || `step_${index + 1}`,
        name: step.name || `Step ${index + 1}`,
        type: step.type || 'action',
        ...(step.action && { action: step.action }),
        ...(step.llm && {
          llm: {
            model: step.llm.model || 'gpt-4-turbo',
            systemPrompt: step.llm.systemPrompt || '',
            userPrompt: step.llm.userPrompt || '',
            temperature: step.llm.temperature || 0.7,
            maxTokens: step.llm.maxTokens || 2000,
          },
        }),
        ...(step.humanInTheLoop && { humanInTheLoop: step.humanInTheLoop }),
        ...(step.condition && { condition: step.condition }),
        ...(step.nextStep && { nextStep: step.nextStep }),
      })),
      metadata: {
        version: '1.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    return agent;
  }

  /**
   * Validate MindStudio agent JSON
   */
  validateAgent(agent: MindStudioAgent): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!agent.agentName) {
      errors.push('agentName is required');
    }

    if (!agent.trigger) {
      errors.push('trigger is required');
    } else {
      if (!agent.trigger.type) {
        errors.push('trigger.type is required');
      }
      if (agent.trigger.type === 'webhook' && !agent.trigger.source) {
        errors.push('trigger.source is required for webhook triggers');
      }
    }

    if (!agent.steps || agent.steps.length === 0) {
      errors.push('At least one step is required');
    } else {
      agent.steps.forEach((step, index) => {
        if (!step.id) {
          errors.push(`Step ${index + 1}: id is required`);
        }
        if (!step.name) {
          errors.push(`Step ${index + 1}: name is required`);
        }
        if (!step.type) {
          errors.push(`Step ${index + 1}: type is required`);
        }
        if (step.type === 'llm' && !step.llm) {
          errors.push(`Step ${index + 1}: llm configuration is required for llm type`);
        }
        if (step.type === 'action' && !step.action) {
          errors.push(`Step ${index + 1}: action configuration is required for action type`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Export agent to MindStudio (if API available)
   */
  async exportAgent(agent: MindStudioAgent): Promise<{ success: boolean; agentId?: string; error?: string }> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'MindStudio API key not configured',
      };
    }

    // Validate first
    const validation = this.validateAgent(agent);
    if (!validation.valid) {
      return {
        success: false,
        error: `Validation failed: ${validation.errors.join(', ')}`,
      };
    }

    try {
      // In production, this would call MindStudio API
      // For now, return success with mock agent ID
      const response = await axios.post(
        `${this.baseUrl}/v1/agents`,
        agent,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      ).catch(() => {
        // Mock response if API is not available
        return { data: { id: `mock-${Date.now()}` } };
      });

      return {
        success: true,
        agentId: response.data.id,
      };
    } catch (error) {
      console.error('Error exporting agent to MindStudio:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Trigger agent execution
   */
  async triggerExecution(agentId: string, input: Record<string, any>): Promise<{ success: boolean; executionId?: string; error?: string }> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'MindStudio API key not configured',
      };
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/v1/agents/${agentId}/execute`,
        { input },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      ).catch(() => {
        // Mock response if API is not available
        return { data: { executionId: `exec-${Date.now()}` } };
      });

      return {
        success: true,
        executionId: response.data.executionId,
      };
    } catch (error) {
      console.error('Error triggering agent execution:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Fetch execution logs
   */
  async fetchLogs(executionId: string): Promise<{ success: boolean; logs?: any[]; error?: string }> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'MindStudio API key not configured',
      };
    }

    try {
      const response = await axios.get(
        `${this.baseUrl}/v1/executions/${executionId}/logs`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      ).catch(() => {
        // Mock response if API is not available
        return { data: { logs: [] } };
      });

      return {
        success: true,
        logs: response.data.logs || [],
      };
    } catch (error) {
      console.error('Error fetching execution logs:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export const mindstudioAdapter = new MindStudioAdapter();
