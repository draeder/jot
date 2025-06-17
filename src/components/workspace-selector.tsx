'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Workspace, db } from '@/lib/db'
import { Plus, FolderOpen, Edit2, Trash2, Check, X } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'

interface WorkspaceSelectorProps {
  selectedWorkspaceId: string | null
  onWorkspaceSelect: (workspaceId: string) => void
}

export default function WorkspaceSelector({ selectedWorkspaceId, onWorkspaceSelect }: WorkspaceSelectorProps) {
  const { data: session } = useSession()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [newWorkspaceName, setNewWorkspaceName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  const loadWorkspaces = useCallback(async () => {
    if (!session?.user?.email) return

    try {
      // First get the user ID from the database
      const dbUser = await db.users.where('email').equals(session.user.email).first()
      if (!dbUser) return

      const userWorkspaces = await db.workspaces
        .where('userId')
        .equals(dbUser.id)
        .toArray()
      
      // Sort by updatedAt in descending order (newest first)
      userWorkspaces.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      
      setWorkspaces(userWorkspaces)
      
      // Auto-select first workspace if none selected
      if (!selectedWorkspaceId && userWorkspaces.length > 0) {
        onWorkspaceSelect(userWorkspaces[0].id)
      }
    } catch (error) {
      console.error('Error loading workspaces:', error)
    }
  }, [session, selectedWorkspaceId, onWorkspaceSelect])

  useEffect(() => {
    loadWorkspaces()
  }, [loadWorkspaces])

  const createWorkspace = async () => {
    if (!session?.user?.email || !newWorkspaceName.trim()) return

    try {
      // First get the user ID from the database
      const dbUser = await db.users.where('email').equals(session.user.email).first()
      if (!dbUser) return

      const newWorkspace: Workspace = {
        id: uuidv4(),
        name: newWorkspaceName.trim(),
        userId: dbUser.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      await db.workspaces.add(newWorkspace)
      setWorkspaces(prev => [newWorkspace, ...prev])
      onWorkspaceSelect(newWorkspace.id)
      setIsCreating(false)
      setNewWorkspaceName('')
    } catch (error) {
      console.error('Error creating workspace:', error)
    }
  }

  const updateWorkspace = async (id: string, name: string) => {
    if (!name.trim()) return

    try {
      await db.workspaces.update(id, { 
        name: name.trim(), 
        updatedAt: new Date() 
      })
      setWorkspaces(prev => 
        prev.map(ws => 
          ws.id === id 
            ? { ...ws, name: name.trim(), updatedAt: new Date() }
            : ws
        )
      )
      setEditingId(null)
      setEditingName('')
    } catch (error) {
      console.error('Error updating workspace:', error)
    }
  }

  const deleteWorkspace = async (id: string) => {
    if (!confirm('Are you sure you want to delete this workspace? All cards and connections will be lost.')) {
      return
    }

    try {
      // Delete all cards in the workspace
      await db.cards.where('workspaceId').equals(id).delete()
      
      // Delete all connections in the workspace
      await db.connections.where('workspaceId').equals(id).delete()
      
      // Delete the workspace
      await db.workspaces.delete(id)
      
      setWorkspaces(prev => prev.filter(ws => ws.id !== id))
      
      // If deleted workspace was selected, select another one
      if (selectedWorkspaceId === id) {
        const remaining = workspaces.filter(ws => ws.id !== id)
        onWorkspaceSelect(remaining.length > 0 ? remaining[0].id : '')
      }
    } catch (error) {
      console.error('Error deleting workspace:', error)
    }
  }

  const startEditing = (workspace: Workspace) => {
    setEditingId(workspace.id)
    setEditingName(workspace.name)
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditingName('')
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Workspaces</h2>
        
        {/* Create new workspace */}
        {isCreating ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              placeholder="Workspace name"
              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
              autoFocus
              onKeyPress={(e) => {
                if (e.key === 'Enter') createWorkspace()
                if (e.key === 'Escape') {
                  setIsCreating(false)
                  setNewWorkspaceName('')
                }
              }}
            />
            <button
              onClick={createWorkspace}
              className="p-1 text-green-600 hover:bg-green-100 rounded"
              title="Create"
            >
              <Check size={16} />
            </button>
            <button
              onClick={() => {
                setIsCreating(false)
                setNewWorkspaceName('')
              }}
              className="p-1 text-gray-600 hover:bg-gray-100 rounded"
              title="Cancel"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            className="w-full flex items-center gap-2 px-3 py-2 text-left text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <Plus size={16} />
            New Workspace
          </button>
        )}
      </div>

      {/* Workspace list */}
      <div className="flex-1 overflow-y-auto">
        {workspaces.map(workspace => (
          <div
            key={workspace.id}
            className={`group relative flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer ${
              selectedWorkspaceId === workspace.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
            }`}
            onClick={() => !editingId && onWorkspaceSelect(workspace.id)}
          >
            <FolderOpen 
              size={16} 
              className={`mr-3 ${
                selectedWorkspaceId === workspace.id ? 'text-blue-600' : 'text-gray-400'
              }`} 
            />
            
            {editingId === workspace.id ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                  autoFocus
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') updateWorkspace(workspace.id, editingName)
                    if (e.key === 'Escape') cancelEditing()
                  }}
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    updateWorkspace(workspace.id, editingName)
                  }}
                  className="p-1 text-green-600 hover:bg-green-100 rounded"
                  title="Save"
                >
                  <Check size={14} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    cancelEditing()
                  }}
                  className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                  title="Cancel"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <>
                <span className={`flex-1 text-sm truncate ${
                  selectedWorkspaceId === workspace.id ? 'text-blue-900 font-medium' : 'text-gray-700'
                }`}>
                  {workspace.name}
                </span>
                
                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      startEditing(workspace)
                    }}
                    className="p-1 text-gray-600 hover:bg-gray-200 rounded"
                    title="Rename"
                  >
                    <Edit2 size={12} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteWorkspace(workspace.id)
                    }}
                    className="p-1 text-red-600 hover:bg-red-100 rounded"
                    title="Delete"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
        
        {workspaces.length === 0 && !isCreating && (
          <div className="p-4 text-center text-gray-500 text-sm">
            No workspaces yet.<br />
            Create your first workspace to get started.
          </div>
        )}
      </div>
    </div>
  )
}
