import NextAuth from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const authHandler = NextAuth(authOptions)

export const GET = authHandler
export const POST = authHandler
