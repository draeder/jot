import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import AzureADProvider from 'next-auth/providers/azure-ad'
import AppleProvider from 'next-auth/providers/apple'
import CredentialsProvider from 'next-auth/providers/credentials'
// import { db } from './db'
import { v4 as uuidv4 } from 'uuid'

interface SignInCallbackParams {
  user: {
    id?: string
    email?: string | null
    name?: string | null
    image?: string | null
  }
  account: {
    provider?: string
  } | null
}

interface SessionCallbackParams {
  session: {
    user?: {
      email?: string | null
      name?: string | null
      image?: string | null
      id?: string
    }
    expires: string
  }
}

interface JWTCallbackParams {
  token: {
    provider?: string
    [key: string]: unknown
  }
  account?: {
    provider?: string
  } | null
}

export const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      id: 'local',
      name: 'Local-only',
      credentials: {
        name: { label: 'Name', type: 'text', placeholder: 'Enter any name' },
      },
      async authorize(credentials) {
        // For local development, accept any name
        if (credentials?.name) {
          const email = `${credentials.name.toLowerCase().replace(/\s+/g, '')}@local.dev`
          return {
            id: uuidv4(),
            name: credentials.name,
            email: email,
            image: null,
          }
        }
        return null
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    AppleProvider({
      clientId: process.env.APPLE_CLIENT_ID!,
      clientSecret: process.env.APPLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID || 'common',
      name: 'Microsoft',
    }),
  ],
  callbacks: {
    async signIn({ user }: SignInCallbackParams) {
      // Simply return true for all valid sign-ins
      // User creation will be handled on the client side
      return !!(user.email);
    },
    async session({ session }: SessionCallbackParams) {
      // Add a consistent user ID based on email for session management
      if (session.user?.email) {
        // Generate a consistent ID based on email for session management
        session.user.id = session.user.email;
      }
      return session;
    },
    async jwt({ token, account }: JWTCallbackParams) {
      if (account) {
        token.provider = account.provider;
      }
      return token;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt' as const,
  },
};