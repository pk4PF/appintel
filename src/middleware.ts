import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Admin emails that get free access (owner)
// These should be comma-separated in the environment variable
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(email => email.trim().toLowerCase());

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    let user = null;
    try {
        const { data } = await supabase.auth.getUser();
        user = data?.user;
    } catch {
        // If auth fails, treat as unauthenticated
        user = null;
    }

    // Public routes - accessible without auth
    const publicPaths = ['/', '/login', '/signup', '/auth/callback', '/auth/logout', '/upgrade', '/privacy-policy', '/terms-of-service', '/complete-signup'];
    const isPublicPath = publicPaths.some(
        (path) => request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith('/auth/')
    );

    // If on a protected route and not authenticated, redirect to login
    if (!user && !isPublicPath) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }

    // Check if user has premium access (admin OR paid)
    if (user && !isPublicPath) {
        const userEmail = user.email?.toLowerCase() || '';
        const isAdmin = ADMIN_EMAILS.some(e => e.toLowerCase() === userEmail);
        const isPremium = user.user_metadata?.is_premium === true;

        // If not admin and not premium, redirect to upgrade page
        if (!isAdmin && !isPremium) {
            const url = request.nextUrl.clone();
            url.pathname = '/upgrade';
            return NextResponse.redirect(url);
        }
    }

    // If authenticated and trying to access root, login, or signup, redirect to dashboard
    if (user && (request.nextUrl.pathname === '/' || request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup')) {
        console.log('[DEBUG] Middleware (NO $): Redirecting authenticated user to dashboard from:', request.nextUrl.pathname);
        const url = request.nextUrl.clone();
        url.pathname = '/dashboard';
        return NextResponse.redirect(url);
    }

    return supabaseResponse;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         * - api routes
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api).*)',
    ],
};
