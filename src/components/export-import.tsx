'use client'

import { useState } from 'react'
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
    if (!session?.user?.email) {
      setImportStatus({ type: 'error', message: 'Please sign in to import data' })
      return
    }

    setIsImporting(true)
    try {
      const fileContent = await file.text()
      const importData: ExportData = JSON.parse(fileContent)

      // Validate import data structure
      if (!importData.version || !importData.user || !importData.workspaces || !importData.cards || !importData.connections) {
        throw new Error('Invalid export file format')
      }

      // Get current user from database
      const currentUser = await db.users.where('email').equals(session.user.email).first()
      if (!currentUser) {
        throw new Error('Current user not found in database')
      }

      // Check for conflicts first
      let hasConflicts = false
      if (!overwrite) {
        for (const workspace of importData.workspaces) {
          const existingWorkspace = await db.workspaces
            .where('userId').equals(currentUser.id)
            .and(ws => ws.name === workspace.name)
            .first()
          
          if (existingWorkspace) {
            hasConflicts = true
            break
          }
        }

        if (hasConflicts) {
          // Show overwrite confirmation
          setIsImporting(false)
          setPendingImportFile(file)
          setShowOverwriteConfirm(true)
          setShowDropdown(false)
          return
        }
      }

      // Import workspaces (update userId to current user and generate new IDs)
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
        
        // Check if workspace with same name already exists
        const existingWorkspace = await db.workspaces
          .where('userId').equals(currentUser.id)
          .and(ws => ws.name === newWorkspace.name)
          .first()
        
        if (existingWorkspace && overwrite) {
          // Delete existing workspace and its data
          await db.transaction('rw', [db.workspaces, db.cards, db.connections], async () => {
            // Delete all cards and connections for this workspace
            await db.cards.where('workspaceId').equals(existingWorkspace.id).delete()
            await db.connections.where('workspaceId').equals(existingWorkspace.id).delete()
            // Delete the workspace
            await db.workspaces.delete(existingWorkspace.id)
          })
        } else if (existingWorkspace && !overwrite) {
          // Update name to avoid conflicts
          newWorkspace.name = `${newWorkspace.name} (Imported ${new Date().toLocaleDateString()})`
        }

        await db.workspaces.add(newWorkspace)
        workspaceIdMap.set(originalId, newWorkspaceId)
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
      
      // Trigger refresh of parent components
      if (onImportComplete) {
        onImportComplete()
      }

    } catch (error) {
      console.error('Import error:', error)
      setImportStatus({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Import failed' 
      })
    } finally {
      setIsImporting(false)
      setShowDropdown(false)
      setPendingImportFile(null)
      setShowOverwriteConfirm(false)
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

  const handleOverwriteCancel = () => {
    setShowOverwriteConfirm(false)
    setPendingImportFile(null)
    setImportStatus({ type: 'error', message: 'Import cancelled - data already exists' })
  }

  // Clear status message after 5 seconds
  if (importStatus.type) {
    setTimeout(() => {
      setImportStatus({ type: null, message: '' })
    }, 5000)
  }

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
              <h3 className="text-lg font-semibold text-gray-900">Data Already Exists</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Some data in the import file already exists in your workspace. Would you like to overwrite the existing data?
            </p>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-6">
              <p className="text-sm text-yellow-800">
                <strong>Warning:</strong> Overwriting will permanently delete existing workspaces, cards, and connections with the same names/IDs and replace them with the imported data.
              </p>
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleOverwriteCancel}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleOverwriteConfirm}
                className="px-4 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600"
              >
                Overwrite Data
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
