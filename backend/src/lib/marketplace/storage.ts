import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MARKETPLACE_BUCKET = 'marketplace';

/**
 * Generate a signed URL for a storage object
 * Expires after specified seconds (default 1 hour)
 */
export async function getSignedUrl(
  path: string,
  expiresIn: number = 3600
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(MARKETPLACE_BUCKET)
    .createSignedUrl(path, expiresIn);

  if (error || !data) {
    throw new Error(`Failed to generate signed URL: ${error?.message || 'Unknown error'}`);
  }

  return data.signedUrl;
}

/**
 * Upload a file to marketplace storage
 */
export async function uploadFile(
  path: string,
  file: Buffer | Uint8Array,
  contentType?: string
): Promise<void> {
  const { error } = await supabase.storage
    .from(MARKETPLACE_BUCKET)
    .upload(path, file, {
      contentType: contentType || 'application/octet-stream',
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to upload file: ${error.message}`);
  }
}

/**
 * Delete a file from marketplace storage
 */
export async function deleteFile(path: string): Promise<void> {
  const { error } = await supabase.storage
    .from(MARKETPLACE_BUCKET)
    .remove([path]);

  if (error) {
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}

/**
 * Check if a file exists in storage
 */
export async function fileExists(path: string): Promise<boolean> {
  const { data, error } = await supabase.storage
    .from(MARKETPLACE_BUCKET)
    .list(path.split('/').slice(0, -1).join('/'), {
      search: path.split('/').pop(),
    });

  if (error) {
    return false;
  }

  return (data || []).length > 0;
}

/**
 * Generate storage path for a pack asset
 */
export function getPackAssetPath(
  slug: string,
  version: string,
  assetType: 'zip' | 'preview_html' | 'cover' | 'changelog_md'
): string {
  const filename = {
    zip: 'pack.zip',
    preview_html: 'preview.html',
    cover: 'cover.png',
    changelog_md: 'changelog.md',
  }[assetType];

  return `packs/${slug}/${version}/${filename}`;
}

/**
 * Hash IP address for privacy (SHA256)
 */
export function hashIP(ip: string): string {
  return createHash('sha256').update(ip).digest('hex');
}

/**
 * Truncate user agent to safe length
 */
export function truncateUserAgent(ua: string, maxLength: number = 500): string {
  if (ua.length <= maxLength) {
    return ua;
  }
  return ua.substring(0, maxLength - 3) + '...';
}
