import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Use placeholder values during build to prevent build failures
// These will be replaced at runtime with actual values from Vercel environment variables
const buildSafeUrl = supabaseUrl || 'https://placeholder.supabase.co';
const buildSafeKey = supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

export const supabase = createClient(buildSafeUrl, buildSafeKey);

// Runtime validation (only in browser/client)
if (typeof window !== 'undefined') {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      'Missing Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY). ' +
      'Some features may not work correctly. Please configure these in your Vercel project settings.'
    );
  }
}
