import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// During build time, env vars might not be available
// Create a client that handles missing env vars gracefully during build
// Runtime will still fail if env vars are actually missing, but build will succeed
let supabaseInstance: SupabaseClient | null = null;

const getSupabaseClient = (): SupabaseClient => {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    // During build/SSR, return a mock client to prevent build failures
    // This will fail at runtime if env vars are actually missing
    if (typeof window === 'undefined') {
      // During SSR build, return a mock client that won't crash
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const placeholderClient = createClient('https://placeholder.supabase.co', 'placeholder-key') as any as SupabaseClient;
      supabaseInstance = placeholderClient;
      return placeholderClient;
    }
    throw new Error('Missing Supabase environment variables');
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseInstance;
};

export const supabase = getSupabaseClient();
