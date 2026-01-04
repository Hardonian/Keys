import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import {
  jupyterKeySchema,
  nodeKeySchema,
  runbookKeySchema,
  assetsIndexSchema,
  type UnifiedKeyMetadata,
} from './key-schemas.js';
import { logger } from '../utils/logger.js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ASSETS_ROOT = process.env.KEYS_ASSETS_ROOT || resolve(process.cwd(), '../../keys-assets');

/**
 * Get storage path for a key asset
 */
function getKeyAssetPath(
  keyType: 'jupyter' | 'node' | 'next' | 'runbook',
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

  return `keys/${keyType}/${slug}/${version}/${filename}`;
}

/**
 * Ingest a single node/next key
 */
async function ingestNodeKey(slug: string, metadata: any): Promise<UnifiedKeyMetadata> {
  const validated = nodeKeySchema.parse(metadata);
  
  const keyType = validated.tool === 'node' ? 'node' : 'next';
  
  return {
    slug: validated.slug,
    key_type: keyType,
    title: validated.title,
    description: validated.description,
    version: validated.version,
    license_spdx: validated.license_spdx,
    tags: validated.tags || [],
    outcome: validated.outcome,
    maturity: validated.maturity,
    tool: validated.tool,
    runtime: validated.runtime,
    key_types: validated.key_type,
    zip_path: getKeyAssetPath(keyType, slug, validated.version, 'zip'),
    changelog_md_path: validated.documentation?.changelog
      ? getKeyAssetPath(keyType, slug, validated.version, 'changelog_md')
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
    key_type: 'runbook',
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
 * Ingest a single jupyter key (from library.json)
 */
async function ingestJupyterKey(metadata: any): Promise<UnifiedKeyMetadata> {
  const validated = jupyterKeySchema.parse(metadata);
  
  return {
    slug: validated.slug,
    key_type: 'jupyter',
    title: validated.title,
    description: validated.description,
    version: validated.version,
    license_spdx: validated.license_spdx,
    tags: validated.tags || [],
    category: validated.category,
    difficulty: validated.difficulty,
    runtime_minutes: validated.runtime_minutes,
    preview_public: validated.preview_public,
    zip_path: validated.assets.zip
      ? getKeyAssetPath('jupyter', validated.slug, validated.version, 'zip')
      : undefined,
    preview_html_path: validated.assets.preview_html
      ? getKeyAssetPath('jupyter', validated.slug, validated.version, 'preview_html')
      : undefined,
    cover_path: validated.assets.cover
      ? getKeyAssetPath('jupyter', validated.slug, validated.version, 'cover')
      : undefined,
    changelog_md_path: validated.assets.changelog_md
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

    // Ingest jupyter keys from library.json (if exists)
    const libraryJsonPath = join(ASSETS_ROOT, 'dist', 'library.json');
    if (existsSync(libraryJsonPath)) {
      try {
        const libraryData = JSON.parse(readFileSync(libraryJsonPath, 'utf-8'));
        const validated = assetsIndexSchema.parse(libraryData);

        // Note: Jupyter keys are typically ingested from external library.json
        // This is a placeholder - in production, you'd fetch from the notebook repository
        logger.info('Jupyter keys ingestion from library.json not yet implemented');
      } catch (error: any) {
        logger.error('Failed to ingest jupyter keys:', error);
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

  return { success, errors };
}
