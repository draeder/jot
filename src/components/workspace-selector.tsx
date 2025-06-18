'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Workspace, Card, Connection, db } from '@/lib/db'
import { Plus, FolderOpen, Edit2, Trash2, Check, X, Undo, Redo } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import ConfirmationModal from './confirmation-modal'

// Undo action types for workspace operations
type WorkspaceUndoAction = 
  | { type: 'CREATE_WORKSPACE', workspace: Workspace }
  | { type: 'DELETE_WORKSPACE', workspace: Workspace, cards: Card[], connections: Connection[] }
  | { type: 'UPDATE_WORKSPACE', oldWorkspace: Workspace, newWorkspace: Workspace }

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
  const [undoStack, setUndoStack] = useState<WorkspaceUndoAction[]>([])
  const [redoStack, setRedoStack] = useState<WorkspaceUndoAction[]>([])
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean
    workspaceId: string
    workspaceName: string
  }>({
    isOpen: false,
    workspaceId: '',
    workspaceName: ''
  })

  // Helper function to add action to undo stack
  const addToUndoStack = (action: WorkspaceUndoAction) => {
    setUndoStack(prev => [...prev, action].slice(-20)) // Keep last 20 actions
    // Clear redo stack when a new action is performed
    setRedoStack([])
  }

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
      
      // Add to undo stack
      addToUndoStack({ type: 'CREATE_WORKSPACE', workspace: newWorkspace })
    } catch (error) {
      console.error('Error creating workspace:', error)
    }
  }

  const updateWorkspace = async (id: string, name: string) => {
    if (!name.trim()) return

    // Get the old workspace for undo
    const oldWorkspace = workspaces.find(ws => ws.id === id)
    if (!oldWorkspace) return

    try {
      const updatedWorkspace = { 
        ...oldWorkspace,
        name: name.trim(), 
        updatedAt: new Date() 
      }
      
      await db.workspaces.update(id, { 
        name: name.trim(), 
        updatedAt: new Date() 
      })
      
      setWorkspaces(prev => 
        prev.map(ws => 
          ws.id === id ? updatedWorkspace : ws
        )
      )
      setEditingId(null)
      setEditingName('')
      
      // Add to undo stack if name actually changed
      if (oldWorkspace.name !== name.trim()) {
        addToUndoStack({ 
          type: 'UPDATE_WORKSPACE', 
          oldWorkspace, 
          newWorkspace: updatedWorkspace 
        })
      }
    } catch (error) {
      console.error('Error updating workspace:', error)
    }
  }

  const deleteWorkspace = async (id: string) => {
    const workspaceToDelete = workspaces.find(ws => ws.id === id)
    if (!workspaceToDelete) return
    
    try {
      // Get all cards and connections that will be deleted for undo
      const cards = await db.cards.where('workspaceId').equals(id).toArray()
      const connections = await db.connections.where('workspaceId').equals(id).toArray()
      
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
      
      // Add to undo stack
      addToUndoStack({ 
        type: 'DELETE_WORKSPACE', 
        workspace: workspaceToDelete, 
        cards, 
        connections 
      })
    } catch (error) {
      console.error('Error deleting workspace:', error)
    }
  }

  const handleDeleteClick = (workspaceId: string, workspaceName: string) => {
    setDeleteModal({
      isOpen: true,
      workspaceId,
      workspaceName
    })
  }

  const confirmDelete = () => {
    deleteWorkspace(deleteModal.workspaceId)
    setDeleteModal({ isOpen: false, workspaceId: '', workspaceName: '' })
  }

  // Undo function
  const performUndo = async () => {
    if (undoStack.length === 0) return

    const lastAction = undoStack[undoStack.length - 1]
    setUndoStack(prev => prev.slice(0, -1))
    
    // Add the action to redo stack before undoing
    setRedoStack(prev => [...prev, lastAction].slice(-20))

    try {
      switch (lastAction.type) {
        case 'CREATE_WORKSPACE':
          // Undo workspace creation by deleting the workspace
          await db.workspaces.delete(lastAction.workspace.id)
          setWorkspaces(prev => prev.filter(ws => ws.id !== lastAction.workspace.id))
          if (selectedWorkspaceId === lastAction.workspace.id) {
            const remaining = workspaces.filter(ws => ws.id !== lastAction.workspace.id)
            onWorkspaceSelect(remaining.length > 0 ? remaining[0].id : '')
          }
          break

        case 'DELETE_WORKSPACE':
          // Undo workspace deletion by recreating the workspace and its data
          await db.workspaces.add(lastAction.workspace)
          setWorkspaces(prev => [lastAction.workspace, ...prev])
          
          // Restore cards
          for (const card of lastAction.cards) {
            await db.cards.add(card)
          }
          
          // Restore connections
          for (const connection of lastAction.connections) {
            await db.connections.add(connection)
          }
          break

        case 'UPDATE_WORKSPACE':
          // Undo workspace update by restoring old workspace data
          await db.workspaces.update(lastAction.oldWorkspace.id, lastAction.oldWorkspace)
          setWorkspaces(prev => prev.map(ws => 
            ws.id === lastAction.oldWorkspace.id ? lastAction.oldWorkspace : ws
          ))
          break
      }
    } catch (error) {
      console.error('Error performing undo:', error)
      // Re-add the action to the undo stack and remove from redo stack if undo failed
      setUndoStack(prev => [...prev, lastAction])
      setRedoStack(prev => prev.slice(0, -1))
    }
  }

  // Redo function
  const performRedo = async () => {
    if (redoStack.length === 0) return

    const lastRedoAction = redoStack[redoStack.length - 1]
    setRedoStack(prev => prev.slice(0, -1))
    
    // Add the action back to undo stack
    setUndoStack(prev => [...prev, lastRedoAction].slice(-20))

    try {
      switch (lastRedoAction.type) {
        case 'CREATE_WORKSPACE':
          // Redo workspace creation by recreating the workspace
          await db.workspaces.add(lastRedoAction.workspace)
          setWorkspaces(prev => [lastRedoAction.workspace, ...prev])
          break

        case 'DELETE_WORKSPACE':
          // Redo workspace deletion by deleting the workspace again
          await db.workspaces.delete(lastRedoAction.workspace.id)
          
          // Delete all cards in the workspace
          await db.cards.where('workspaceId').equals(lastRedoAction.workspace.id).delete()
          
          // Delete all connections in the workspace
          await db.connections.where('workspaceId').equals(lastRedoAction.workspace.id).delete()
          
          setWorkspaces(prev => prev.filter(ws => ws.id !== lastRedoAction.workspace.id))
          
          // If deleted workspace was selected, select another one
          if (selectedWorkspaceId === lastRedoAction.workspace.id) {
            const remaining = workspaces.filter(ws => ws.id !== lastRedoAction.workspace.id)
            onWorkspaceSelect(remaining.length > 0 ? remaining[0].id : '')
          }
          break

        case 'UPDATE_WORKSPACE':
          // Redo workspace update by applying the new workspace data
          await db.workspaces.update(lastRedoAction.newWorkspace.id, lastRedoAction.newWorkspace)
          setWorkspaces(prev => prev.map(ws => 
            ws.id === lastRedoAction.newWorkspace.id ? lastRedoAction.newWorkspace : ws
          ))
          break
      }
    } catch (error) {
      console.error('Error performing redo:', error)
      // Remove from undo stack and re-add to redo stack if redo failed
      setUndoStack(prev => prev.slice(0, -1))
      setRedoStack(prev => [...prev, lastRedoAction])
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
    <div className="w-64 min-w-64 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Workspaces</h2>
        
        {/* Undo/Redo Buttons - aligned with New Workspace button */}
        <div className="flex justify-center gap-1 mb-3">
          <button
            onClick={performUndo}
            disabled={undoStack.length === 0}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
              undoStack.length === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            title={`Undo workspace action (${undoStack.length} available)`}
          >
            <Undo size={12} />
            Undo
          </button>
          
          <button
            onClick={performRedo}
            disabled={redoStack.length === 0}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
              redoStack.length === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            title={`Redo workspace action (${redoStack.length} available)`}
          >
            <Redo size={12} />
            Redo
          </button>
        </div>
        
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
          <div className="flex justify-center">
            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <Plus size={16} />
              New Workspace
            </button>
          </div>
        )}
      </div>

      {/* Workspace list */}
      <div className="flex-1 overflow-y-auto">
        {workspaces.map(workspace => (
          <div
            key={workspace.id}
            className={`group relative flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer min-w-0 ${
              selectedWorkspaceId === workspace.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
            }`}
            onClick={() => !editingId && onWorkspaceSelect(workspace.id)}
          >
            <FolderOpen 
              size={16} 
              className={`mr-3 flex-shrink-0 ${
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
                <span className={`flex-1 text-sm ${
                  selectedWorkspaceId === workspace.id ? 'text-blue-900 font-medium' : 'text-gray-700'
                } overflow-hidden text-ellipsis whitespace-nowrap pr-2`}>
                  {workspace.name}
                </span>
                
                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 flex-shrink-0 ml-2">
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
                      handleDeleteClick(workspace.id, workspace.name)
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

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, workspaceId: '', workspaceName: '' })}
        onConfirm={confirmDelete}
        title="Remove Workspace"
        message={`Remove "${deleteModal.workspaceName}" from your workspace list? This will also remove all cards and connections in this workspace. You can undo this action if needed.`}
        confirmText="Remove"
        cancelText="Keep"
        variant="warning"
      />
    </div>
  )
}
