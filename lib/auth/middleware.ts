import { NextRequest } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { verifyToken } from './jwt';

export async function authenticateRequest(request: NextRequest) {
  // Try cookie-based authentication first
  const session = await auth();
  if (session?.user) {
    return {
      isAuthenticated: true,
      userId: session.user.id,
      user: session.user,
      authenticationType: 'cookie',
    };
  }

  // Check for JWT token in Authorization header
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const payload = verifyToken(token);

    if (payload) {
      return {
        isAuthenticated: true,
        userId: payload.userId,
        email: payload.email,
        authenticationType: 'jwt',
      };
    }
  }

  // Check for API key (for service-to-service)
  const apiKey = request.headers.get('X-API-Key');
  if (apiKey === process.env.API_KEY) {
    return {
      isAuthenticated: true,
      authenticationType: 'apiKey',
      isService: true,
    };
  }

  // Authentication failed
  return { isAuthenticated: false };
}
