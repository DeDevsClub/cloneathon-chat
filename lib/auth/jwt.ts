import { sign, verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRY = '7d';

export interface TokenPayload {
  userId: string;
  email: string;
  issuedAt: number;
}

export function generateToken(userId: string, email: string): string {
  return sign(
    { userId, email, issuedAt: Date.now() } as TokenPayload,
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY },
  );
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}
