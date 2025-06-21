'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Dashboard from '@/components/dashboard'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [forceRedirect, setForceRedirect] = useState(false)

  useEffect(() => {
    console.log('Session status:', status, 'Session:', session)
    if (status === 'loading') {
      // Set a timeout to prevent infinite loading
      const timeout = setTimeout(() => {
        console.log('Session loading timeout - forcing redirect to signin')
        setForceRedirect(true)
      }, 10000) // 10 seconds timeout
      
      return () => clearTimeout(timeout)
    }
    
    if (!session || forceRedirect) {
      console.log('No session or forced redirect, redirecting to signin')
      router.push('/auth/signin')
    }
  }, [session, status, router, forceRedirect])

  if (status === 'loading' && !forceRedirect) {
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

  if (!session || forceRedirect) {
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
