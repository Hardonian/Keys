import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface VibeConfig {
  auto_suggest?: boolean;
  [key: string]: unknown;
}

export async function getLatestVibeConfig(userId: string): Promise<VibeConfig | null> {
  const { data, error } = await supabase
    .from('vibe_configs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    return null;
  }

  return data ?? null;
}
