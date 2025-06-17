'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import WorkspaceSelector from './workspace-selector'
import WorkspaceCanvas from './workspace-canvas'
import { LogOut, User } from 'lucide-react'
import { db } from '../lib/db'
import { v4 as uuidv4 } from 'uuid'

export default function Dashboard() {
  const { data: session } = useSession()
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null)

  // Create user in IndexedDB when they first sign in
  useEffect(() => {
    const createUserIfNeeded = async () => {
      if (session?.user?.email) {
        try {
          const existingUser = await db.users.where('email').equals(session.user.email).first()
          
          if (!existingUser) {
            // Create new user with email as ID if no ID is provided
            const userId = (session.user as any).id || session.user.email || uuidv4()
            await db.users.add({
              id: userId,
              email: session.user.email,
              name: session.user.name || '',
              image: session.user.image || undefined,
              provider: 'unknown', // We don't have provider info on client side
              createdAt: new Date(),
              updatedAt: new Date(),
            })
            console.log('User created in IndexedDB:', session.user.email)
          }
        } catch (error) {
          console.error('Error creating user in IndexedDB:', error)
        }
      }
    }

    createUserIfNeeded()
  }, [session])

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Please sign in</h1>
          <p className="text-gray-600">You need to be authenticated to access your workspaces.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <img 
                src="/jotlogo.png" 
                alt="Jot Logo" 
                width={150} 
                height={75}
                className="object-contain"
              />
            </div>
            {selectedWorkspaceId && (
              <span className="text-lg text-gray-500">
                Visual note-taking workspace
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User size={16} />
              <span>{session.user?.name || session.user?.email}</span>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/auth/signin' })}
              className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              title="Sign Out"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        <WorkspaceSelector
          selectedWorkspaceId={selectedWorkspaceId}
          onWorkspaceSelect={setSelectedWorkspaceId}
        />
        
        <div className="flex-1 flex flex-col">
          {selectedWorkspaceId ? (
            <WorkspaceCanvas workspaceId={selectedWorkspaceId} />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="flex justify-center mb-6">
                  <img 
                    src="/jotlogo.png" 
                    alt="Jot Logo" 
                    width={120} 
                    height={80}
                    className="opacity-60 object-contain"
                  />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Select a workspace
                </h2>
                <p className="text-gray-600 mb-4">
                  Choose a workspace from the sidebar or create a new one to get started.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function FolderOpen({ size = 24, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.73 3l-1.5 3a2 2 0 0 1-1.73 1H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v2" />
    </svg>
  )
}
