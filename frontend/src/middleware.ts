import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

// Protected routes that require authentication
const protectedRoutes = ['/dashboard', '/chat', '/profile', '/templates', '/admin'];

// Public routes that authenticated users should be redirected away from
const publicAuthRoutes = ['/signin', '/signup'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  let supabaseResponse = NextResponse.next({
    request,
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Use placeholder values during build when env vars are missing
  const supabaseUrl = url || 'https://placeholder.supabase.co';
  const supabaseKey = key || 'placeholder-key';

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
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
  );

  let user = null;
  
  // Only check auth if we have valid env vars
  if (url && key) {
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      user = authUser;
    } catch {
      // Ignore auth errors during build or when env vars are invalid
    }
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
