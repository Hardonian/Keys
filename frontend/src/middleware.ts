import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { User } from '@supabase/supabase-js';

// Protected routes that require authentication
const protectedRoutes = ['/dashboard', '/chat', '/profile', '/templates', '/admin', '/api/billing'];

// Public routes that authenticated users should be redirected away from
const publicAuthRoutes = ['/signin', '/signup'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isReviewRoute = pathname.startsWith('/__review');

  let supabaseResponse = NextResponse.next({
    request,
  });

  // Add Security Headers
  supabaseResponse.headers.set('X-Frame-Options', 'DENY');
  supabaseResponse.headers.set('X-Content-Type-Options', 'nosniff');
  supabaseResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  supabaseResponse.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const supabase = url && key
    ? createServerClient(
        url,
        key,
        {
          cookies: {
            get(name: string) {
              return request.cookies.get(name)?.value;
            },
            set(name: string, value: string, options: CookieOptions) {
              request.cookies.set({
                name,
                value,
                ...options,
              });
              supabaseResponse = NextResponse.next({
                request,
              });
              supabaseResponse.cookies.set({
                name,
                value,
                ...options,
              });
            },
            remove(name: string, options: CookieOptions) {
              request.cookies.set({
                name,
                value: '',
                ...options,
              });
              supabaseResponse = NextResponse.next({
                request,
              });
              supabaseResponse.cookies.set({
                name,
                value: '',
                ...options,
              });
            },
          },
        }
      )
    : null;

  let user: User | null = null;
  
  // Only check auth if we have valid env vars
  if (url && key && supabase) {
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      user = authUser;
    } catch {
      // Ignore auth errors during build or when env vars are invalid
    }
  }

  // Internal review route gating (non-public)
  if (isReviewRoute) {
    const isPreview = process.env.VERCEL_ENV === 'preview';
    const isProd = process.env.NODE_ENV === 'production';

    // In production, require explicit enable + admin role.
    if (isProd && !isPreview) {
      if (process.env.ENABLE_INTERNAL_REVIEW_ROUTE !== 'true') {
        return new NextResponse('Not found', { status: 404 });
      }

      const role = (user as any)?.app_metadata?.role;
      const isAdmin = role === 'admin' || role === 'superadmin';
      const allowlist = (process.env.ADMIN_USER_IDS || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const isAllowlisted = user?.id ? allowlist.includes(user.id) : false;
      if (!user || !isAdmin) {
        if (isAllowlisted) return supabaseResponse;
        return new NextResponse('Not found', { status: 404 });
      }
      return supabaseResponse;
    }

    // In preview/dev: require authentication (keeps preview URLs safer if shared).
    if (!user && url && key) {
      const signInUrl = new URL('/signin', request.url);
      signInUrl.searchParams.set('returnUrl', pathname);
      return NextResponse.redirect(signInUrl);
    }

    // If env vars are missing (build), don't hard-fail.
    if (!url || !key) {
      return supabaseResponse;
    }

    return supabaseResponse;
  }

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
  const isPublicAuthRoute = publicAuthRoutes.some((route) => pathname.startsWith(route));

  // For protected routes, check authentication
  if (isProtectedRoute && !user && url && key) {
    const signInUrl = new URL('/signin', request.url);
    signInUrl.searchParams.set('returnUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // If authenticated user tries to access signin/signup, redirect to dashboard
  if (isPublicAuthRoute && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
