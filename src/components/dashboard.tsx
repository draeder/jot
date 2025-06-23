'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import WorkspaceSelector from './workspace-selector'
import WorkspaceCanvas from './workspace-canvas'
import GlobalSearch from './global-search'
import { LogOut, User } from 'lucide-react'
import { db } from '../lib/db'
import { v4 as uuidv4 } from 'uuid'

export default function Dashboard() {
  const { data: session } = useSession()
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null)
  const workspaceCanvasRef = useRef<{ resetView: () => void; focusOnCard: (cardId: string) => void } | null>(null)

  // Handle workspace selection with implied reset and persistence
  const handleWorkspaceSelect = (workspaceId: string) => {
    const previousWorkspaceId = selectedWorkspaceId
    setSelectedWorkspaceId(workspaceId)
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('jot-last-active-workspace', workspaceId)
    }
    
    // If we're switching to a different workspace, trigger reset after a brief delay
    // to allow the new workspace to load
    if (previousWorkspaceId !== workspaceId && previousWorkspaceId !== null) {
      setTimeout(() => {
        workspaceCanvasRef.current?.resetView()
      }, 100)
    }
  }

  // Handle search result selection - switch workspace and focus on card
  const handleSearchResultSelect = (workspaceId: string, cardId: string) => {
    // Switch to the workspace if not already selected
    if (selectedWorkspaceId !== workspaceId) {
      handleWorkspaceSelect(workspaceId)
      
      // Wait for workspace to load, then focus on card
      setTimeout(() => {
        workspaceCanvasRef.current?.focusOnCard(cardId)
      }, 200)
    } else {
      // Already in the correct workspace, just focus on card
      workspaceCanvasRef.current?.focusOnCard(cardId)
    }
  }

  // Create user in IndexedDB when they first sign in
  useEffect(() => {
    const createUserIfNeeded = async () => {
      if (session?.user?.email) {
        try {
          const existingUser = await db.users.where('email').equals(session.user.email).first()
          
          if (!existingUser) {
            // Create new user with email as ID if no ID is provided
            const userId = (session.user as { id?: string }).id || session.user.email || uuidv4()
            const newUser = {
              id: userId,
              email: session.user.email,
              name: session.user.name || '',
              image: session.user.image || undefined,
              provider: 'unknown', // We don't have provider info on client side
              createdAt: new Date(),
              updatedAt: new Date(),
            }
            
            await db.users.add(newUser)
            console.log('User created in IndexedDB:', session.user.email)
            
            // Create a default workspace for new users
            const defaultWorkspace = {
              id: uuidv4(),
              name: 'My First Workspace',
              userId: userId,
              order: 0,
              createdAt: new Date(),
              updatedAt: new Date(),
            }
            
            await db.workspaces.add(defaultWorkspace)
            console.log('Default workspace created for new user:', defaultWorkspace.id)
            setSelectedWorkspaceId(defaultWorkspace.id)
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
          
          {/* Global Search - centered between logo and user info */}
          <div className="flex-1 max-w-md mx-8">
            <GlobalSearch onResultSelect={handleSearchResultSelect} />
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User size={16} />
              <span>{session.user?.name || session.user?.email}</span>
            </div>
            <button
              onClick={() => signOut()}
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
      <div className="flex-1 flex overflow-hidden min-h-0">
        <WorkspaceSelector
          selectedWorkspaceId={selectedWorkspaceId}
          onWorkspaceSelect={handleWorkspaceSelect}
        />
        
        <div className="flex-1 flex flex-col min-w-0">
          {selectedWorkspaceId ? (
            <>
              <WorkspaceCanvas 
                ref={workspaceCanvasRef}
                workspaceId={selectedWorkspaceId} 
              />
            </>
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
