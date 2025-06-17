import NextAuth from 'next-auth/next'
import { authOptions } from '@/lib/auth'

const authHandler = NextAuth(authOptions)

export const GET = authHandler
export const POST = authHandler
