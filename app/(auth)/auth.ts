import { compare } from 'bcrypt-ts';
import NextAuth, { type DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { createGuestUser, getUser } from '@/lib/db/queries';
import { authConfig } from './auth.config';
import { DUMMY_PASSWORD } from '@/lib/constants';
import type { DefaultJWT } from 'next-auth/jwt';

export type UserType = 'guest' | 'regular';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string;
      type: UserType;
    } & DefaultSession['user'];
    chat?: {
      id: string;
      messages: Array<{
        id: string;
        content: string;
        role: 'user' | 'assistant' | 'system';
        createdAt: Date;
      }>;
    };
  }

  interface User {
    id?: string;
    email?: string | null;
    type: UserType;
    chat?: {
      id: string;
      messages: Array<{
        id: string;
        content: string;
        role: 'user' | 'assistant' | 'system';
        createdAt: Date;
      }>;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string;
    type: UserType;
    chat?: {
      id: string;
      messages: Array<{
        id: string;
        content: string;
        role: 'user' | 'assistant' | 'system';
        createdAt: Date;
      }>;
    };
  }
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {},
      async authorize({ email, password }: any) {
        const users = await getUser(email);

        if (users.length === 0) {
          await compare(password, DUMMY_PASSWORD);
          return null;
        }

        const [user] = users;

        if (!user.password) {
          await compare(password, DUMMY_PASSWORD);
          return null;
        }

        const passwordsMatch = await compare(password, user.password);

        if (!passwordsMatch) return null;

        return { ...user, type: 'regular' };
      },
    }),
    Credentials({
      id: 'guest',
      credentials: {},
      async authorize() {
        const [guestUser] = await createGuestUser();

        // Create initial chat for guest users
        const initialChat = {
          id: `chat-${Date.now()}`,
          messages: [
            {
              id: `msg-${Date.now()}`,
              content: 'Welcome to th3 Chat, how may I assist you today?',
              role: 'assistant' as const,
              createdAt: new Date(),
            },
          ],
        };

        return {
          ...guestUser,
          type: 'guest',
          chat: initialChat,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.type = user.type;

        // Initialize chat with a welcome message
        if (!token.chat) {
          const chatId = `chat-${Date.now()}`;
          token.chat = {
            id: chatId,
            messages: [
              {
                id: `msg-${Date.now()}`,
                content: 'Welcome! How can I help you today?',
                role: 'assistant' as const,
                createdAt: new Date(),
              },
            ],
          };
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.type = token.type;

        // Include chat in session
        if (token.chat) {
          session.chat = token.chat;
        }
      }

      return session;
    },
  },
});
