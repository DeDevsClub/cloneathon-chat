import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { guestRegex, isDevelopmentEnvironment } from './lib/constants';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Fetch token once at the beginning
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: !isDevelopmentEnvironment,
  });

  // 1. Handle protected routes
  const adminRoutes = ['/tests/ids', '/tests', '/tests/chat'];
  const guestRoutes = ['/login', '/signup', '/', '/chats'];
  const isGuest = guestRegex.test(token?.email ?? ''); // Can use token.email directly
  // console.log({ isGuest });
  if (guestRoutes.includes(pathname) && isGuest) {
    console.log('Handling guest route:', pathname);
    console.log('No token for protected route, redirecting to guest auth.');
    // constq redirectUrl = encodeURIComponent(request.url);
    return NextResponse.redirect(new URL(`/login`, request.url));
  }

  if (adminRoutes.includes(pathname)) {
    console.log('Handling protected route:', pathname);
    if (!token) {
      console.log('No token for protected route, redirecting to guest auth.');
      const redirectUrl = encodeURIComponent(request.url);
      return NextResponse.redirect(
        new URL(`/api/auth/guest?redirectUrl=${redirectUrl}`, request.url),
      );
    }

    // Token exists, check authorization
    // Ensure AUTHORIZED_EMAIL is set in your .env file
    const isAuthorized = token?.email
      ? process.env.AUTHORIZED_EMAILS?.includes(token.email)
      : false;
    console.log({ isAuthorized });
    if (!isAuthorized) {
      console.log(
        'User not authorized for protected route, redirecting to guest auth.',
      );
      const redirectUrl = encodeURIComponent(request.url);
      return NextResponse.redirect(
        new URL(`/api/auth/guest?redirectUrl=${redirectUrl}`, request.url),
      );
    }

    console.log('User authorized for protected route.');
    return NextResponse.next(); // Authorized for protected route
  }

  // 2. Handle /ping route for Playwright
  if (pathname.startsWith('/ping')) {
    return new Response('pong', { status: 200 });
  }

  // 3. Handle /api/auth routes (allow them to pass through)
  // if (pathname.startsWith('/api/auth')) {
  //   return NextResponse.next();
  // }

  // 4. Handle all other routes (general authentication check)
  if (!token && isGuest) {
    // No token, check if it's a guest-allowed public path (e.g., landing page, /login itself)
    // Ensure guestRegex is correctly defined in lib/constants.ts
    if (guestRegex.test(pathname)) {
      console.log('Guest-allowed path, proceeding without token:', pathname);
      return NextResponse.next();
    } else {
      // Not a guest-allowed path and no token, redirect to login
      console.log(
        'No token for non-guest path, redirecting to login:',
        pathname,
      );
      const loginUrl = new URL('/login', request.url); // Adjust '/login' if your login path is different
      return NextResponse.redirect(loginUrl);
    }
  } else {
    // Token exists, handle authenticated user logic
    // Note: token is guaranteed to be non-null here
    const isGuest = guestRegex.test(token?.email ?? ''); // Can use token.email directly
    // If an authenticated non-guest user tries to access /login or /signup, redirect to home
    if (token && !isGuest && ['/login', '/signup'].includes(pathname)) {
      console.log(
        'Authenticated non-guest user on login/signup page, redirecting to home.',
      );
      return NextResponse.redirect(new URL('/chats', request.url));
    }
    // For all other cases where a token exists and it's not a special case above
    // console.log('Authenticated access for token:', token, 'to path:', pathname);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/',
    '/chats/:chatId*',
    '/api/:path*',
    '/login',
    '/signup',
    '/projects/:projectId*',

    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
