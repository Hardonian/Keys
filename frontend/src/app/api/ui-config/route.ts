import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { DEFAULT_RUNTIME_UI_CONFIG, sanitizeRuntimeUiConfig } from '@/runtime-ui-config/shared';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function GET(req: Request) {
  const ifNoneMatch = req.headers.get('if-none-match');

  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      const res = NextResponse.json({ config: DEFAULT_RUNTIME_UI_CONFIG, updatedAt: null }, { status: 200 });
      res.headers.set('Cache-Control', 'public, max-age=5, stale-while-revalidate=30');
      return res;
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });

    const { data, error } = await supabase
      .from('runtime_ui_config')
      .select('public_config, updated_at')
      .eq('id', 'default')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    const config = sanitizeRuntimeUiConfig(data?.public_config);
    const updatedAt = (data?.updated_at as string | null) ?? null;

    // Deterministic weak ETag based on config + updatedAt.
    const etag = `W/"ui-config-${Buffer.from(JSON.stringify({ config, updatedAt })).toString('base64url').slice(0, 32)}"`;
    if (ifNoneMatch && ifNoneMatch === etag) {
      const res = new NextResponse(null, { status: 304 });
      res.headers.set('ETag', etag);
      res.headers.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=300');
      return res;
    }

    const res = NextResponse.json({ config, updatedAt }, { status: 200 });
    res.headers.set('ETag', etag);
    if (updatedAt) res.headers.set('X-UI-Config-Updated-At', updatedAt);
    res.headers.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=300');
    return res;
  } catch {
    // Fail closed with safe defaults (no rebuild required).
    const res = NextResponse.json({ config: DEFAULT_RUNTIME_UI_CONFIG, updatedAt: null }, { status: 200 });
    res.headers.set('Cache-Control', 'public, max-age=5, stale-while-revalidate=30');
    return res;
  }
}

