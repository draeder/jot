'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Dashboard from '@/components/dashboard'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    console.log('Session status:', status, 'Session:', session)
    if (status === 'loading') return // Still loading
    if (!session) {
      console.log('No session, redirecting to signin')
      router.push('/auth/signin')
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading session...</p>
          <p className="mt-2 text-sm text-gray-500">Status: {status}</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to sign in...</p>
        </div>
      </div>
    )
  }

  console.log('Rendering Dashboard with session:', session.user?.email)
  return <Dashboard />
}
