import { z } from 'zod';

/**
 * Schema for a single pack in the library.json index
 */
export const packSchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  category: z.string().max(100).optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
  runtime_minutes: z.number().int().positive().optional(),
  tags: z.array(z.string()).default([]),
  version: z.string().min(1).max(50),
  license_spdx: z.string().min(1), // e.g., "MIT", "Apache-2.0", "CC-BY-4.0"
  preview_public: z.boolean().default(true),
  assets: z.object({
    cover: z.string().optional(), // Path relative to pack root or URL
    preview_html: z.string().optional(), // Path relative to pack root or URL
    zip: z.string(), // Required: path to ZIP file
    changelog_md: z.string().optional(), // Path to changelog
  }),
  sha256: z.string().regex(/^[a-f0-9]{64}$/i, 'SHA256 must be 64 hex characters').optional(),
});

/**
 * Schema for the complete library.json index file
 */
export const libraryIndexSchema = z.object({
  version: z.string().min(1), // Schema version, e.g., "1.0.0"
  generated_at: z.string().datetime().optional(),
  packs: z.array(packSchema).min(1),
});

export type PackMetadata = z.infer<typeof packSchema>;
export type LibraryIndex = z.infer<typeof libraryIndexSchema>;

/**
 * Validate a library.json file
 */
export function validateLibraryIndex(data: unknown): LibraryIndex {
  return libraryIndexSchema.parse(data);
}

/**
 * Validate a single pack metadata
 */
export function validatePackMetadata(data: unknown): PackMetadata {
  return packSchema.parse(data);
}
