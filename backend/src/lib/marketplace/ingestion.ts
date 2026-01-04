import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import {
  jupyterKeySchema,
  nodeKeySchema,
  runbookKeySchema,
  stripeKeySchema,
  githubKeySchema,
  supabaseKeySchema,
  cursorKeySchema,
  assetsIndexSchema,
  type UnifiedKeyMetadata,
} from './key-schemas.js';
import { logger } from '../../utils/logger.js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ASSETS_ROOT = process.env.KEYS_ASSETS_ROOT || resolve(process.cwd(), '../keys-assets');

/**
 * Get storage path for a key asset
 */
function getKeyAssetPath(
  tool: string,
  slug: string,
  version: string,
  assetType: 'zip' | 'preview_html' | 'cover' | 'changelog_md'
): string {
  const filename = {
    zip: 'key.zip',
    preview_html: 'preview.html',
    cover: 'cover.png',
    changelog_md: 'changelog.md',
  }[assetType];

  return `keys/${tool}/${slug}/${version}/${filename}`;
}

/**
 * Ingest a single node/next key
 */
async function ingestNodeKey(slug: string, metadata: any): Promise<UnifiedKeyMetadata> {
  const validated = nodeKeySchema.parse(metadata);
  
  const keyType = validated.tool === 'node' ? 'node' : 'next';
  
  return {
    slug: validated.slug,
    tool: validated.tool,
    key_type: keyType, // Store tool name as key_type for backward compatibility
    title: validated.title,
    description: validated.description,
    version: validated.version,
    license_spdx: validated.license_spdx,
    tags: validated.tags || [],
    outcome: validated.outcome,
    maturity: validated.maturity,
    runtime: validated.runtime,
    key_types: validated.key_type, // Store array in key_types JSONB column
    required_env: validated.required_env,
    optional_env: validated.optional_env,
    dependencies: validated.dependencies,
    zip_path: getKeyAssetPath(validated.tool, slug, validated.version, 'zip'),
    changelog_md_path: validated.documentation?.changelog
      ? getKeyAssetPath(validated.tool, slug, validated.version, 'changelog_md')
      : undefined,
  };
}

/**
 * Ingest a single runbook key
 */
async function ingestRunbookKey(slug: string, metadata: any): Promise<UnifiedKeyMetadata> {
  const validated = runbookKeySchema.parse(metadata);
  
  return {
    slug: validated.slug,
    tool: 'runbook',
    key_type: 'runbook', // Store tool name as key_type for backward compatibility
    title: validated.title,
    description: validated.description,
    version: validated.version,
    license_spdx: validated.license_spdx,
    tags: validated.tags || [],
    outcome: validated.outcome,
    maturity: validated.maturity,
    severity_level: validated.severity_level,
    runtime_dependency: validated.runtime_dependency,
    required_access_level: validated.required_access_level,
    produces_evidence: validated.produces_evidence,
    compliance_relevance: validated.compliance_relevance,
    zip_path: getKeyAssetPath('runbook', slug, validated.version, 'zip'),
    changelog_md_path: validated.documentation?.changelog
      ? getKeyAssetPath('runbook', slug, validated.version, 'changelog_md')
      : undefined,
  };
}

/**
 * Ingest a single Stripe key
 */
async function ingestStripeKey(slug: string, metadata: any): Promise<UnifiedKeyMetadata> {
  const validated = stripeKeySchema.parse(metadata);
  
  return {
    slug: validated.slug,
    tool: 'stripe',
    key_type: validated.key_type[0] || 'workflow', // Store first key_type as string
    title: validated.title,
    description: validated.description,
    version: validated.version,
    license_spdx: validated.license_spdx,
    tags: validated.tags || [],
    outcome: validated.outcome,
    maturity: validated.maturity,
    webhook_event_types: validated.webhook_event_types,
    stripe_integration_level: validated.stripe_integration_level,
    required_env: validated.required_env,
    optional_env: validated.optional_env,
    dependencies: validated.dependencies,
    zip_path: getKeyAssetPath('stripe', slug, validated.version, 'zip'),
    changelog_md_path: validated.documentation?.changelog
      ? getKeyAssetPath('stripe', slug, validated.version, 'changelog_md')
      : undefined,
  };
}

/**
 * Ingest a single GitHub key
 */
async function ingestGitHubKey(slug: string, metadata: any): Promise<UnifiedKeyMetadata> {
  const validated = githubKeySchema.parse(metadata);
  
  return {
    slug: validated.slug,
    tool: 'github',
    key_type: validated.key_type[0] || 'workflow', // Store first key_type as string
    title: validated.title,
    description: validated.description,
    version: validated.version,
    license_spdx: validated.license_spdx,
    tags: validated.tags || [],
    outcome: validated.outcome,
    maturity: validated.maturity,
    github_workflow_type: validated.github_workflow_type,
    github_template_type: validated.github_template_type,
    zip_path: getKeyAssetPath('github', slug, validated.version, 'zip'),
    changelog_md_path: validated.documentation?.changelog
      ? getKeyAssetPath('github', slug, validated.version, 'changelog_md')
      : undefined,
  };
}

/**
 * Ingest a single Supabase key
 */
async function ingestSupabaseKey(slug: string, metadata: any): Promise<UnifiedKeyMetadata> {
  const validated = supabaseKeySchema.parse(metadata);
  
  return {
    slug: validated.slug,
    tool: 'supabase',
    key_type: validated.key_type[0] || 'template', // Store first key_type as string
    title: validated.title,
    description: validated.description,
    version: validated.version,
    license_spdx: validated.license_spdx,
    tags: validated.tags || [],
    outcome: validated.outcome,
    maturity: validated.maturity,
    supabase_feature_type: validated.supabase_feature_type,
    required_env: validated.required_env,
    optional_env: validated.optional_env,
    dependencies: validated.dependencies,
    zip_path: getKeyAssetPath('supabase', slug, validated.version, 'zip'),
    changelog_md_path: validated.documentation?.changelog
      ? getKeyAssetPath('supabase', slug, validated.version, 'changelog_md')
      : undefined,
  };
}

/**
 * Ingest a single Cursor key
 */
async function ingestCursorKey(slug: string, metadata: any): Promise<UnifiedKeyMetadata> {
  const validated = cursorKeySchema.parse(metadata);
  
  return {
    slug: validated.slug,
    tool: 'cursor',
    key_type: validated.key_type[0] || 'prompt', // Store first key_type as string
    title: validated.title,
    description: validated.description,
    version: validated.version,
    license_spdx: validated.license_spdx,
    tags: validated.tags || [],
    outcome: validated.outcome,
    maturity: validated.maturity,
    cursor_prompt_type: validated.cursor_prompt_type,
    zip_path: getKeyAssetPath('cursor', slug, validated.version, 'zip'),
    changelog_md_path: validated.documentation?.changelog
      ? getKeyAssetPath('cursor', slug, validated.version, 'changelog_md')
      : undefined,
  };
}

/**
 * Parse Jupyter keys from markdown catalog
 */
function parseJupyterKeysFromMarkdown(mdContent: string): Array<{
  slug: string;
  title: string;
  description?: string;
  version: string;
  license_spdx: string;
  tags: string[];
  outcome?: string;
  maturity?: 'starter' | 'operator' | 'scale' | 'enterprise';
  category?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  runtime_minutes?: number;
  preview_public?: boolean;
  assets?: {
    zip?: string;
    preview_html?: string;
    cover?: string;
    changelog_md?: string;
  };
  sha256?: string;
}> {
  const keys: Array<any> = [];
  const sections = mdContent.split(/^### \d+\./m);
  
  for (const section of sections.slice(1)) { // Skip header
    const lines = section.split('\n');
    const metadata: any = {
      tags: [],
      assets: {},
    };
    
    for (const line of lines) {
      if (line.startsWith('**Title**:')) {
        metadata.title = line.replace('**Title**:', '').trim();
      } else if (line.startsWith('**Slug**:')) {
        metadata.slug = line.replace('**Slug**:', '').trim();
      } else if (line.startsWith('**What It Unlocks**:')) {
        metadata.description = line.replace('**What It Unlocks**:', '').trim();
      } else if (line.startsWith('**Runtime**:')) {
        // Extract maturity from runtime line if present
        const runtimeLine = line.replace('**Runtime**:', '').trim();
        if (runtimeLine.includes('operator')) {
          metadata.maturity = 'operator';
        } else if (runtimeLine.includes('starter')) {
          metadata.maturity = 'starter';
        }
      } else if (line.startsWith('**Maturity**:')) {
        const maturity = line.replace('**Maturity**:', '').trim().toLowerCase();
        if (['starter', 'operator', 'scale', 'enterprise'].includes(maturity)) {
          metadata.maturity = maturity;
        }
      } else if (line.startsWith('**Referenced By**:')) {
        // Extract tags from references
        const refLine = line.replace('**Referenced By**:', '').trim();
        if (refLine.includes('Runbook:')) {
          const runbookMatch = refLine.match(/Runbook:\s*`([^`]+)`/);
          if (runbookMatch) {
            metadata.tags.push(`runbook:${runbookMatch[1]}`);
          }
        }
      }
    }
    
    // Set defaults
    if (!metadata.version) metadata.version = '1.0.0';
    if (!metadata.license_spdx) metadata.license_spdx = 'MIT';
    if (!metadata.maturity) metadata.maturity = 'operator';
    if (!metadata.preview_public) metadata.preview_public = true;
    
    // Set outcome based on description
    if (metadata.description) {
      if (metadata.description.toLowerCase().includes('analysis')) {
        metadata.outcome = 'analysis';
      } else if (metadata.description.toLowerCase().includes('validation')) {
        metadata.outcome = 'validation';
      } else if (metadata.description.toLowerCase().includes('reconciliation')) {
        metadata.outcome = 'reconciliation';
      }
    }
    
    // Set category based on title/description
    if (metadata.title) {
      if (metadata.title.toLowerCase().includes('webhook')) {
        metadata.category = 'webhook-analysis';
      } else if (metadata.title.toLowerCase().includes('data')) {
        metadata.category = 'data-analysis';
      } else if (metadata.title.toLowerCase().includes('ai')) {
        metadata.category = 'ai-analysis';
      } else if (metadata.title.toLowerCase().includes('job')) {
        metadata.category = 'job-analysis';
      }
    }
    
    // Set default zip path
    if (!metadata.assets.zip) {
      metadata.assets.zip = `jupyter/${metadata.slug}/latest/key.zip`;
    }
    
    if (metadata.slug && metadata.title) {
      keys.push(metadata);
    }
  }
  
  return keys;
}

/**
 * Ingest a single jupyter key (from library.json or parsed markdown)
 */
async function ingestJupyterKey(metadata: any): Promise<UnifiedKeyMetadata> {
  // Try to validate as full schema first, otherwise use partial
  let validated: any;
  try {
    validated = jupyterKeySchema.parse(metadata);
  } catch {
    // Partial validation for markdown-parsed keys
    validated = {
      slug: metadata.slug,
      title: metadata.title,
      description: metadata.description,
      version: metadata.version || '1.0.0',
      license_spdx: metadata.license_spdx || 'MIT',
      tags: metadata.tags || [],
      category: metadata.category,
      difficulty: metadata.difficulty,
      runtime_minutes: metadata.runtime_minutes,
      preview_public: metadata.preview_public ?? true,
      assets: metadata.assets || { zip: `jupyter/${metadata.slug}/latest/key.zip` },
      sha256: metadata.sha256,
      outcome: metadata.outcome,
      maturity: metadata.maturity || 'operator',
    };
  }
  
  return {
    slug: validated.slug,
    tool: 'jupyter',
    key_type: 'jupyter', // Legacy: key_type = tool for jupyter
    title: validated.title,
    description: validated.description,
    version: validated.version,
    license_spdx: validated.license_spdx,
    tags: validated.tags || [],
    category: validated.category,
    difficulty: validated.difficulty,
    runtime_minutes: validated.runtime_minutes,
    preview_public: validated.preview_public,
    outcome: validated.outcome,
    maturity: validated.maturity,
    zip_path: validated.assets?.zip
      ? getKeyAssetPath('jupyter', validated.slug, validated.version, 'zip')
      : getKeyAssetPath('jupyter', validated.slug, validated.version, 'zip'),
    preview_html_path: validated.assets?.preview_html
      ? getKeyAssetPath('jupyter', validated.slug, validated.version, 'preview_html')
      : undefined,
    cover_path: validated.assets?.cover
      ? getKeyAssetPath('jupyter', validated.slug, validated.version, 'cover')
      : undefined,
    changelog_md_path: validated.assets?.changelog_md
      ? getKeyAssetPath('jupyter', validated.slug, validated.version, 'changelog_md')
      : undefined,
    sha256: validated.sha256,
  };
}

/**
 * Ingest all keys from assets directory
 */
export async function ingestAllKeys(): Promise<{
  success: number;
  errors: Array<{ slug: string; error: string }>;
}> {
  const errors: Array<{ slug: string; error: string }> = [];
  let success = 0;

  try {
    // Ingest node/next keys
    const nodeKeysDir = join(ASSETS_ROOT, 'node-next-keys');
    if (existsSync(nodeKeysDir)) {
      const { readdirSync, statSync } = await import('fs');
      const nodeKeys = readdirSync(nodeKeysDir).filter(item => {
        const itemPath = join(nodeKeysDir, item);
        return statSync(itemPath).isDirectory();
      });

      for (const slug of nodeKeys) {
        try {
          const keyJsonPath = join(nodeKeysDir, slug, 'key.json');
          if (!existsSync(keyJsonPath)) {
            continue;
          }

          const keyData = JSON.parse(readFileSync(keyJsonPath, 'utf-8'));
          const unified = await ingestNodeKey(slug, keyData);
          
          // Upsert to database
          const { error } = await supabase
            .from('marketplace_keys')
            .upsert(unified, { onConflict: 'slug' });

          if (error) {
            throw new Error(`Database error: ${error.message}`);
          }

          // Create version record
          await supabase.from('marketplace_key_versions').upsert({
            key_id: (await supabase.from('marketplace_keys').select('id').eq('slug', slug).single()).data?.id,
            version: unified.version,
            zip_path: unified.zip_path,
            changelog_md_path: unified.changelog_md_path,
          }, { onConflict: 'key_id,version' });

          success++;
        } catch (error: any) {
          errors.push({ slug, error: error.message || 'Unknown error' });
          logger.error(`Failed to ingest node key ${slug}:`, error);
        }
      }
    }

    // Ingest runbook keys
    const runbooksDir = join(ASSETS_ROOT, 'runbook-keys');
    if (existsSync(runbooksDir)) {
      const { readdirSync, statSync } = await import('fs');
      const runbooks = readdirSync(runbooksDir).filter(item => {
        const itemPath = join(runbooksDir, item);
        return statSync(itemPath).isDirectory();
      });

      for (const slug of runbooks) {
        try {
          const packJsonPath = join(runbooksDir, slug, 'pack.json');
          if (!existsSync(packJsonPath)) {
            continue;
          }

          const packData = JSON.parse(readFileSync(packJsonPath, 'utf-8'));
          const unified = await ingestRunbookKey(slug, packData);
          
          // Upsert to database
          const { error } = await supabase
            .from('marketplace_keys')
            .upsert(unified, { onConflict: 'slug' });

          if (error) {
            throw new Error(`Database error: ${error.message}`);
          }

          // Create version record
          const keyId = (await supabase.from('marketplace_keys').select('id').eq('slug', slug).single()).data?.id;
          if (keyId) {
            await supabase.from('marketplace_key_versions').upsert({
              key_id: keyId,
              version: unified.version,
              zip_path: unified.zip_path,
              changelog_md_path: unified.changelog_md_path,
            }, { onConflict: 'key_id,version' });
          }

          success++;
        } catch (error: any) {
          errors.push({ slug, error: error.message || 'Unknown error' });
          logger.error(`Failed to ingest runbook key ${slug}:`, error);
        }
      }
    }

    // Ingest jupyter keys from markdown catalog
    const jupyterKeysMdPath = join(ASSETS_ROOT, 'jupyter-keys-md', 'JUPYTER_KEYS_LIBRARY.md');
    if (existsSync(jupyterKeysMdPath)) {
      try {
        const mdContent = readFileSync(jupyterKeysMdPath, 'utf-8');
        const jupyterKeys = parseJupyterKeysFromMarkdown(mdContent);
        
        for (const keyMetadata of jupyterKeys) {
          try {
            const unified = await ingestJupyterKey(keyMetadata);
            
            // Upsert to database
            const { error } = await supabase
              .from('marketplace_keys')
              .upsert(unified, { onConflict: 'slug' });

            if (error) {
              throw new Error(`Database error: ${error.message}`);
            }

            // Create version record
            const keyId = (await supabase.from('marketplace_keys').select('id').eq('slug', unified.slug).single()).data?.id;
            if (keyId) {
              await supabase.from('marketplace_key_versions').upsert({
                key_id: keyId,
                version: unified.version,
                zip_path: unified.zip_path,
                changelog_md_path: unified.changelog_md_path,
              }, { onConflict: 'key_id,version' });
            }

            success++;
          } catch (error: any) {
            errors.push({ slug: keyMetadata.slug || 'unknown', error: error.message || 'Unknown error' });
            logger.error(`Failed to ingest jupyter key ${keyMetadata.slug}:`, error);
          }
        }
      } catch (error: any) {
        logger.error('Failed to ingest jupyter keys from markdown:', error);
      }
    }

    // Ingest Stripe keys
    const stripeKeysDir = join(ASSETS_ROOT, 'stripe-keys');
    if (existsSync(stripeKeysDir)) {
      const { readdirSync, statSync } = await import('fs');
      const stripeKeys = readdirSync(stripeKeysDir).filter(item => {
        const itemPath = join(stripeKeysDir, item);
        return statSync(itemPath).isDirectory();
      });

      for (const slug of stripeKeys) {
        try {
          const keyJsonPath = join(stripeKeysDir, slug, 'key.json');
          if (!existsSync(keyJsonPath)) {
            continue;
          }

          const keyData = JSON.parse(readFileSync(keyJsonPath, 'utf-8'));
          const unified = await ingestStripeKey(slug, keyData);
          
          const { error } = await supabase
            .from('marketplace_keys')
            .upsert(unified, { onConflict: 'slug' });

          if (error) {
            throw new Error(`Database error: ${error.message}`);
          }

          const keyId = (await supabase.from('marketplace_keys').select('id').eq('slug', slug).single()).data?.id;
          if (keyId) {
            await supabase.from('marketplace_key_versions').upsert({
              key_id: keyId,
              version: unified.version,
              zip_path: unified.zip_path,
              changelog_md_path: unified.changelog_md_path,
            }, { onConflict: 'key_id,version' });
          }

          success++;
        } catch (error: any) {
          errors.push({ slug, error: error.message || 'Unknown error' });
          logger.error(`Failed to ingest Stripe key ${slug}:`, error);
        }
      }
    }

    // Ingest GitHub keys
    const githubKeysDir = join(ASSETS_ROOT, 'github-keys');
    if (existsSync(githubKeysDir)) {
      const { readdirSync, statSync } = await import('fs');
      const githubKeys = readdirSync(githubKeysDir).filter(item => {
        const itemPath = join(githubKeysDir, item);
        return statSync(itemPath).isDirectory();
      });

      for (const slug of githubKeys) {
        try {
          const keyJsonPath = join(githubKeysDir, slug, 'key.json');
          if (!existsSync(keyJsonPath)) {
            continue;
          }

          const keyData = JSON.parse(readFileSync(keyJsonPath, 'utf-8'));
          const unified = await ingestGitHubKey(slug, keyData);
          
          const { error } = await supabase
            .from('marketplace_keys')
            .upsert(unified, { onConflict: 'slug' });

          if (error) {
            throw new Error(`Database error: ${error.message}`);
          }

          const keyId = (await supabase.from('marketplace_keys').select('id').eq('slug', slug).single()).data?.id;
          if (keyId) {
            await supabase.from('marketplace_key_versions').upsert({
              key_id: keyId,
              version: unified.version,
              zip_path: unified.zip_path,
              changelog_md_path: unified.changelog_md_path,
            }, { onConflict: 'key_id,version' });
          }

          success++;
        } catch (error: any) {
          errors.push({ slug, error: error.message || 'Unknown error' });
          logger.error(`Failed to ingest GitHub key ${slug}:`, error);
        }
      }
    }

    // Ingest Supabase keys
    const supabaseKeysDir = join(ASSETS_ROOT, 'supabase-keys');
    if (existsSync(supabaseKeysDir)) {
      const { readdirSync, statSync } = await import('fs');
      const supabaseKeys = readdirSync(supabaseKeysDir).filter(item => {
        const itemPath = join(supabaseKeysDir, item);
        return statSync(itemPath).isDirectory();
      });

      for (const slug of supabaseKeys) {
        try {
          const keyJsonPath = join(supabaseKeysDir, slug, 'key.json');
          if (!existsSync(keyJsonPath)) {
            continue;
          }

          const keyData = JSON.parse(readFileSync(keyJsonPath, 'utf-8'));
          const unified = await ingestSupabaseKey(slug, keyData);
          
          const { error } = await supabase
            .from('marketplace_keys')
            .upsert(unified, { onConflict: 'slug' });

          if (error) {
            throw new Error(`Database error: ${error.message}`);
          }

          const keyId = (await supabase.from('marketplace_keys').select('id').eq('slug', slug).single()).data?.id;
          if (keyId) {
            await supabase.from('marketplace_key_versions').upsert({
              key_id: keyId,
              version: unified.version,
              zip_path: unified.zip_path,
              changelog_md_path: unified.changelog_md_path,
            }, { onConflict: 'key_id,version' });
          }

          success++;
        } catch (error: any) {
          errors.push({ slug, error: error.message || 'Unknown error' });
          logger.error(`Failed to ingest Supabase key ${slug}:`, error);
        }
      }
    }

    // Ingest Cursor keys
    const cursorKeysDir = join(ASSETS_ROOT, 'cursor-keys');
    if (existsSync(cursorKeysDir)) {
      const { readdirSync, statSync } = await import('fs');
      const cursorKeys = readdirSync(cursorKeysDir).filter(item => {
        const itemPath = join(cursorKeysDir, item);
        return statSync(itemPath).isDirectory();
      });

      for (const slug of cursorKeys) {
        try {
          const keyJsonPath = join(cursorKeysDir, slug, 'key.json');
          if (!existsSync(keyJsonPath)) {
            continue;
          }

          const keyData = JSON.parse(readFileSync(keyJsonPath, 'utf-8'));
          const unified = await ingestCursorKey(slug, keyData);
          
          const { error } = await supabase
            .from('marketplace_keys')
            .upsert(unified, { onConflict: 'slug' });

          if (error) {
            throw new Error(`Database error: ${error.message}`);
          }

          const keyId = (await supabase.from('marketplace_keys').select('id').eq('slug', slug).single()).data?.id;
          if (keyId) {
            await supabase.from('marketplace_key_versions').upsert({
              key_id: keyId,
              version: unified.version,
              zip_path: unified.zip_path,
              changelog_md_path: unified.changelog_md_path,
            }, { onConflict: 'key_id,version' });
          }

          success++;
        } catch (error: any) {
          errors.push({ slug, error: error.message || 'Unknown error' });
          logger.error(`Failed to ingest Cursor key ${slug}:`, error);
        }
      }
    }

  } catch (error: any) {
    logger.error('Failed to ingest keys:', error);
    throw error;
  }

  return { success, errors };
}

/**
 * Ingest keys from assets index JSON
 */
export async function ingestFromAssetsIndex(assetsIndex: any): Promise<{
  success: number;
  errors: Array<{ slug: string; error: string }>;
}> {
  const validated = assetsIndexSchema.parse(assetsIndex);
  const errors: Array<{ slug: string; error: string }> = [];
  let success = 0;

  // Ingest node keys
  for (const nodeKey of validated.node_keys || []) {
    try {
      const unified = await ingestNodeKey(nodeKey.slug!, nodeKey);
      
      const { error } = await supabase
        .from('marketplace_keys')
        .upsert(unified, { onConflict: 'slug' });

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      success++;
    } catch (error: any) {
      errors.push({ slug: nodeKey.slug || 'unknown', error: error.message || 'Unknown error' });
    }
  }

  // Ingest runbooks
  for (const runbook of validated.runbooks || []) {
    try {
      const unified = await ingestRunbookKey(runbook.slug!, runbook);
      
      const { error } = await supabase
        .from('marketplace_keys')
        .upsert(unified, { onConflict: 'slug' });

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      success++;
    } catch (error: any) {
      errors.push({ slug: runbook.slug || 'unknown', error: error.message || 'Unknown error' });
    }
  }

  // Ingest Stripe keys
  for (const stripeKey of validated.stripe_keys || []) {
    try {
      const unified = await ingestStripeKey(stripeKey.slug!, stripeKey);
      
      const { error } = await supabase
        .from('marketplace_keys')
        .upsert(unified, { onConflict: 'slug' });

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      success++;
    } catch (error: any) {
      errors.push({ slug: stripeKey.slug || 'unknown', error: error.message || 'Unknown error' });
    }
  }

  // Ingest GitHub keys
  for (const githubKey of validated.github_keys || []) {
    try {
      const unified = await ingestGitHubKey(githubKey.slug!, githubKey);
      
      const { error } = await supabase
        .from('marketplace_keys')
        .upsert(unified, { onConflict: 'slug' });

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      success++;
    } catch (error: any) {
      errors.push({ slug: githubKey.slug || 'unknown', error: error.message || 'Unknown error' });
    }
  }

  // Ingest Supabase keys
  for (const supabaseKey of validated.supabase_keys || []) {
    try {
      const unified = await ingestSupabaseKey(supabaseKey.slug!, supabaseKey);
      
      const { error } = await supabase
        .from('marketplace_keys')
        .upsert(unified, { onConflict: 'slug' });

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      success++;
    } catch (error: any) {
      errors.push({ slug: supabaseKey.slug || 'unknown', error: error.message || 'Unknown error' });
    }
  }

  // Ingest Cursor keys
  for (const cursorKey of validated.cursor_keys || []) {
    try {
      const unified = await ingestCursorKey(cursorKey.slug!, cursorKey);
      
      const { error } = await supabase
        .from('marketplace_keys')
        .upsert(unified, { onConflict: 'slug' });

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      success++;
    } catch (error: any) {
      errors.push({ slug: cursorKey.slug || 'unknown', error: error.message || 'Unknown error' });
    }
  }

  return { success, errors };
}
