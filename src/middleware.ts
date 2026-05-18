import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE = 'meditrack_session';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. Skip middleware for static files and internal Next.js requests
    if (
        pathname.includes('.') ||
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api')
    ) {
        return NextResponse.next();
    }

    // 2. Define public routes that don't require authentication
    const isPublicRoute = pathname === '/login';

    // 3. Get the session cookie
    const session = request.cookies.get(SESSION_COOKIE);

    // 4. Redirect Logic
    if (!session && !isPublicRoute) {
        // If no session and trying to access a protected route, redirect to login
        const loginUrl = new URL('/login', request.url);
        // Optional: add a 'from' query param to return after login
        // loginUrl.searchParams.set('from', pathname);
        return NextResponse.redirect(loginUrl);
    }

    if (session && isPublicRoute) {
        // If already logged in and trying to access /login, redirect to home
        return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
