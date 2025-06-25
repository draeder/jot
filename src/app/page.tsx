'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Dashboard from '@/components/dashboard'
import LandingPage from './landing/page'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [forceRedirect, setForceRedirect] = useState(false)

  useEffect(() => {
    console.log('Session status:', status, 'Session:', session)
    if (status === 'loading') {
      // Set a timeout to prevent infinite loading
      const timeout = setTimeout(() => {
        console.log('Session loading timeout - showing landing page')
        setForceRedirect(true)
      }, 5000) // 5 seconds timeout
      
      return () => clearTimeout(timeout)
    }
  }, [session, status, router, forceRedirect])

  // Show loading only briefly
  if (status === 'loading' && !forceRedirect) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // If no session, show landing page
  if (!session || forceRedirect) {
    return <LandingPage />
  }

  // If logged in, show the dashboard
  console.log('Rendering Dashboard with session:', session.user?.email)
  return <Dashboard />
}
