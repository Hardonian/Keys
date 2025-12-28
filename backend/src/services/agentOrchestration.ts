import { llmService } from './llmService.js';
import { calculateCost } from '../utils/costCalculator.js';
import type { PromptAssemblyResult, AgentOutput, TaskIntent } from '../types/index.js';

export async function orchestrateAgent(
  assembledPrompt: PromptAssemblyResult,
  taskIntent: string,
  naturalLanguageInput: string
): Promise<AgentOutput> {
  const startTime = Date.now();

  // Determine output type from task intent
  const outputType = inferOutputType(taskIntent, naturalLanguageInput);

  // Generate content using LLM
  const response = await llmService.generate({
    provider: 'openai',
    model: 'gpt-4-turbo-preview',
    messages: [{ role: 'user', content: assembledPrompt.userPrompt }],
    systemPrompt: assembledPrompt.systemPrompt,
    temperature: 0.7,
    maxTokens: 2000,
  });

  const latencyMs = Date.now() - startTime;

  // Format output based on type
  const formattedContent = formatOutput(outputType, response.content, naturalLanguageInput);

  return {
    outputType,
    content: formattedContent,
    requiresApproval: true,
    editableFields: getEditableFields(outputType),
    generatedAt: new Date().toISOString(),
    modelUsed: response.model,
    tokensUsed: response.tokensUsed ?? 0,
    costUsd: calculateCost(response.provider, response.model, response.tokensUsed ?? 0),
  };
}

function inferOutputType(taskIntent: string, input: string): AgentOutput['outputType'] {
  const lowerInput = input.toLowerCase();

  if (lowerInput.includes('agent') || lowerInput.includes('scaffold') || lowerInput.includes('mindstudio')) {
    return 'agent_scaffold';
  }

  if (lowerInput.includes('tiktok') || lowerInput.includes('hook') || lowerInput.includes('script')) {
    return 'content_generation';
  }

  if (lowerInput.includes('workflow') || lowerInput.includes('automate')) {
    return 'workflow_recommendation';
  }

  if (lowerInput.includes('code') || lowerInput.includes('snippet')) {
    return 'code_snippet';
  }

  if (lowerInput.includes('analyze') || lowerInput.includes('insight')) {
    return 'data_insight';
  }

  return 'content_generation'; // Default
}

function formatOutput(
  outputType: AgentOutput['outputType'],
  rawContent: string,
  originalInput: string
): string | Record<string, any> {
  switch (outputType) {
    case 'content_generation':
      // Try to parse structured content (hook, script, cta)
      if (rawContent.includes('Hook:') || rawContent.includes('hook:')) {
        return parseStructuredContent(rawContent);
      }
      return rawContent;

    case 'agent_scaffold':
      try {
        // Try to extract JSON from response
        const jsonMatch = rawContent.match(/```json\n([\s\S]*?)\n```/) || rawContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[1] || jsonMatch[0]);
        }
        // Fallback: create a simple scaffold structure
        return createAgentScaffold(rawContent, originalInput);
      } catch {
        return createAgentScaffold(rawContent, originalInput);
      }

    case 'workflow_recommendation':
      return {
        recommendation: rawContent,
        steps: extractSteps(rawContent),
      };

    case 'code_snippet':
      return {
        code: rawContent,
        language: inferLanguage(rawContent),
      };

    default:
      return rawContent;
  }
}

function parseStructuredContent(content: string): Record<string, any> {
  const result: Record<string, any> = {};

  const hookMatch = content.match(/(?:Hook|hook):\s*(.+?)(?:\n|$)/i);
  if (hookMatch) result.hook = hookMatch[1].trim();

  const scriptMatch = content.match(/(?:Script|script):\s*([\s\S]+?)(?:\n(?:CTA|cta):|$)/i);
  if (scriptMatch) result.script = scriptMatch[1].trim();

  const ctaMatch = content.match(/(?:CTA|cta):\s*(.+?)(?:\n|$)/i);
  if (ctaMatch) result.cta = ctaMatch[1].trim();

  if (Object.keys(result).length === 0) {
    result.content = content;
  }

  return result;
}

function createAgentScaffold(content: string, originalInput: string): Record<string, any> {
  return {
    agentName: extractAgentName(content) || 'Generated Agent',
    description: content.substring(0, 200),
    trigger: {
      type: 'manual',
    },
    steps: [
      {
        id: 'step_1',
        name: 'Generate Content',
        type: 'llm',
        llm: {
          model: 'gpt-4-turbo',
          systemPrompt: 'You are a helpful AI assistant.',
          userPrompt: originalInput,
        },
      },
    ],
  };
}

function extractAgentName(content: string): string | null {
  const nameMatch = content.match(/(?:name|agent):\s*(.+?)(?:\n|$)/i);
  return nameMatch ? nameMatch[1].trim() : null;
}

function extractSteps(content: string): string[] {
  const stepMatches = content.match(/\d+\.\s*(.+?)(?=\n\d+\.|$)/g);
  return stepMatches ? stepMatches.map((s) => s.replace(/^\d+\.\s*/, '').trim()) : [];
}

function inferLanguage(code: string): string {
  if (code.includes('function') && code.includes('=>')) return 'javascript';
  if (code.includes('def ') || code.includes('import ')) return 'python';
  if (code.includes('SELECT') || code.includes('FROM')) return 'sql';
  if (code.includes('{%') || code.includes('{{')) return 'liquid';
  return 'text';
}

function getEditableFields(outputType: AgentOutput['outputType']): string[] {
  switch (outputType) {
    case 'content_generation':
      return ['hook', 'script', 'cta', 'content'];
    case 'agent_scaffold':
      return ['agentName', 'description', 'steps'];
    case 'workflow_recommendation':
      return ['recommendation', 'steps'];
    case 'code_snippet':
      return ['code'];
    default:
      return ['content'];
  }
}
