import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { guestRegex, isDevelopmentEnvironment } from './lib/constants';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  console.log(`MIDDLEWARE DEBUG - Processing path: ${pathname}`);

  /*
   * Playwright starts the dev server and requires a 200 status to
   * begin the tests, so this ensures that the tests can start
   */
  if (pathname.startsWith('/ping')) {
    return new Response('pong', { status: 200 });
  }

  if (pathname.startsWith('/api/auth')) {
    console.log('MIDDLEWARE DEBUG - Skipping auth path');
    return NextResponse.next();
  }

  // Allow direct access to project chat routes without redirecting
  if (pathname.match(/^\/projects\/[\w-]+\/chats\/[\w-]+$/)) {
    console.log('MIDDLEWARE DEBUG - Direct access to project chat path');
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: !isDevelopmentEnvironment,
  });

  console.log(
    `MIDDLEWARE DEBUG - Token check for ${pathname}: ${token ? 'Token found' : 'No token'}`,
  );

  if (!token) {
    // Skip authentication redirect for project chat routes to debug the issue
    if (pathname.match(/^\/projects\/[\w-]+\/chats\/[\w-]+$/)) {
      console.log(
        `MIDDLEWARE DEBUG - Skipping auth redirect for project chat: ${pathname}`,
      );
      return NextResponse.next();
    }

    const redirectUrl = encodeURIComponent(request.url);
    console.log(`MIDDLEWARE DEBUG - Redirecting to guest auth: ${redirectUrl}`);

    return NextResponse.redirect(
      new URL(`/api/auth/guest?redirectUrl=${redirectUrl}`, request.url),
    );
  }

  const isGuest = guestRegex.test(token?.email ?? '');

  if (token && !isGuest && ['/login', '/signup'].includes(pathname)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/api/:path*',
    '/login',
    '/signup',
    `/chat`,
    `/vote`,
    `/projects/:path*`,

    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
