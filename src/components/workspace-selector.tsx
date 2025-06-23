'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Workspace, Card, Connection, db } from '@/lib/db'
import { Plus, FolderOpen, Edit2, Trash2, Check, X, Undo, Redo, GripVertical } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import ConfirmationModal from './confirmation-modal'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, useSensor, useSensors, PointerSensor, closestCenter } from '@dnd-kit/core'
import { SortableContext, arrayMove, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// Undo action types for workspace operations
type WorkspaceUndoAction = 
  | { type: 'CREATE_WORKSPACE', workspace: Workspace }
  | { type: 'DELETE_WORKSPACE', workspace: Workspace, cards: Card[], connections: Connection[] }
  | { type: 'UPDATE_WORKSPACE', oldWorkspace: Workspace, newWorkspace: Workspace }
  | { type: 'REORDER_WORKSPACES', oldOrder: Workspace[], newOrder: Workspace[] }

// Sortable workspace item component
function SortableWorkspaceItem({ 
  workspace, 
  isSelected, 
  isEditing, 
  editingName, 
  onSelect, 
  onEdit, 
  onSave, 
  onCancel, 
  onDelete, 
  onEditNameChange 
}: {
  workspace: Workspace
  isSelected: boolean
  isEditing: boolean
  editingName: string
  onSelect: () => void
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
  onDelete: () => void
  onEditNameChange: (value: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: workspace.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group cursor-pointer border rounded-lg transition-all ${
        isSelected 
          ? 'bg-blue-50 border-blue-200 shadow-sm' 
          : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
      }`}
    >
      <div className="flex items-center gap-3 p-3">
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="flex items-center justify-center w-4 h-4 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
          title="Drag to reorder"
        >
          <GripVertical size={14} />
        </div>

        {/* Workspace icon and content */}
        <div className="flex items-center gap-3 flex-1 min-w-0" onClick={onSelect}>
          <FolderOpen size={16} className={isSelected ? 'text-blue-600' : 'text-gray-500'} />
          
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <input
                type="text"
                value={editingName}
                onChange={(e) => onEditNameChange(e.target.value)}
                onBlur={onSave}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onSave()
                  if (e.key === 'Escape') onCancel()
                }}
                className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className={`block text-sm font-medium truncate ${
                isSelected ? 'text-blue-900' : 'text-gray-900'
              }`}>
                {workspace.name}
              </span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {isEditing ? (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onSave()
                }}
                className="p-1 text-green-600 hover:bg-green-50 rounded"
                title="Save"
              >
                <Check size={14} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onCancel()
                }}
                className="p-1 text-gray-500 hover:bg-gray-100 rounded"
                title="Cancel"
              >
                <X size={14} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit()
                }}
                className="p-1 text-gray-500 hover:bg-gray-100 rounded"
                title="Rename"
              >
                <Edit2 size={14} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete()
                }}
                className="p-1 text-red-500 hover:bg-red-50 rounded"
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

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
  const [draggedWorkspace, setDraggedWorkspace] = useState<Workspace | null>(null)
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean
    workspaceId: string
    workspaceName: string
  }>({
    isOpen: false,
    workspaceId: '',
    workspaceName: ''
  })

  // Setup drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  // Helper function to add action to undo stack
  const addToUndoStack = (action: WorkspaceUndoAction) => {
    setUndoStack(prev => [...prev, action].slice(-20)) // Keep last 20 actions
    // Clear redo stack when a new action is performed
    setRedoStack([])
  }

  // Save last active workspace to localStorage
  const saveLastActiveWorkspace = useCallback((workspaceId: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('jot-last-active-workspace', workspaceId)
    }
  }, [])

  // Load last active workspace from localStorage
  const loadLastActiveWorkspace = useCallback((): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('jot-last-active-workspace')
    }
    return null
  }, [])

  const loadWorkspaces = useCallback(async () => {
    if (!session?.user?.email) {
      console.log('No session or email available for loading workspaces')
      return
    }

    try {
      // First get the user ID from the database
      const dbUser = await db.users.where('email').equals(session.user.email).first()
      if (!dbUser) {
        console.log('No user found in database for email:', session.user.email)
        return
      }

      console.log('Loading workspaces for user:', dbUser.id)
      const userWorkspaces = await db.workspaces
        .where('userId')
        .equals(dbUser.id)
        .toArray()
      
      console.log('Found workspaces:', userWorkspaces.length)
      
      // Sort by order first, then by updatedAt if order is missing/same
      userWorkspaces.sort((a, b) => {
        if (a.order !== undefined && b.order !== undefined) {
          return a.order - b.order
        }
        // Fallback to date sorting for workspaces without order
        return b.updatedAt.getTime() - a.updatedAt.getTime()
      })
      
      setWorkspaces(userWorkspaces)
      
      // Try to restore last active workspace first
      const lastActiveWorkspaceId = loadLastActiveWorkspace()
      const lastActiveExists = userWorkspaces.find(ws => ws.id === lastActiveWorkspaceId)
      
      if (!selectedWorkspaceId && userWorkspaces.length > 0) {
        if (lastActiveExists) {
          console.log('Restoring last active workspace:', lastActiveWorkspaceId)
          onWorkspaceSelect(lastActiveWorkspaceId!)
        } else {
          console.log('Auto-selecting first workspace:', userWorkspaces[0].id)
          onWorkspaceSelect(userWorkspaces[0].id)
          saveLastActiveWorkspace(userWorkspaces[0].id)
        }
      }
    } catch (error) {
      console.error('Error loading workspaces:', error)
    }
  }, [session, selectedWorkspaceId, onWorkspaceSelect, loadLastActiveWorkspace, saveLastActiveWorkspace])

  useEffect(() => {
    loadWorkspaces()
  }, [loadWorkspaces])

  // Handle workspace selection and save to localStorage
  const handleWorkspaceSelect = (workspaceId: string) => {
    onWorkspaceSelect(workspaceId)
    saveLastActiveWorkspace(workspaceId)
  }

  // Drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const workspace = workspaces.find(ws => ws.id === active.id)
    if (workspace) {
      setDraggedWorkspace(workspace)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setDraggedWorkspace(null)

    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = workspaces.findIndex(ws => ws.id === active.id)
    const newIndex = workspaces.findIndex(ws => ws.id === over.id)

    if (oldIndex !== -1 && newIndex !== -1) {
      const oldOrder = [...workspaces]
      const newOrder = arrayMove(workspaces, oldIndex, newIndex)
      
      // Update order values in the database
      const updatePromises = newOrder.map((workspace, index) => {
        const newOrderValue = index
        return db.workspaces.update(workspace.id, { order: newOrderValue })
      })

      // Update UI immediately (optimistic update)
      setWorkspaces(newOrder.map((ws, index) => ({ ...ws, order: index })))
      
      // Update database in background
      Promise.all(updatePromises).catch(error => {
        console.error('Error updating workspace order:', error)
        // Revert on error
        setWorkspaces(oldOrder)
      })

      // Add to undo stack
      addToUndoStack({ 
        type: 'REORDER_WORKSPACES', 
        oldOrder, 
        newOrder: newOrder.map((ws, index) => ({ ...ws, order: index }))
      })
    }
  }

  const createWorkspace = async () => {
    if (!session?.user?.email || !newWorkspaceName.trim()) return

    try {
      // First get the user ID from the database
      const dbUser = await db.users.where('email').equals(session.user.email).first()
      if (!dbUser) return

      // Calculate the next order value (add to end)
      const maxOrder = workspaces.length > 0 
        ? Math.max(...workspaces.map(ws => ws.order || 0))
        : 0

      const newWorkspace: Workspace = {
        id: uuidv4(),
        name: newWorkspaceName.trim(),
        userId: dbUser.id,
        order: maxOrder + 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      await db.workspaces.add(newWorkspace)
      setWorkspaces(prev => [...prev, newWorkspace])
      onWorkspaceSelect(newWorkspace.id)
      saveLastActiveWorkspace(newWorkspace.id)
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

        case 'REORDER_WORKSPACES':
          // Undo workspace reordering by restoring old order
          const oldOrderRestorePromises = lastAction.oldOrder.map((workspace, index) => 
            db.workspaces.update(workspace.id, { order: index })
          )
          await Promise.all(oldOrderRestorePromises)
          setWorkspaces(lastAction.oldOrder)
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

        case 'REORDER_WORKSPACES':
          // Redo workspace reordering by applying new order
          const newOrderRestorePromises = lastRedoAction.newOrder.map((workspace, index) => 
            db.workspaces.update(workspace.id, { order: index })
          )
          await Promise.all(newOrderRestorePromises)
          setWorkspaces(lastRedoAction.newOrder)
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
        
        {/* Undo/Redo Buttons - left justified */}
        <div className="flex justify-start gap-1 mb-3">
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

      {/* Workspace list with drag and drop */}
      <div className="flex-1 overflow-y-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={workspaces.map(ws => ws.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2 p-3">
              {workspaces.map(workspace => (
                <SortableWorkspaceItem
                  key={workspace.id}
                  workspace={workspace}
                  isSelected={selectedWorkspaceId === workspace.id}
                  isEditing={editingId === workspace.id}
                  editingName={editingName}
                  onSelect={() => handleWorkspaceSelect(workspace.id)}
                  onEdit={() => startEditing(workspace)}
                  onSave={() => updateWorkspace(workspace.id, editingName)}
                  onCancel={cancelEditing}
                  onDelete={() => handleDeleteClick(workspace.id, workspace.name)}
                  onEditNameChange={setEditingName}
                />
              ))}
            </div>
          </SortableContext>
          
          <DragOverlay>
            {draggedWorkspace ? (
              <div className="bg-white border-2 border-blue-300 rounded-lg p-3 shadow-lg">
                <div className="flex items-center gap-3">
                  <GripVertical size={14} className="text-gray-400" />
                  <FolderOpen size={16} className="text-blue-600" />
                  <span className="text-sm font-medium text-gray-900">{draggedWorkspace.name}</span>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
        
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
