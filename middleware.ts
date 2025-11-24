import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  
  // Skip middleware for callback routes to prevent auth issues
  if (req.nextUrl.pathname.includes('/auth/callback')) {
    return res;
  }
  
  try {
    // Create a Supabase client configured to use cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return req.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              res.cookies.set({ name, value, ...options });
            });
          },
        },
      }
    );
    
    // Refresh session if expired - required for Server Components
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error("Session error:", error);
    }
    
    // Log session info for debugging
    console.log("Session check:", data.session ? "Session found" : "No session");
    
    // If no session and trying to access protected routes
    const path = req.nextUrl.pathname;
    
    if (!data.session && (path === '/chat' || path.startsWith('/chat/'))) {
      console.log("No session, redirecting to login");
      // Redirect to login page if not authenticated
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = '/login';
      return NextResponse.redirect(redirectUrl);
    }
    
    // If authenticated and trying to access auth pages
    if (data.session && path === '/login') {
      console.log("Session found, redirecting to chat");
      // Redirect to chat if already authenticated
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = '/chat';
      return NextResponse.redirect(redirectUrl);
    }
  } catch (err) {
    console.error("Middleware error:", err);
    // Continue in case of errors
  }
  
  return res;
}

// Specify which routes this middleware should run for
export const config = {
  matcher: ['/', '/login', '/chat/:path*'],
};
