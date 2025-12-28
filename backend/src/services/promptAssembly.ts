import { createClient } from '@supabase/supabase-js';
import type { UserProfile, PromptAtom, VibeConfig, PromptAssemblyResult } from '../types/index.js';
import type { InputFilter } from '../types/filters.js';
import { sliderToAtomName } from '../utils/sliderInterpolation.js';
import { inputReformatter } from './inputReformatter.js';
import { scaffoldTemplateService } from './scaffoldTemplateService.js';
import { getCache, setCache } from '../cache/redis.js';
import { logger } from '../utils/logger.js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function assemblePrompt(
  userId: string,
  taskDescription: string,
  vibeConfig: Partial<VibeConfig>,
  inputFilter?: InputFilter
): Promise<PromptAssemblyResult> {
  // Check if this is a scaffold task
  const isScaffoldTask = isScaffoldingTask(taskDescription);
  
  if (isScaffoldTask) {
    return assembleScaffoldPrompt(userId, taskDescription, vibeConfig, inputFilter);
  }

  // Create cache key based on inputs
  const cacheKey = `prompt:${userId}:${JSON.stringify({
    task: taskDescription.substring(0, 100), // First 100 chars for cache key
    vibe: vibeConfig,
    filter: inputFilter,
  })}`;

  // Try to get from cache (only if no input filter or filter is simple)
  if (!inputFilter || (!inputFilter.model && !inputFilter.temperature)) {
    try {
      const cached = await getCache(cacheKey);
      if (cached) {
        logger.debug('Using cached prompt assembly', { userId, cacheKey });
        return cached as PromptAssemblyResult;
      }
    } catch (error) {
      logger.warn('Cache read failed, continuing without cache', error as Error);
    }
  }
  // 1. Load user profile
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (profileError || !profile) {
    throw new Error('User profile not found');
  }

  // 2. Filter atoms by compatibility with user's role + vertical
  const { data: allAtoms, error: atomsError } = await supabase
    .from('prompt_atoms')
    .select('*')
    .eq('active', true);

  if (atomsError) {
    throw new Error('Failed to fetch prompt atoms');
  }

  // Filter by role and vertical
  let roleAtoms = allAtoms || [];
  if (profile.role) {
    roleAtoms = roleAtoms.filter(
      (atom) =>
        !atom.target_roles || atom.target_roles.length === 0 || atom.target_roles.includes(profile.role!)
    );
  }

  if (profile.vertical) {
    roleAtoms = roleAtoms.filter(
      (atom) =>
        !atom.target_verticals ||
        atom.target_verticals.length === 0 ||
        atom.target_verticals.includes(profile.vertical!)
    );
  }

  // Filter by stack
  const stackAtoms = roleAtoms.filter((atom) => {
    if (atom.category !== 'stack') return true;
    const stackName = atom.name.split('.')[1];
    return profile.stack?.[stackName] === true;
  });

  // 3. Map slider values to atom selections
  const toneAtomName = sliderToAtomName('playfulness', vibeConfig.playfulness || 50);
  const revenueAtomName = sliderToAtomName('revenueFocus', vibeConfig.revenue_focus || 60);
  const perspectiveAtomName = sliderToAtomName(
    'investorPerspective',
    vibeConfig.investor_perspective || 40
  );

  // Find atoms by name
  const toneAtom = stackAtoms.find((a) => a.name === toneAtomName);
  const revenueAtom = stackAtoms.find((a) => a.name === revenueAtomName);
  const perspectiveAtom = stackAtoms.find((a) => a.name === perspectiveAtomName);

  // 4. Infer task-specific atoms from natural language
  const taskAtoms = await inferTaskAtoms(taskDescription, profile.vertical || '', stackAtoms);

  // 5. Combine and weight by success rate
  const candidateAtoms: PromptAtom[] = [];
  if (toneAtom) candidateAtoms.push(toneAtom);
  if (revenueAtom) candidateAtoms.push(revenueAtom);
  if (perspectiveAtom) candidateAtoms.push(perspectiveAtom);
  candidateAtoms.push(...taskAtoms);

  // Remove duplicates
  const uniqueAtoms = Array.from(
    new Map(candidateAtoms.map((atom) => [atom.id, atom])).values()
  );

  const weightedAtoms = uniqueAtoms.map((atom) => ({
    ...atom,
    finalWeight: atom.weight * (atom.success_rate || 0.5),
  }));

  // Sort by weight
  weightedAtoms.sort((a, b) => b.finalWeight - a.finalWeight);

  // 6. Compose base system prompt from atoms
  const baseSystemPrompt = composeSystemPrompt(weightedAtoms);

  // 7. Apply input filters if provided (reformat input and update system prompt)
  let finalSystemPrompt = baseSystemPrompt;
  let finalUserPrompt = composeUserPrompt(taskDescription, profile, vibeConfig);

  if (inputFilter) {
    const reformatted = await inputReformatter.reformatInput(taskDescription, inputFilter);
    // Merge filter-based system prompt with atom-based system prompt
    finalSystemPrompt = `${baseSystemPrompt}\n\n${reformatted.systemPrompt}`;
    finalUserPrompt = reformatted.userPrompt;
  }

  // 8. Compose final prompts
  const systemPrompt = finalSystemPrompt;
  const userPrompt = finalUserPrompt;

  // 9. Return assembled prompt + metadata
  const result: PromptAssemblyResult = {
    systemPrompt,
    userPrompt,
    context: {
      userRole: profile.role,
      userVertical: profile.vertical,
      userStack: profile.stack as Record<string, boolean>,
      executionConstraints: extractConstraints(weightedAtoms),
    },
    selectedAtomIds: weightedAtoms.map((a) => a.id),
    blendRecipe: weightedAtoms.map((a, index) => ({
      id: a.id,
      name: a.name,
      weight: a.finalWeight,
      influence:
        index < 2 ? 'primary' : index < 4 ? 'secondary' : ('modifier' as const),
    })),
  };

  // Cache result (only if no complex filters)
  if (!inputFilter || (!inputFilter.model && !inputFilter.temperature)) {
    try {
      await setCache(cacheKey, result, 3600); // Cache for 1 hour
    } catch (error) {
      logger.warn('Cache write failed', error as Error);
    }
  }

  return result;
}

async function inferTaskAtoms(
  taskDescription: string,
  vertical: string,
  availableAtoms: PromptAtom[]
): Promise<PromptAtom[]> {
  const lowerTask = taskDescription.toLowerCase();
  const inferred: PromptAtom[] = [];

  // Channel inference
  if (lowerTask.includes('tiktok')) {
    const atom = availableAtoms.find((a) => a.name === 'channel.tiktok_ads');
    if (atom) inferred.push(atom);
  }
  if (lowerTask.includes('email')) {
    const atom = availableAtoms.find((a) => a.name === 'channel.email');
    if (atom) inferred.push(atom);
  }
  if (lowerTask.includes('product') && lowerTask.includes('copy')) {
    const atom = availableAtoms.find((a) => a.name === 'channel.product_copy');
    if (atom) inferred.push(atom);
  }

  // Stack inference
  if (lowerTask.includes('shopify')) {
    const atom = availableAtoms.find((a) => a.name === 'stack.shopify_2_0');
    if (atom) inferred.push(atom);
  }
  if (lowerTask.includes('supabase') || lowerTask.includes('database')) {
    const atom = availableAtoms.find((a) => a.name === 'stack.supabase');
    if (atom) inferred.push(atom);
  }

  return inferred;
}

function composeSystemPrompt(atoms: Array<PromptAtom & { finalWeight: number }>): string {
  const primaryAtoms = atoms.slice(0, 3);
  const secondaryAtoms = atoms.slice(3, 6);

  let prompt = 'You are an AI assistant specialized in helping business operators and creators.\n\n';

  // Add primary atoms
  for (const atom of primaryAtoms) {
    if (atom.system_prompt) {
      prompt += `${atom.system_prompt}\n\n`;
    }
  }

  // Add secondary atoms as modifiers
  if (secondaryAtoms.length > 0) {
    prompt += 'Additional context:\n';
    for (const atom of secondaryAtoms) {
      if (atom.system_prompt) {
        prompt += `- ${atom.system_prompt}\n`;
      }
    }
  }

  return prompt.trim();
}

function composeUserPrompt(
  taskDescription: string,
  profile: UserProfile,
  vibeConfig: Partial<VibeConfig>
): string {
  let prompt = taskDescription;

  // Add profile context
  if (profile.company_context) {
    prompt += `\n\nCompany context: ${profile.company_context}`;
  }

  if (profile.brand_voice) {
    prompt += `\n\nBrand voice: ${profile.brand_voice}`;
  }

  // Add custom instructions from vibe config
  if (vibeConfig.custom_instructions) {
    prompt += `\n\nAdditional instructions: ${vibeConfig.custom_instructions}`;
  }

  return prompt;
}

function extractConstraints(
  atoms: Array<PromptAtom & { finalWeight: number }>
): Record<string, any> {
  const constraints: Record<string, any> = {};

  for (const atom of atoms) {
    if (atom.constraints) {
      Object.assign(constraints, atom.constraints);
    }
  }

  return constraints;
}

/**
 * Detect if task is a scaffolding task
 */
function isScaffoldingTask(taskDescription: string): boolean {
  const lowerTask = taskDescription.toLowerCase();
  const scaffoldKeywords = [
    'scaffold',
    'setup',
    'initialize',
    'create structure',
    'project setup',
    'boilerplate',
    'template',
    'generate',
    'create routes',
    'create middleware',
    'database schema',
    'rls policies',
    'api routes',
    'frontend routes',
    'authentication setup',
    'security headers',
    'rate limiting',
  ];

  return scaffoldKeywords.some((keyword) => lowerTask.includes(keyword));
}

  /**
   * Assemble prompt for scaffolding tasks using template system
   * Uses user's customized templates if available, otherwise base templates
   */
async function assembleScaffoldPrompt(
  userId: string,
  taskDescription: string,
  vibeConfig: Partial<VibeConfig>,
  inputFilter?: InputFilter
): Promise<PromptAssemblyResult> {
  // Import user template service dynamically to avoid circular dependency
  const { userTemplateService } = await import('./userTemplateService.js');

  // Load user profile
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (profileError || !profile) {
    throw new Error('User profile not found');
  }

  // Get recommended templates
  const recommendedTemplates = scaffoldTemplateService.getRecommendedTemplates(
    profile,
    taskDescription
  );

  // Use user's customized templates if available
  // For each template, get user's customized version or fall back to base
  const templatePrompts: string[] = [];
  const templateIds: string[] = [];

  for (const template of recommendedTemplates) {
    try {
      const userPrompt = await userTemplateService.getUserTemplatePrompt(
        userId,
        template.id,
        taskDescription,
        inputFilter
      );
      templatePrompts.push(userPrompt.prompt);
      templateIds.push(template.id);
    } catch (error) {
      // Fallback to base template if customization fails
      logger.warn(`Failed to get customized template ${template.id}, using base`, error as Error);
      const basePrompt = scaffoldTemplateService.modifyMegaPrompt(template, {
        userProfile: profile,
        inputFilter,
        customInstructions: vibeConfig.custom_instructions,
      });
      templatePrompts.push(basePrompt);
      templateIds.push(template.id);
    }
  }

  // Compose system prompt from user's customized templates
  const composedSystemPrompt = templatePrompts.join('\n\n---\n\n') + '\n\n## Final Instructions\n\n' +
    `Always prioritize:\n` +
    `1. Security best practices\n` +
    `2. Performance optimization\n` +
    `3. Code quality\n` +
    `4. Maintainability\n`;

  // Compose user prompt
  const composedUserPrompt = composeUserPrompt(taskDescription, profile, vibeConfig);

  // Apply additional input filter formatting if needed
  let finalSystemPrompt = composedSystemPrompt;
  let finalUserPrompt = composedUserPrompt;

  if (inputFilter) {
    const reformatted = await inputReformatter.reformatInput(composedUserPrompt, inputFilter);
    finalSystemPrompt = `${composedSystemPrompt}\n\n${reformatted.systemPrompt}`;
    finalUserPrompt = reformatted.userPrompt;
  }

  // Return in PromptAssemblyResult format
  return {
    systemPrompt: finalSystemPrompt,
    userPrompt: finalUserPrompt,
    context: {
      userRole: profile.role,
      userVertical: profile.vertical,
      userStack: profile.stack as Record<string, boolean>,
      executionConstraints: {
        templates: recommendedTemplates.map((t) => ({
          id: t.id,
          name: t.name,
          milestone: t.milestone,
        })),
        templateIds,
      },
    },
    selectedAtomIds: templateIds,
    blendRecipe: recommendedTemplates.map((t, index) => ({
      id: t.id,
      name: t.name,
      weight: t.priority === 'high' ? 1.0 : t.priority === 'medium' ? 0.7 : 0.5,
      influence:
        index < 2 ? 'primary' : index < 4 ? 'secondary' : ('modifier' as const),
    })),
  };
}
