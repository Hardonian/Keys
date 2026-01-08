import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createSupabasePublicClient } from '@supabase/supabase-js';
import { DEFAULT_RUNTIME_UI_CONFIG } from '@/runtime-ui-config/shared';
import { sanitizeRuntimeUiConfig } from '@/runtime-ui-config/shared';

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
const REQUEST_SIGNING_SECRET = process.env.REQUEST_SIGNING_SECRET || '';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

async function requireAdminAccess() {
  const supabase = createClient();
  const [{ data: userData }, { data: sessionData }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.auth.getSession(),
  ]);

  const user = userData.user;
  const session = sessionData.session;

  if (!user || !session?.access_token) {
    return { ok: false as const, status: 401 as const, token: null, role: null };
  }

  const role = (user.app_metadata as Record<string, unknown> | null | undefined)?.role;
  const roleStr = typeof role === 'string' ? role : 'user';
  const allowlist = (process.env.ADMIN_USER_IDS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const isAllowlisted = allowlist.includes(user.id);
  const isAdmin = isAllowlisted || roleStr === 'admin' || roleStr === 'superadmin';

  if (!isAdmin) {
    return { ok: false as const, status: 403 as const, token: null, role: roleStr };
  }

  return { ok: true as const, status: 200 as const, token: session.access_token, role: roleStr };
}

export async function GET() {
  const auth = await requireAdminAccess();
  if (!auth.ok) {
    return NextResponse.json({ error: 'Admin access required' }, { status: auth.status });
  }

  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return NextResponse.json({ config: DEFAULT_RUNTIME_UI_CONFIG, updatedAt: null }, { status: 200 });
    }

    const supabase = createSupabasePublicClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });

    const { data, error } = await supabase
      .from('runtime_ui_config')
      .select('public_config, updated_at')
      .eq('id', 'default')
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json(
      { config: sanitizeRuntimeUiConfig(data?.public_config), updatedAt: (data?.updated_at as string | null) ?? null },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ config: DEFAULT_RUNTIME_UI_CONFIG, updatedAt: null }, { status: 200 });
  }
}

export async function PATCH(req: Request) {
  const auth = await requireAdminAccess();
  if (!auth.ok) {
    return NextResponse.json({ error: 'Admin access required' }, { status: auth.status });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Backend expects: { config: <unknown> }
  const bodyString = JSON.stringify(payload ?? {});
  const timestamp = Date.now().toString();
  const signature =
    REQUEST_SIGNING_SECRET
      ? crypto.createHmac('sha256', REQUEST_SIGNING_SECRET).update(`${timestamp}:${bodyString}`).digest('hex')
      : '';

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const upstream = await fetch(`${BACKEND_BASE_URL}/admin/ui-config`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${auth.token}`,
        ...(REQUEST_SIGNING_SECRET
          ? { 'X-Request-Timestamp': timestamp, 'X-Request-Signature': signature }
          : {}),
      },
      body: bodyString,
      signal: controller.signal,
      cache: 'no-store',
    });

    const text = await upstream.text();
    const res = new NextResponse(text, { status: upstream.status });
    res.headers.set('Content-Type', upstream.headers.get('content-type') || 'application/json');
    return res;
  } finally {
    clearTimeout(timeout);
  }
}

