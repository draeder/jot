'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Download, Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react'
import { db, User, Workspace, Card, Connection } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'

interface ExportData {
  version: string
  exportDate: string
  user: User
  workspaces: Workspace[]
  cards: Card[]
  connections: Connection[]
}

interface ExportImportProps {
  onImportComplete?: () => void
}

export default function ExportImport({ onImportComplete }: ExportImportProps) {
  const { data: session } = useSession()
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [showOverwriteConfirm, setShowOverwriteConfirm] = useState(false)
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null)
  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'error' | null
    message: string
  }>({ type: null, message: '' })

  const exportAllData = async () => {
    if (!session?.user?.email) {
      setImportStatus({ type: 'error', message: 'Please sign in to export data' })
      return
    }

    setIsExporting(true)
    try {
      // Get current user from database
      const dbUser = await db.users.where('email').equals(session.user.email).first()
      if (!dbUser) {
        throw new Error('User not found in database')
      }

      // Get all user's workspaces
      const userWorkspaces = await db.workspaces.where('userId').equals(dbUser.id).toArray()
      
      // Get all cards for user's workspaces
      const workspaceIds = userWorkspaces.map(ws => ws.id)
      const allCards: Card[] = []
      for (const workspaceId of workspaceIds) {
        const workspaceCards = await db.cards.where('workspaceId').equals(workspaceId).toArray()
        allCards.push(...workspaceCards)
      }

      // Get all connections for user's workspaces
      const allConnections: Connection[] = []
      for (const workspaceId of workspaceIds) {
        const workspaceConnections = await db.connections.where('workspaceId').equals(workspaceId).toArray()
        allConnections.push(...workspaceConnections)
      }

      // Create export data structure
      const exportData: ExportData = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        user: dbUser,
        workspaces: userWorkspaces,
        cards: allCards,
        connections: allConnections
      }

      // Convert to JSON and download
      const jsonString = JSON.stringify(exportData, null, 2)
      const blob = new Blob([jsonString], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `jot-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      setImportStatus({ 
        type: 'success', 
        message: `Exported ${userWorkspaces.length} workspaces, ${allCards.length} cards, and ${allConnections.length} connections` 
      })
      
    } catch (error) {
      console.error('Export error:', error)
      setImportStatus({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Export failed' 
      })
    } finally {
      setIsExporting(false)
      setShowDropdown(false)
    }
  }

  const importData = async (file: File, overwrite = false) => {
    console.log('Starting import process, overwrite:', overwrite)
    if (!session?.user?.email) {
      setImportStatus({ type: 'error', message: 'Please sign in to import data' })
      return
    }

    setIsImporting(true)
    let shouldCleanup = true
    
    try {
      const fileContent = await file.text()
      const importData: ExportData = JSON.parse(fileContent)
      console.log('Parsed import data:', { 
        workspaces: importData.workspaces?.length || 0, 
        cards: importData.cards?.length || 0, 
        connections: importData.connections?.length || 0 
      })

      // Validate import data structure
      if (!importData.version || !importData.user || !importData.workspaces || !importData.cards || !importData.connections) {
        throw new Error('Invalid export file format')
      }

      // Get current user from database
      const currentUser = await db.users.where('email').equals(session.user.email).first()
      if (!currentUser) {
        throw new Error('Current user not found in database')
      }
      console.log('Current user found:', currentUser.id)

      // Check for conflicts first
      let hasConflicts = false
      if (!overwrite) {
        console.log('Checking for conflicts...')
        const existingWorkspaces = await db.workspaces.where('userId').equals(currentUser.id).toArray()
        console.log('Existing workspaces:', existingWorkspaces.map(ws => ws.name))
        console.log('Import workspaces:', importData.workspaces.map(ws => ws.name))
        
        for (const workspace of importData.workspaces) {
          const existingWorkspace = await db.workspaces
            .where('userId').equals(currentUser.id)
            .and(ws => ws.name === workspace.name)
            .first()
          
          if (existingWorkspace) {
            console.log('Conflict found with workspace:', workspace.name, 'existing:', existingWorkspace.name)
            hasConflicts = true
            break
          }
        }

        if (hasConflicts) {
          console.log('Conflicts detected, showing overwrite modal')
          // Show overwrite confirmation
          setPendingImportFile(file)
          setShowOverwriteConfirm(true)
          setShowDropdown(false)
          setIsImporting(false)
          shouldCleanup = false
          return
        }
        console.log('No conflicts found, proceeding with import')
      } else {
        console.log('Overwrite mode enabled, skipping conflict check')
      }

      // Import workspaces (update userId to current user and generate new IDs)
      console.log('Starting workspace import...')
      const workspaceIdMap = new Map<string, string>()
      for (const workspace of importData.workspaces) {
        const originalId = workspace.id
        const newWorkspaceId = uuidv4() // Generate new UUID
        const newWorkspace = {
          ...workspace,
          id: newWorkspaceId,
          userId: currentUser.id,
          createdAt: new Date(workspace.createdAt),
          updatedAt: new Date()
        }
        console.log('Importing workspace:', { 
          originalName: workspace.name, 
          originalId, 
          newId: newWorkspaceId 
        })
        
        // Only check for conflicts if we're in overwrite mode (conflicts already handled above)
        if (overwrite) {
          const existingWorkspace = await db.workspaces
            .where('userId').equals(currentUser.id)
            .and(ws => ws.name === newWorkspace.name)
            .first()
          
          if (existingWorkspace) {
            console.log('Overwriting existing workspace:', existingWorkspace.name)
            // Delete existing workspace and its data
            await db.transaction('rw', [db.workspaces, db.cards, db.connections], async () => {
              // Delete all cards and connections for this workspace
              await db.cards.where('workspaceId').equals(existingWorkspace.id).delete()
              await db.connections.where('workspaceId').equals(existingWorkspace.id).delete()
              // Delete the workspace
              await db.workspaces.delete(existingWorkspace.id)
            })
          }
        }

        await db.workspaces.add(newWorkspace)
        workspaceIdMap.set(originalId, newWorkspaceId)
        console.log('Successfully added workspace to database')
      }

      // Import cards (update workspaceId to new workspace IDs and generate new IDs)
      const cardIdMap = new Map<string, string>()
      for (const card of importData.cards) {
        const originalId = card.id
        const newCardId = uuidv4() // Generate new UUID
        const newWorkspaceId = workspaceIdMap.get(card.workspaceId)
        if (!newWorkspaceId) continue // Skip cards for workspaces that weren't imported

        const newCard = {
          ...card,
          id: newCardId,
          workspaceId: newWorkspaceId,
          createdAt: new Date(card.createdAt),
          updatedAt: new Date()
        }

        await db.cards.add(newCard)
        cardIdMap.set(originalId, newCardId)
      }

      // Import connections (update workspaceId and cardIds to new IDs and generate new IDs)
      let importedConnections = 0
      for (const connection of importData.connections) {
        const newConnectionId = uuidv4() // Generate new UUID
        const newWorkspaceId = workspaceIdMap.get(connection.workspaceId)
        const newFromCardId = cardIdMap.get(connection.fromCardId)
        const newToCardId = cardIdMap.get(connection.toCardId)
        
        if (!newWorkspaceId || !newFromCardId || !newToCardId) continue // Skip connections with missing references

        const newConnection = {
          ...connection,
          id: newConnectionId,
          workspaceId: newWorkspaceId,
          fromCardId: newFromCardId,
          toCardId: newToCardId,
          createdAt: new Date(connection.createdAt)
        }

        await db.connections.add(newConnection)
        importedConnections++
      }

      setImportStatus({ 
        type: 'success', 
        message: `${overwrite ? 'Overwritten with' : 'Imported'} ${importData.workspaces.length} workspaces, ${importData.cards.length} cards, and ${importedConnections} connections` 
      })
      
      console.log('Import completed successfully')
      
      // Trigger refresh of parent components
      if (onImportComplete) {
        console.log('Calling onImportComplete callback')
        onImportComplete()
      } else {
        console.log('No onImportComplete callback provided')
      }

    } catch (error) {
      console.error('Import error:', error)
      setImportStatus({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Import failed' 
      })
    } finally {
      if (shouldCleanup) {
        console.log('Import process finished, cleaning up state')
        setIsImporting(false)
        setShowDropdown(false)
        setPendingImportFile(null)
        setShowOverwriteConfirm(false)
      } else {
        console.log('Import process paused for user confirmation, not cleaning up')
      }
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === 'application/json') {
      importData(file, false)
    } else {
      setImportStatus({ type: 'error', message: 'Please select a valid JSON file' })
    }
    // Reset the input
    event.target.value = ''
  }

  const handleOverwriteConfirm = () => {
    if (pendingImportFile) {
      setShowOverwriteConfirm(false)
      importData(pendingImportFile, true)
    }
  }

  const handleMergeConfirm = () => {
    if (pendingImportFile) {
      setShowOverwriteConfirm(false)
      importDataWithMerge(pendingImportFile)
    }
  }

  const importDataWithMerge = async (file: File) => {
    console.log('Starting merge import process')
    if (!session?.user?.email) {
      setImportStatus({ type: 'error', message: 'Please sign in to import data' })
      return
    }

    setIsImporting(true)
    
    try {
      const fileContent = await file.text()
      const importData: ExportData = JSON.parse(fileContent)
      console.log('Parsed merge import data:', { 
        workspaces: importData.workspaces?.length || 0, 
        cards: importData.cards?.length || 0, 
        connections: importData.connections?.length || 0 
      })

      // Validate import data structure
      if (!importData.version || !importData.user || !importData.workspaces || !importData.cards || !importData.connections) {
        throw new Error('Invalid export file format')
      }

      // Get current user from database
      const currentUser = await db.users.where('email').equals(session.user.email).first()
      if (!currentUser) {
        throw new Error('Current user not found in database')
      }
      console.log('Current user found for merge:', currentUser.id)

      // Import workspaces with true merging (merge content into existing workspaces)
      console.log('Starting merge workspace import...')
      const workspaceIdMap = new Map<string, string>()
      for (const workspace of importData.workspaces) {
        const originalId = workspace.id
        
        // Check if workspace with same name already exists
        const existingWorkspace = await db.workspaces
          .where('userId').equals(currentUser.id)
          .and(ws => ws.name === workspace.name)
          .first()
        
        if (existingWorkspace) {
          // Merge into existing workspace - use existing workspace ID
          console.log('Merging into existing workspace:', existingWorkspace.name)
          workspaceIdMap.set(originalId, existingWorkspace.id)
          
          // Update the existing workspace's updatedAt timestamp
          await db.workspaces.update(existingWorkspace.id, {
            updatedAt: new Date()
          })
        } else {
          // Create new workspace (no conflict)
          const newWorkspaceId = uuidv4() // Generate new UUID
          const newWorkspace = {
            ...workspace,
            id: newWorkspaceId,
            userId: currentUser.id,
            createdAt: new Date(workspace.createdAt),
            updatedAt: new Date()
          }
          
          console.log('Creating new workspace (no conflict):', { 
            originalName: workspace.name, 
            originalId, 
            newId: newWorkspaceId 
          })

          await db.workspaces.add(newWorkspace)
          workspaceIdMap.set(originalId, newWorkspaceId)
        }
        
        console.log('Successfully processed workspace for merge')
      }

      // Import cards (same as regular import)
      const cardIdMap = new Map<string, string>()
      for (const card of importData.cards) {
        const originalId = card.id
        const newCardId = uuidv4() // Generate new UUID
        const newWorkspaceId = workspaceIdMap.get(card.workspaceId)
        if (!newWorkspaceId) continue // Skip cards for workspaces that weren't imported

        const newCard = {
          ...card,
          id: newCardId,
          workspaceId: newWorkspaceId,
          createdAt: new Date(card.createdAt),
          updatedAt: new Date()
        }

        await db.cards.add(newCard)
        cardIdMap.set(originalId, newCardId)
      }

      // Import connections (same as regular import)
      let importedConnections = 0
      for (const connection of importData.connections) {
        const newConnectionId = uuidv4() // Generate new UUID
        const newWorkspaceId = workspaceIdMap.get(connection.workspaceId)
        const newFromCardId = cardIdMap.get(connection.fromCardId)
        const newToCardId = cardIdMap.get(connection.toCardId)
        
        if (!newWorkspaceId || !newFromCardId || !newToCardId) continue // Skip connections with missing references

        const newConnection = {
          ...connection,
          id: newConnectionId,
          workspaceId: newWorkspaceId,
          fromCardId: newFromCardId,
          toCardId: newToCardId,
          createdAt: new Date(connection.createdAt)
        }

        await db.connections.add(newConnection)
        importedConnections++
      }

      setImportStatus({ 
        type: 'success', 
        message: `Merged ${importData.workspaces.length} workspaces, ${importData.cards.length} cards, and ${importedConnections} connections` 
      })
      
      console.log('Merge import completed successfully')
      
      // Trigger refresh of parent components
      if (onImportComplete) {
        console.log('Calling onImportComplete callback after merge')
        onImportComplete()
      } else {
        console.log('No onImportComplete callback provided')
      }

    } catch (error) {
      console.error('Merge import error:', error)
      setImportStatus({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Merge import failed' 
      })
    } finally {
      console.log('Merge import process finished, cleaning up state')
      setIsImporting(false)
      setShowDropdown(false)
      setPendingImportFile(null)
      setShowOverwriteConfirm(false)
    }
  }

  const handleOverwriteCancel = () => {
    setShowOverwriteConfirm(false)
    setPendingImportFile(null)
    setImportStatus({ type: 'error', message: 'Import cancelled - data already exists' })
  }

  // Clear status message after 5 seconds
  useEffect(() => {
    if (importStatus.type) {
      const timer = setTimeout(() => {
        setImportStatus({ type: null, message: '' })
      }, 5000)
      
      return () => clearTimeout(timer)
    }
  }, [importStatus.type])

  return (
    <div className="relative">
      {/* Main button */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
        title="Export/Import Data"
      >
        <FileText size={16} />
        Data
      </button>

      {/* Dropdown menu */}
      {showDropdown && (
        <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-3">
            <h3 className="font-semibold text-gray-900 mb-3">Export/Import</h3>
            
            {/* Export section */}
            <div className="mb-4">
              <button
                onClick={exportAllData}
                disabled={isExporting}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download size={16} />
                {isExporting ? 'Exporting...' : 'Export All Data'}
              </button>
              <p className="text-xs text-gray-500 mt-1">
                Download all your workspaces, cards, and connections as JSON
              </p>
            </div>

            {/* Import section */}
            <div className="mb-4">
              <label className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-green-500 text-white rounded hover:bg-green-600 cursor-pointer">
                <Upload size={16} />
                {isImporting ? 'Importing...' : 'Import Data'}
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  disabled={isImporting}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Import workspaces from a Jot export file
              </p>
            </div>

            {/* Status message */}
            {importStatus.type && (
              <div className={`flex items-center gap-2 p-2 rounded text-xs ${
                importStatus.type === 'success' 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {importStatus.type === 'success' ? (
                  <CheckCircle size={14} />
                ) : (
                  <AlertCircle size={14} />
                )}
                <span>{importStatus.message}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Overwrite confirmation modal */}
      {showOverwriteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="text-yellow-500" size={24} />
              <h3 className="text-lg font-semibold text-gray-900">Import Conflict Detected</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Some workspaces in the import file have the same names as your existing workspaces. How would you like to handle this?
            </p>
            
            <div className="space-y-3 mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <h4 className="font-semibold text-blue-900 mb-1">Merge (Recommended)</h4>
                <p className="text-sm text-blue-800">
                  Add imported cards to existing workspaces with matching names. Creates new workspaces for non-conflicting ones. No data is deleted.
                </p>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                <h4 className="font-semibold text-yellow-900 mb-1">Overwrite</h4>
                <p className="text-sm text-yellow-800">
                  <strong>Warning:</strong> Replace existing workspaces with the same names. This will permanently delete the existing data.
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleOverwriteCancel}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleMergeConfirm}
                className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Merge Data
              </button>
              <button
                onClick={handleOverwriteConfirm}
                className="px-4 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600"
              >
                Overwrite
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop to close dropdown */}
      {showDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  )
}
