import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  
  // Create a Supabase client using the SSR package
  const cookieStore = cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => {
          const cookie = cookieStore.get(name);
          return cookie?.value;
        },
        set: (name, value, options) => {
          cookieStore.set(name, value, options);
          return {};
        },
        remove: (name, options) => {
          cookieStore.set(name, '', { ...options, maxAge: 0 });
          return {};
        },
      },
    }
  );

  if (code) {
    try {
      // Exchange the code for a session - this will automatically set the cookies
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error("Auth error:", error);
        // Redirect to login page with error
        return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url));
      }
      
      console.log("Authentication successful", data.session?.user?.id);
      
      // URL to redirect to after sign in process completes
      return NextResponse.redirect(new URL('/chat', request.url));
    } catch (err) {
      console.error("Exception during auth:", err);
      return NextResponse.redirect(new URL(`/login?error=Authentication+failed`, request.url));
    }
  }

  // If no code is present, redirect to login
  return NextResponse.redirect(new URL('/login', request.url));
}
