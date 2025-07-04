'use client'

import { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, useSensor, useSensors, PointerSensor, rectIntersection } from '@dnd-kit/core'
import { Card as CardType, Connection, db } from '@/lib/db'
import Card from './card'
import { Plus, ArrowRight, Minus, Grid3X3, RotateCcw, Undo, Redo, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'

// Undo action types
type UndoAction = 
  | { type: 'CREATE_CARD', cardId: string }
  | { type: 'DELETE_CARD', card: CardType, connections: Connection[] }
  | { type: 'UPDATE_CARD', oldCard: CardType, newCard: CardType }
  | { type: 'MOVE_CARD', cardId: string, oldPosition: { x: number, y: number }, newPosition: { x: number, y: number } }
  | { type: 'CREATE_CONNECTION', connectionId: string }
  | { type: 'DELETE_CONNECTION', connection: Connection }

interface WorkspaceCanvasProps {
  workspaceId: string
}

// Interface for imperative handle
export interface WorkspaceCanvasHandle {
  resetView: () => void
  focusOnCard: (cardId: string) => void
}

const WorkspaceCanvas = forwardRef<WorkspaceCanvasHandle, WorkspaceCanvasProps>(({ workspaceId }, ref) => {
  const [cards, setCards] = useState<CardType[]>([])
  const [connections, setConnections] = useState<Connection[]>([])
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [draggedCard, setDraggedCard] = useState<CardType | null>(null)
  const [connectingMode, setConnectingMode] = useState(false)
  const [firstConnectionCard, setFirstConnectionCard] = useState<string | null>(null)
  const [undoStack, setUndoStack] = useState<UndoAction[]>([])
  const [redoStack, setRedoStack] = useState<UndoAction[]>([])
  const [lastSelectionTime, setLastSelectionTime] = useState(0)
  const [mouseDownTime, setMouseDownTime] = useState(0)
  const [mouseDownPosition, setMouseDownPosition] = useState({ x: 0, y: 0 })
  const [isTextSelectionActive, setIsTextSelectionActive] = useState(false)
  const [lastCardInteractionTime, setLastCardInteractionTime] = useState(0)
  const [gridType, setGridType] = useState<'off' | 'dots' | 'lines'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('jot-grid-type')
      return (saved as 'off' | 'dots' | 'lines') || 'dots'
    }
    return 'dots'
  })
  const [snapToGrid, setSnapToGrid] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('jot-snap-to-grid')
      return saved ? saved === 'true' : false
    }
    return false
  })

  // Workspace panning state
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [panOffset, setPanOffset] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('jot-pan-offset')
      return saved ? JSON.parse(saved) : { x: 0, y: 0 }
    }
    return { x: 0, y: 0 }
  })

  // Zoom state
  const [zoomLevel, setZoomLevel] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('jot-zoom-level')
      return saved ? parseFloat(saved) : 1.0
    }
    return 1.0
  })

  // Zoom constraints
  const MIN_ZOOM = 0.1
  const MAX_ZOOM = 3.0
  const ZOOM_STEP = 0.1

  // Grid settings
  const gridSize = 20 // 20px grid

  // Zoom functions
  const zoomIn = useCallback(() => {
    if (typeof window === 'undefined') return
    
    // Get the center of the viewport as zoom center
    const viewportCenterX = window.innerWidth / 2
    const viewportCenterY = (window.innerHeight - 80) / 2 // Account for toolbar height
    
    const newZoom = Math.min(MAX_ZOOM, zoomLevel + ZOOM_STEP)
    
    if (newZoom !== zoomLevel) {
      // Calculate the zoom center in world coordinates
      const worldX = (viewportCenterX - panOffset.x) / zoomLevel
      const worldY = (viewportCenterY - panOffset.y) / zoomLevel
      
      // Calculate new pan offset to maintain zoom center
      const newPanX = viewportCenterX - worldX * newZoom
      const newPanY = viewportCenterY - worldY * newZoom
      
      setZoomLevel(newZoom)
      setPanOffset({ x: newPanX, y: newPanY })
    }
  }, [zoomLevel, panOffset, MAX_ZOOM, ZOOM_STEP])

  const zoomOut = useCallback(() => {
    if (typeof window === 'undefined') return
    
    // Get the center of the viewport as zoom center
    const viewportCenterX = window.innerWidth / 2
    const viewportCenterY = (window.innerHeight - 80) / 2 // Account for toolbar height
    
    const newZoom = Math.max(MIN_ZOOM, zoomLevel - ZOOM_STEP)
    
    if (newZoom !== zoomLevel) {
      // Calculate the zoom center in world coordinates
      const worldX = (viewportCenterX - panOffset.x) / zoomLevel
      const worldY = (viewportCenterY - panOffset.y) / zoomLevel
      
      // Calculate new pan offset to maintain zoom center
      const newPanX = viewportCenterX - worldX * newZoom
      const newPanY = viewportCenterY - worldY * newZoom
      
      setZoomLevel(newZoom)
      setPanOffset({ x: newPanX, y: newPanY })
    }
  }, [zoomLevel, panOffset, MIN_ZOOM, ZOOM_STEP])

  const resetZoom = useCallback(() => {
    if (typeof window === 'undefined') return
    
    // Get the center of the viewport as zoom center
    const viewportCenterX = window.innerWidth / 2
    const viewportCenterY = (window.innerHeight - 80) / 2 // Account for toolbar height
    
    const newZoom = 1.0
    
    if (newZoom !== zoomLevel) {
      // Calculate the zoom center in world coordinates
      const worldX = (viewportCenterX - panOffset.x) / zoomLevel
      const worldY = (viewportCenterY - panOffset.y) / zoomLevel
      
      // Calculate new pan offset to maintain zoom center
      const newPanX = viewportCenterX - worldX * newZoom
      const newPanY = viewportCenterY - worldY * newZoom
      
      setZoomLevel(newZoom)
      setPanOffset({ x: newPanX, y: newPanY })
    }
  }, [zoomLevel, panOffset])

  const handleZoomGesture = useCallback((e: WheelEvent, zoomCenter: { x: number, y: number }) => {
    e.preventDefault()
    
    const zoomDelta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomLevel + zoomDelta))
    
    if (newZoom !== zoomLevel) {
      // Calculate the zoom center in world coordinates
      const worldX = (zoomCenter.x - panOffset.x) / zoomLevel
      const worldY = (zoomCenter.y - panOffset.y) / zoomLevel
      
      // Calculate new pan offset to maintain zoom center
      const newPanX = zoomCenter.x - worldX * newZoom
      const newPanY = zoomCenter.y - worldY * newZoom
      
      setZoomLevel(newZoom)
      setPanOffset({ x: newPanX, y: newPanY })
    }
  }, [zoomLevel, panOffset, MIN_ZOOM, MAX_ZOOM, ZOOM_STEP])

  // RESET function - ALWAYS positions to Page 1,1 (top-left cards at 1 grid box margin) and resets zoom
  const resetViewToShowContent = useCallback(() => {
    const gridMargin = gridSize * 1 // 20px
    
    if (cards.length === 0) {
      // No cards, just reset to Page 1,1 position and reset zoom
      setPanOffset({ x: gridMargin, y: gridMargin })
      setZoomLevel(1.0)
      return
    }

    // Find the absolute top-left cards (Page 1,1)
    const minX = Math.min(...cards.map(card => card.x))
    const minY = Math.min(...cards.map(card => card.y))
    
    // Debug logging
    console.log('🔍 RESET DEBUG:')
    console.log('  gridMargin:', gridMargin)
    console.log('  minX (leftmost card x):', minX)
    console.log('  minY (topmost card y):', minY)
    console.log('  Required panOffset.x:', gridMargin - minX)
    console.log('  Required panOffset.y:', gridMargin - minY)
    
    // To position the leftmost card at gridMargin (20px) from the left edge:
    // We need: minX + panOffset.x = gridMargin
    // Therefore: panOffset.x = gridMargin - minX
    const newPanOffset = {
      x: gridMargin - minX,
      y: gridMargin - minY
    }

    setPanOffset(newPanOffset)
    setZoomLevel(1.0) // Reset zoom to 100%
    
    // Verify positioning after a brief delay
    setTimeout(() => {
      console.log('🔍 POST-RESET DEBUG:')
      console.log('  panOffset after reset:', newPanOffset)
      console.log('  zoomLevel after reset: 100%')
      console.log('  Expected leftmost card screen position: minX + panOffset.x =', minX + newPanOffset.x)
      console.log('  Should equal gridMargin (20px):', gridMargin)
    }, 100)
  }, [cards, gridSize])

  // Focus on a specific card by moving the viewport to center it
  const focusOnCard = useCallback((cardId: string) => {
    const card = cards.find(c => c.id === cardId)
    if (!card || typeof window === 'undefined') return

    // Calculate viewport dimensions
    const toolbarHeight = 80
    const sidebarWidth = 256 // w-64 = 256px
    const viewportWidth = window.innerWidth - sidebarWidth
    const viewportHeight = window.innerHeight - toolbarHeight

    // Calculate center position for the card
    const cardCenterX = card.x + card.width / 2
    const cardCenterY = card.y + card.height / 2

    // Calculate the pan offset to center the card in the viewport
    const newPanX = (viewportWidth / 2) - (cardCenterX * zoomLevel)
    const newPanY = (viewportHeight / 2) - (cardCenterY * zoomLevel)

    setPanOffset({ x: newPanX, y: newPanY })
    
    // Also select the card to highlight it
    setSelectedCardId(cardId)
    
    console.log('Focused on card:', cardId, 'at position:', { x: card.x, y: card.y })
  }, [cards, zoomLevel])

  // Expose reset function to parent component
  useImperativeHandle(ref, () => ({
    resetView: resetViewToShowContent,
    focusOnCard: focusOnCard
  }), [resetViewToShowContent, focusOnCard])

  // Paging state
  const [pageIndicators, setPageIndicators] = useState<{
    left: boolean
    right: boolean
    up: boolean
    down: boolean
  }>({ left: false, right: false, up: false, down: false })

  // Persist pan offset to localStorage
  useEffect(() => {
    localStorage.setItem('jot-pan-offset', JSON.stringify(panOffset))
  }, [panOffset])

  // Persist zoom level to localStorage
  useEffect(() => {
    localStorage.setItem('jot-zoom-level', zoomLevel.toString())
  }, [zoomLevel])

  // Save grid settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('jot-grid-type', gridType)
  }, [gridType])

  useEffect(() => {
    localStorage.setItem('jot-snap-to-grid', snapToGrid.toString())
  }, [snapToGrid])

  // Track text selection events globally to prevent forced saves during selection
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection()
      const hasSelection = selection && !selection.isCollapsed
      setIsTextSelectionActive(hasSelection || false)
      
      if (hasSelection || (selection && selection.toString().trim().length > 0)) {
        setLastSelectionTime(Date.now())
        console.log('Selection detected, updating lastSelectionTime')
      }
    }

    const handleMouseUp = () => {
      // Always update selection time on mouse up, in case selection changed
      const selection = window.getSelection()
      if (selection && !selection.isCollapsed) {
        setLastSelectionTime(Date.now())
        setIsTextSelectionActive(true)
        console.log('Mouse up with selection, updating lastSelectionTime')
      } else {
        // Clear selection state after a delay
        setTimeout(() => setIsTextSelectionActive(false), 100)
      }
    }

    const handleMouseDown = () => {
      // Reset selection state on mouse down
      setIsTextSelectionActive(false)
    }

    document.addEventListener('selectionchange', handleSelectionChange)
    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('mousedown', handleMouseDown)
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange)
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('mousedown', handleMouseDown)
    }
  }, [])

  // Simple rule: if ANY card is outside viewport, show directional indicator
  useEffect(() => {
    if (typeof window === 'undefined' || cards.length === 0) {
      setPageIndicators({ left: false, right: false, up: false, down: false })
      return
    }

    // Account for the toolbar height and sidebar width
    const toolbarHeight = 80
    const sidebarWidth = 256 // w-64 = 256px
    const canvasWidth = window.innerWidth - sidebarWidth
    const canvasHeight = window.innerHeight - toolbarHeight

    const viewportLeft = -panOffset.x / zoomLevel
    const viewportRight = (-panOffset.x + canvasWidth) / zoomLevel
    const viewportTop = -panOffset.y / zoomLevel
    const viewportBottom = (-panOffset.y + canvasHeight) / zoomLevel

    let hasLeft = false
    let hasRight = false
    let hasUp = false
    let hasDown = false

    cards.forEach(card => {
      // Card is off-screen left if its right edge is left of viewport
      if (card.x + card.width < viewportLeft) hasLeft = true
      // Card is off-screen right if its left edge is right of viewport
      if (card.x > viewportRight) hasRight = true
      // Card is off-screen up if its bottom edge is above viewport
      if (card.y + card.height < viewportTop) hasUp = true
      // Card is off-screen down if its top edge is below viewport
      if (card.y > viewportBottom) hasDown = true
    })

    setPageIndicators({ left: hasLeft, right: hasRight, up: hasUp, down: hasDown })
  }, [cards, panOffset, zoomLevel])

  // Also recalculate on window resize
  useEffect(() => {
    const handleResize = () => {
      if (typeof window === 'undefined' || cards.length === 0) {
        setPageIndicators({ left: false, right: false, up: false, down: false })
        return
      }

      // Account for the toolbar height and sidebar width
      const toolbarHeight = 80
      const sidebarWidth = 256 // w-64 = 256px
      const canvasWidth = window.innerWidth - sidebarWidth
      const canvasHeight = window.innerHeight - toolbarHeight

      const viewportLeft = -panOffset.x
      const viewportRight = -panOffset.x + canvasWidth
      const viewportTop = -panOffset.y
      const viewportBottom = -panOffset.y + canvasHeight

      let hasLeft = false
      let hasRight = false
      let hasUp = false
      let hasDown = false

      cards.forEach(card => {
        // Card is off-screen left if its right edge is left of viewport
        if (card.x + card.width < viewportLeft) hasLeft = true
        // Card is off-screen right if its left edge is right of viewport
        if (card.x > viewportRight) hasRight = true
        // Card is off-screen up if its bottom edge is above viewport
        if (card.y + card.height < viewportTop) hasUp = true
        // Card is off-screen down if its top edge is below viewport
        if (card.y > viewportBottom) hasDown = true
      })

      setPageIndicators({ left: hasLeft, right: hasRight, up: hasUp, down: hasDown })
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [cards, panOffset, zoomLevel])

  // Helper function to add action to undo stack
  const addToUndoStack = (action: UndoAction) => {
    setUndoStack(prev => [...prev, action].slice(-50)) // Keep last 50 actions
    // Clear redo stack when a new action is performed
    setRedoStack([])
  }

  // Undo function
  const performUndo = async () => {
    if (undoStack.length === 0) return

    const lastAction = undoStack[undoStack.length - 1]
    setUndoStack(prev => prev.slice(0, -1))
    
    // Add the action to redo stack before undoing
    setRedoStack(prev => [...prev, lastAction].slice(-50))

    try {
      switch (lastAction.type) {
        case 'CREATE_CARD':
          // Undo card creation by deleting the card
          await db.cards.delete(lastAction.cardId)
          setCards(prev => prev.filter(card => card.id !== lastAction.cardId))
          if (selectedCardId === lastAction.cardId) {
            setSelectedCardId(null)
          }
          break

        case 'DELETE_CARD':
          // Undo card deletion by recreating the card and its connections
          await db.cards.add(lastAction.card)
          setCards(prev => [...prev, lastAction.card])
          
          // Restore connections
          for (const connection of lastAction.connections) {
            await db.connections.add(connection)
          }
          setConnections(prev => [...prev, ...lastAction.connections])
          break

        case 'UPDATE_CARD':
          // Undo card update by restoring old card data
          await db.cards.update(lastAction.oldCard.id, lastAction.oldCard)
          setCards(prev => prev.map(card => 
            card.id === lastAction.oldCard.id ? lastAction.oldCard : card
          ))
          break

        case 'MOVE_CARD':
          // Undo card move by restoring old position
          const cardToMove = cards.find(c => c.id === lastAction.cardId)
          if (cardToMove) {
            const restoredCard = {
              ...cardToMove,
              x: lastAction.oldPosition.x,
              y: lastAction.oldPosition.y,
              updatedAt: new Date()
            }
            await db.cards.update(lastAction.cardId, restoredCard)
            setCards(prev => prev.map(card => 
              card.id === lastAction.cardId ? restoredCard : card
            ))
          }
          break

        case 'CREATE_CONNECTION':
          // Undo connection creation by deleting the connection
          await db.connections.delete(lastAction.connectionId)
          setConnections(prev => prev.filter(conn => conn.id !== lastAction.connectionId))
          break

        case 'DELETE_CONNECTION':
          // Undo connection deletion by recreating the connection
          await db.connections.add(lastAction.connection)
          setConnections(prev => [...prev, lastAction.connection])
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
    setUndoStack(prev => [...prev, lastRedoAction].slice(-50))

    try {
      switch (lastRedoAction.type) {
        case 'CREATE_CARD':
          // Redo card creation by recreating the card
          const cardToRecreate = await db.cards.get(lastRedoAction.cardId)
          if (cardToRecreate) {
            setCards(prev => [...prev, cardToRecreate])
          }
          break

        case 'DELETE_CARD':
          // Redo card deletion by deleting the card again
          await db.cards.delete(lastRedoAction.card.id)
          
          // Also delete connections involving this card
          for (const conn of lastRedoAction.connections) {
            await db.connections.delete(conn.id)
          }
          
          setCards(prev => prev.filter(card => card.id !== lastRedoAction.card.id))
          setConnections(prev => prev.filter(
            conn => conn.fromCardId !== lastRedoAction.card.id && conn.toCardId !== lastRedoAction.card.id
          ))
          
          if (selectedCardId === lastRedoAction.card.id) {
            setSelectedCardId(null)
          }
          break

        case 'UPDATE_CARD':
          // Redo card update by applying the new card data
          await db.cards.update(lastRedoAction.newCard.id, lastRedoAction.newCard)
          setCards(prev => prev.map(card => 
            card.id === lastRedoAction.newCard.id ? lastRedoAction.newCard : card
          ))
          break

        case 'MOVE_CARD':
          // Redo card move by restoring new position
          const cardToRedo = cards.find(c => c.id === lastRedoAction.cardId)
          if (cardToRedo) {
            const redoCard = {
              ...cardToRedo,
              x: lastRedoAction.newPosition.x,
              y: lastRedoAction.newPosition.y,
              updatedAt: new Date()
            }
            await db.cards.update(lastRedoAction.cardId, redoCard)
            setCards(prev => prev.map(card => 
              card.id === lastRedoAction.cardId ? redoCard : card
            ))
          }
          break

        case 'CREATE_CONNECTION':
          // Redo connection creation by recreating the connection
          const connectionToRecreate = await db.connections.get(lastRedoAction.connectionId)
          if (connectionToRecreate) {
            setConnections(prev => [...prev, connectionToRecreate])
          }
          break

        case 'DELETE_CONNECTION':
          // Redo connection deletion by deleting the connection again
          await db.connections.delete(lastRedoAction.connection.id)
          setConnections(prev => prev.filter(conn => conn.id !== lastRedoAction.connection.id))
          break
      }
    } catch (error) {
      console.error('Error performing redo:', error)
      // Remove from undo stack and re-add to redo stack if redo failed
      setUndoStack(prev => prev.slice(0, -1))
      setRedoStack(prev => [...prev, lastRedoAction])
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const loadCards = useCallback(async () => {
    try {
      const workspaceCards = await db.cards.where('workspaceId').equals(workspaceId).toArray()
      setCards(workspaceCards)
    } catch (error) {
      console.error('Error loading cards:', error)
    }
  }, [workspaceId])

  const loadConnections = useCallback(async () => {
    try {
      const workspaceConnections = await db.connections.where('workspaceId').equals(workspaceId).toArray()
      setConnections(workspaceConnections)
    } catch (error) {
      console.error('Error loading connections:', error)
    }
  }, [workspaceId])

  useEffect(() => {
    loadCards()
    loadConnections()
  }, [loadCards, loadConnections])

  // Snap coordinates to grid
  const snapToGridCoordinates = (x: number, y: number) => {
    if (!snapToGrid) return { x, y }
    
    return {
      x: Math.round(x / gridSize) * gridSize,
      y: Math.round(y / gridSize) * gridSize
    }
  }

  const createCard = async (x?: number, y?: number) => {
    let cardX: number = x ?? 0
    let cardY: number = y ?? 0
    
    // If no specific position provided, place new card in upper left of current viewport
    if (x === undefined || y === undefined) {
      const gridMargin = gridSize * 1 // 20px margin
      
      // Always place new cards at top-left of current viewport with margin
      // Convert viewport position to world coordinates
      cardX = -panOffset.x + gridMargin
      cardY = -panOffset.y + gridMargin
      
      console.log('🎯 NEW CARD POSITIONING:')
      console.log('  panOffset:', panOffset)
      console.log('  viewport top-left in world coords:', { x: -panOffset.x, y: -panOffset.y })
      console.log('  card position with margin:', { x: cardX, y: cardY })
    }
    
    // Apply snap to grid if enabled
    const snappedCoords = snapToGridCoordinates(cardX, cardY)
    cardX = snappedCoords.x
    cardY = snappedCoords.y
    
    // Smart collision detection - only cascade if there's direct overlap
    const newCardBounds = {
      left: cardX,
      right: cardX + 450, // default card width - increased for better editor space
      top: cardY,
      bottom: cardY + 350 // default card height - increased for full editor visibility
    }
    
    // Check for direct overlap with existing cards
    const hasOverlap = cards.some(existingCard => {
      const existingBounds = {
        left: existingCard.x,
        right: existingCard.x + existingCard.width,
        top: existingCard.y,
        bottom: existingCard.y + existingCard.height
      }
      
      // Check if rectangles overlap
      const overlaps = !(
        newCardBounds.right <= existingBounds.left ||   // new card is to the left
        newCardBounds.left >= existingBounds.right ||   // new card is to the right
        newCardBounds.bottom <= existingBounds.top ||   // new card is above
        newCardBounds.top >= existingBounds.bottom      // new card is below
      )
      
      return overlaps
    })
    
    // If there's overlap, cascade to find a free position
    if (hasOverlap) {
      console.log('🔄 COLLISION DETECTED - Finding free position...')
      
      const cascadeOffset = gridSize * 2 // 40px cascade offset
      let attempts = 0
      const maxAttempts = 20
      
      while (attempts < maxAttempts) {
        // Try positions in a spiral pattern
        const spiralOffsets = [
          { x: cascadeOffset, y: cascadeOffset },
          { x: cascadeOffset * 2, y: cascadeOffset },
          { x: cascadeOffset, y: cascadeOffset * 2 },
          { x: cascadeOffset * 2, y: cascadeOffset * 2 },
          { x: cascadeOffset * 3, y: cascadeOffset },
          { x: cascadeOffset, y: cascadeOffset * 3 },
          { x: cascadeOffset * 3, y: cascadeOffset * 3 },
        ]
        
        for (const offset of spiralOffsets) {
          const testX: number = cardX + offset.x
          const testY: number = cardY + offset.y
          
          const testBounds = {
            left: testX,
            right: testX + 450,
            top: testY,
            bottom: testY + 350
          }
          
          // Check if this position overlaps with any existing card
          const testOverlaps = cards.some(existingCard => {
            const existingBounds = {
              left: existingCard.x,
              right: existingCard.x + existingCard.width,
              top: existingCard.y,
              bottom: existingCard.y + existingCard.height
            }
            
            return !(
              testBounds.right <= existingBounds.left ||
              testBounds.left >= existingBounds.right ||
              testBounds.bottom <= existingBounds.top ||
              testBounds.top >= existingBounds.bottom
            )
          })
          
          if (!testOverlaps) {
            cardX = testX
            cardY = testY
            console.log('✅ Found free position:', { x: cardX, y: cardY })
            break
          }
        }
        
        attempts++
        if (!cards.some(existingCard => {
          const existingBounds = {
            left: existingCard.x,
            right: existingCard.x + existingCard.width,
            top: existingCard.y,
            bottom: existingCard.y + existingCard.height
          }
          
          const currentBounds = {
            left: cardX,
            right: cardX + 450,
            top: cardY,
            bottom: cardY + 350
          }
          
          return !(
            currentBounds.right <= existingBounds.left ||
            currentBounds.left >= existingBounds.right ||
            currentBounds.bottom <= existingBounds.top ||
            currentBounds.top >= existingBounds.bottom
          )
        })) {
          break // Found a free position
        }
      }
      
      if (attempts >= maxAttempts) {
        console.log('⚠️ Could not find free position after', maxAttempts, 'attempts')
      }
    } else {
      console.log('✅ No collision detected - placing at original position')
    }
    
    const newCard: CardType = {
      id: uuidv4(),
      workspaceId,
      title: 'New Card',
      content: '',
      x: cardX,
      y: cardY,
      width: 450,
      height: 350,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    try {
      await db.cards.add(newCard)
      setCards(prev => [...prev, newCard])
      setSelectedCardId(newCard.id)
      
      // Add to undo stack
      addToUndoStack({ type: 'CREATE_CARD', cardId: newCard.id })
    } catch (error) {
      console.error('Error creating card:', error)
    }
  }

  const updateCard = async (updatedCard: CardType) => {
    // Get the old card for undo
    const oldCard = cards.find(c => c.id === updatedCard.id)
    
    try {
      await db.cards.update(updatedCard.id, updatedCard)
      setCards(prev => prev.map(card => card.id === updatedCard.id ? updatedCard : card))
      
      // Add to undo stack if we have the old card and it's different
      if (oldCard && (oldCard.title !== updatedCard.title || oldCard.content !== updatedCard.content)) {
        addToUndoStack({ type: 'UPDATE_CARD', oldCard, newCard: updatedCard })
      }
    } catch (error) {
      console.error('Error updating card:', error)
    }
  }

  const updateCardInDatabase = async (updatedCard: CardType) => {
    try {
      await db.cards.update(updatedCard.id, updatedCard)
    } catch (error) {
      console.error('Error updating card in database:', error)
      // On error, revert the optimistic update
      loadCards()
    }
  }

  const deleteCard = async (cardId: string) => {
    const cardToDelete = cards.find(c => c.id === cardId)
    if (!cardToDelete) return
    
    try {
      // Get connections that will be deleted
      const cardConnections = connections.filter(
        conn => conn.fromCardId === cardId || conn.toCardId === cardId
      )
      
      await db.cards.delete(cardId)
      // Also delete connections involving this card
      for (const conn of cardConnections) {
        await db.connections.delete(conn.id)
      }
      
      setCards(prev => prev.filter(card => card.id !== cardId))
      setConnections(prev => prev.filter(
        conn => conn.fromCardId !== cardId && conn.toCardId !== cardId
      ))
      
      if (selectedCardId === cardId) {
        setSelectedCardId(null)
      }
      
      // Add to undo stack
      addToUndoStack({ 
        type: 'DELETE_CARD', 
        card: cardToDelete, 
        connections: cardConnections 
      })
    } catch (error) {
      console.error('Error deleting card:', error)
    }
  }

  const createConnection = async (fromCardId: string, toCardId: string) => {
    if (fromCardId === toCardId) return

    // Check if connection already exists
    const existingConnection = connections.find(
      conn => 
        (conn.fromCardId === fromCardId && conn.toCardId === toCardId) ||
        (conn.fromCardId === toCardId && conn.toCardId === fromCardId)
    )
    
    if (existingConnection) return

    const newConnection: Connection = {
      id: uuidv4(),
      workspaceId,
      fromCardId,
      toCardId,
      type: 'arrow',
      createdAt: new Date(),
    }

    try {
      await db.connections.add(newConnection)
      setConnections(prev => [...prev, newConnection])
      
      // Add to undo stack
      addToUndoStack({ type: 'CREATE_CONNECTION', connectionId: newConnection.id })
    } catch (error) {
      console.error('Error creating connection:', error)
    }
  }

  const deleteConnection = async (connectionId: string) => {
    const connectionToDelete = connections.find(c => c.id === connectionId)
    if (!connectionToDelete) return
    
    try {
      await db.connections.delete(connectionId)
      setConnections(prev => prev.filter(conn => conn.id !== connectionId))
      
      // Add to undo stack
      addToUndoStack({ type: 'DELETE_CONNECTION', connection: connectionToDelete })
    } catch (error) {
      console.error('Error deleting connection:', error)
    }
  }

  const handleDragCancel = () => {
    setDraggedCard(null)
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const card = cards.find(c => c.id === active.id)
    if (card) {
      setDraggedCard(card)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event
    setDraggedCard(null)

    // Always clear the drag state, even if there's no delta
    if (!delta || !active) return

    const card = cards.find(c => c.id === active.id)
    if (!card) return

    // Store old position for undo
    const oldPosition = { x: card.x, y: card.y }

    // Calculate new position and ensure it stays within reasonable bounds
    let newX = card.x + delta.x
    let newY = card.y + delta.y

    // Calculate the current viewport bounds relative to the panned canvas
    const viewportLeft = -panOffset.x
    const viewportTop = -panOffset.y
    const viewportRight = viewportLeft + window.innerWidth
    const viewportBottom = viewportTop + window.innerHeight

    // Allow cards to be positioned within a much larger area around the current viewport
    // This gives users freedom to organize cards in a large workspace
    const bufferSize = 2000 // 2000px buffer around viewport
    const minX = viewportLeft - bufferSize
    const minY = viewportTop - bufferSize
    const maxX = viewportRight + bufferSize
    const maxY = viewportBottom + bufferSize

    // Apply the constraints
    newX = Math.max(minX, Math.min(maxX, newX))
    newY = Math.max(minY, Math.min(maxY, newY))

    // Apply snap to grid if enabled
    const snappedCoords = snapToGridCoordinates(newX, newY)
    newX = snappedCoords.x
    newY = snappedCoords.y

    const updatedCard = {
      ...card,
      x: newX,
      y: newY,
      updatedAt: new Date(),
    }

    // Optimistic update: Update UI immediately to prevent snap-back
    setCards(prev => prev.map(c => c.id === updatedCard.id ? updatedCard : c))
    
    // Then update database in background
    updateCardInDatabase(updatedCard)

    // Add to undo stack if position actually changed
    if (oldPosition.x !== newX || oldPosition.y !== newY) {
      addToUndoStack({ 
        type: 'MOVE_CARD', 
        cardId: card.id, 
        oldPosition, 
        newPosition: { x: newX, y: newY } 
      })
    }
  }

  // Paging navigation functions
  const navigateToDirection = (direction: 'left' | 'right' | 'up' | 'down') => {
    if (typeof window === 'undefined' || cards.length === 0) return

    // Account for the toolbar height and sidebar width
    const toolbarHeight = 80
    const sidebarWidth = 256 // w-64 = 256px
    const viewportWidth = window.innerWidth - sidebarWidth
    const viewportHeight = window.innerHeight - toolbarHeight
    const gridMargin = gridSize * 1 // 1 grid box margin

    // Current viewport bounds in world coordinates (accounting for zoom)
    const viewportLeft = -panOffset.x / zoomLevel
    const viewportRight = (-panOffset.x + viewportWidth) / zoomLevel
    const viewportTop = -panOffset.y / zoomLevel
    const viewportBottom = (-panOffset.y + viewportHeight) / zoomLevel

    // Find cards in the specified direction
    const targetCards: CardType[] = []

    cards.forEach(card => {
      const cardLeft = card.x
      const cardRight = card.x + card.width
      const cardTop = card.y
      const cardBottom = card.y + card.height

      switch (direction) {
        case 'left':
          if (cardRight < viewportLeft) targetCards.push(card)
          break
        case 'right':
          if (cardLeft > viewportRight) targetCards.push(card)
          break
        case 'up':
          if (cardBottom < viewportTop) targetCards.push(card)
          break
        case 'down':
          if (cardTop > viewportBottom) targetCards.push(card)
          break
      }
    })

    if (targetCards.length === 0) return

    // Check if we're navigating to the primary/topmost cards - use reset logic
    const allMinX = Math.min(...cards.map(card => card.x))
    const allMinY = Math.min(...cards.map(card => card.y))
    const targetMinX = Math.min(...targetCards.map(card => card.x))
    const targetMinY = Math.min(...targetCards.map(card => card.y))

    // If we're navigating to cards that include the absolute topmost/leftmost cards, use reset logic
    if ((direction === 'up' && targetMinY === allMinY) || 
        (direction === 'left' && targetMinX === allMinX)) {
      // Use reset logic - show all cards with optimal positioning
      console.log('🔍 NAVIGATION TO PRIMARY CARDS - Using reset logic')
      console.log('  direction:', direction)
      console.log('  allMinX:', allMinX, 'targetMinX:', targetMinX)
      console.log('  allMinY:', allMinY, 'targetMinY:', targetMinY)
      console.log('  gridMargin:', gridMargin)
      console.log('  Setting panOffset to:', { x: gridMargin - allMinX, y: gridMargin - allMinY })
      
      const newPanOffset = {
        x: gridMargin - allMinX,
        y: gridMargin - allMinY
      }
      setPanOffset(newPanOffset)
      return
    }

    // Otherwise, find the closest group of cards in that direction
    let closestCards: CardType[] = []

    if (direction === 'left' || direction === 'right') {
      // Find cards closest to the viewport in the x-direction
      const distances = targetCards.map(card => {
        if (direction === 'left') {
          return viewportLeft - (card.x + card.width) // distance from viewport left to card right
        } else {
          return card.x - viewportRight // distance from viewport right to card left
        }
      })
      const minDistance = Math.min(...distances.filter(d => d >= 0))
      
      // Filter to cards at this closest distance (with some tolerance)
      closestCards = targetCards.filter((card, index) => {
        const distance = distances[index]
        return distance >= 0 && distance <= minDistance + 50 // 50px tolerance
      })
    } else {
      // Find cards closest to the viewport in the y-direction
      const distances = targetCards.map(card => {
        if (direction === 'up') {
          return viewportTop - (card.y + card.height) // distance from viewport top to card bottom
        } else {
          return card.y - viewportBottom // distance from viewport bottom to card top
        }
      })
      const minDistance = Math.min(...distances.filter(d => d >= 0))
      
      // Filter to cards at this closest distance (with some tolerance)
      closestCards = targetCards.filter((card, index) => {
        const distance = distances[index]
        return distance >= 0 && distance <= minDistance + 50 // 50px tolerance
      })
    }

    // Get the leftmost and topmost positions of the closest cards group
    const closestMinX = Math.min(...closestCards.map(card => card.x))
    const closestMinY = Math.min(...closestCards.map(card => card.y))

    console.log('🔍 NAVIGATION TO CLOSEST CARDS')
    console.log('  direction:', direction)
    console.log('  closestCards count:', closestCards.length)
    console.log('  closestMinX:', closestMinX)
    console.log('  closestMinY:', closestMinY)
    console.log('  gridMargin:', gridMargin)
    console.log('  Setting panOffset to:', { x: gridMargin - closestMinX, y: gridMargin - closestMinY })

    // Position with exactly 1 grid square from workspace viewport top-left
    const newPanOffset = {
      x: gridMargin - closestMinX,
      y: gridMargin - closestMinY
    }

    setPanOffset(newPanOffset)
  }

  const handleCanvasClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    
    console.log('Canvas click event:', {
      type: e.type,
      target: target.tagName,
      className: target.className,
      closest_card: target.closest('[data-card-id]'),
      closest_prose: target.closest('.prose'),
      has_data_card_id: target.hasAttribute('data-card-id'),
      isTextSelectionActive,
      timeSinceSelection: Date.now() - lastSelectionTime
    })
    
    // MOST IMPORTANT: If there's ANY active text selection state, don't force save
    if (isTextSelectionActive) {
      console.log('Text selection is active, not forcing finish editing')
      return
    }
    
    // Check if there's ANY text selection anywhere in the document - if so, don't force save
    const selection = window.getSelection()
    if (selection && !selection.isCollapsed) {
      console.log('Any text selection detected, not forcing finish editing')
      return
    }
    
    // Check if there was recent card interaction (within 1000ms) - if so, don't force save
    const timeSinceCardInteraction = Date.now() - lastCardInteractionTime
    if (timeSinceCardInteraction < 1000) {
      console.log('Recent card interaction detected, not forcing finish editing', { timeSinceCardInteraction })
      return
    }
    
    // Check if text selection occurred recently (within 2000ms) - be very conservative
    const timeSinceSelection = Date.now() - lastSelectionTime
    if (timeSinceSelection < 2000) {
      console.log('Recent text selection detected, not forcing finish editing', { timeSinceSelection })
      return
    }
    
    // ENHANCED: Check if click is inside ANY part of ANY card - be much more thorough
    const cardElement = target.closest('[data-card-id]') ||
                       target.closest('.prose') ||
                       target.closest('.card-content') ||
                       target.closest('div[style*="position: absolute"]') ||
                       // Check if target or any parent has card-related classes
                       target.closest('.rich-text-editor') ||
                       target.closest('.ql-editor') ||
                       // Check if this element is inside a card by looking for card attributes on ancestors
                       (() => {
                         let parent = target.parentElement
                         while (parent) {
                           if (parent.hasAttribute('data-card-id') || parent.classList.contains('prose')) {
                             return parent
                           }
                           parent = parent.parentElement
                         }
                         return null
                       })()
    
    if (cardElement) {
      console.log('Click inside card or card-related element detected, not forcing finish editing', {
        cardElement: cardElement.tagName,
        cardId: cardElement.getAttribute('data-card-id')
      })
      return
    }
    
    // Check if this was a quick click (mouse down and up happened quickly and in same place)
    const clickDuration = Date.now() - mouseDownTime
    const mouseMovement = Math.abs(e.clientX - mouseDownPosition.x) + Math.abs(e.clientY - mouseDownPosition.y)
    
    // If mouse was held down for too long or moved too much, it might be a selection gesture
    if (clickDuration > 300 || mouseMovement > 5) {
      console.log('Click seems like a selection gesture, not forcing finish editing', { 
        clickDuration, 
        mouseMovement 
      })
      return
    }
    
    console.log('Genuine click outside cards detected, forcing finish editing')
    
    // Use setTimeout to ensure any card click handlers have a chance to run first
    setTimeout(() => {
      // Double-check that there's still no active selection
      const currentSelection = window.getSelection()
      if (currentSelection && !currentSelection.isCollapsed) {
        console.log('Selection detected during delayed save, aborting')
        return
      }
      
      // Click outside all cards - save/finish editing
      if (connectingMode && firstConnectionCard) {
        setConnectingMode(false)
        setFirstConnectionCard(null)
      } else {
        setSelectedCardId(null)
      }
    }, 10) // Small delay to let card handlers run first
  }

  // Panning handlers - IMPROVED FOR FULL GRID DRAGGING
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // Track mouse down for distinguishing clicks from selections
    setMouseDownTime(Date.now())
    setMouseDownPosition({ x: e.clientX, y: e.clientY })
    
    // Only start panning on left mouse button
    if (e.button === 0) {
      const target = e.target as HTMLElement
      
      // Don't start panning if clicking on cards, buttons, or other interactive elements
      if (
        target.closest('[data-card-id]') || // Cards (using data attribute)
        target.closest('.prose') || // Card content areas
        target.closest('button') || // Buttons
        target.closest('input') || // Inputs
        target.closest('textarea') || // Text areas
        target.closest('svg') || // Connection lines
        target.tagName === 'BUTTON' ||
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SVG' ||
        // Check if the click is inside any card-related element
        target.classList.contains('prose') ||
        target.closest('.ql-editor') || // Quill editor
        target.closest('.rich-text-editor') // Rich text editor
      ) {
        return
      }
      
      e.preventDefault()
      e.stopPropagation()
      setIsPanning(true)
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y })
    }
  }

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      e.preventDefault()
      e.stopPropagation()
      const newPanOffset = {
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      }
      setPanOffset(newPanOffset)
    }
  }

  const handleCanvasMouseUp = () => {
    setIsPanning(false)
  }

  // Also handle mouse leave to stop panning if mouse exits canvas
  const handleCanvasMouseLeave = () => {
    setIsPanning(false)
  }

  // Handle wheel events for zooming
  const handleCanvasWheel = useCallback((e: React.WheelEvent) => {
    // Check if the target is within a card to avoid interfering with card scrolling
    const target = e.target as HTMLElement
    if (
      target.closest('[data-card-id]') || // Cards (using data attribute)
      target.closest('.prose') || // Card content areas
      target.closest('.ql-editor') || // Quill editor
      target.closest('.rich-text-editor') // Rich text editor
    ) {
      return // Let the card handle the scroll
    }

    // Get the mouse position relative to the canvas
    const rect = e.currentTarget.getBoundingClientRect()
    const zoomCenter = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }

    handleZoomGesture(e.nativeEvent, zoomCenter)
  }, [handleZoomGesture])

  // Handle double-click to create card at pointer location
  const handleCanvasDoubleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    
    // Don't create card if double-clicking on existing cards or interactive elements
    if (
      target.closest('[data-card-id]') || // Cards (using data attribute)
      target.closest('.prose') || // Card content areas
      target.closest('button') || // Buttons
      target.closest('input') || // Inputs
      target.closest('textarea') || // Text areas
      target.closest('svg') || // Connection lines
      target.tagName === 'BUTTON' ||
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SVG' ||
      target.classList.contains('prose') ||
      target.closest('.ql-editor') || // Quill editor
      target.closest('.rich-text-editor') // Rich text editor
    ) {
      return
    }

    e.preventDefault()
    e.stopPropagation()

    // Get the canvas container bounds
    const canvasRect = e.currentTarget.getBoundingClientRect()
    
    // Calculate the click position relative to the canvas
    const clickX = e.clientX - canvasRect.left
    const clickY = e.clientY - canvasRect.top
    
    // Convert to world coordinates by accounting for pan offset and zoom
    const worldX = (clickX - panOffset.x) / zoomLevel
    const worldY = (clickY - panOffset.y) / zoomLevel
    
    console.log('🎯 DOUBLE-CLICK CREATE CARD:')
    console.log('  Click position:', { clickX, clickY })
    console.log('  Pan offset:', panOffset)
    console.log('  Zoom level:', zoomLevel)
    console.log('  World coordinates:', { worldX, worldY })
    
    // Create card at the clicked position
    createCard(worldX, worldY)
  }

  const handleCardSelect = (cardId: string) => {
    if (connectingMode) {
      if (!firstConnectionCard) {
        setFirstConnectionCard(cardId)
      } else if (firstConnectionCard !== cardId) {
        createConnection(firstConnectionCard, cardId)
        setConnectingMode(false)
        setFirstConnectionCard(null)
      }
    } else {
      setSelectedCardId(cardId)
    }
  }

  // Helper function to get card center position
  const getCardCenter = (card: CardType) => ({
    x: card.x + card.width / 2,
    y: card.y + card.height / 2,
  })



  // Helper function to get connection points at card edges
  const getCardConnectionPoints = (fromCard: CardType, toCard: CardType) => {
    const fromCenter = getCardCenter(fromCard)
    const toCenter = getCardCenter(toCard)
    
    // Calculate the direction vector
    const dx = toCenter.x - fromCenter.x
    const dy = toCenter.y - fromCenter.y
    
    // Avoid division by zero
    if (dx === 0 && dy === 0) {
      return { from: fromCenter, to: toCenter }
    }
    
    // Function to find intersection with rectangle edge
    const getEdgeIntersection = (center: {x: number, y: number}, card: CardType, direction: {x: number, y: number}) => {
      const halfWidth = card.width / 2
      const halfHeight = card.height / 2
      
      // Normalize direction
      const length = Math.sqrt(direction.x * direction.x + direction.y * direction.y)
      const normalizedDx = direction.x / length
      const normalizedDy = direction.y / length
      
      // Calculate intersection with each edge
      let t = Infinity
      
      // Right edge
      if (normalizedDx > 0) {
        t = Math.min(t, halfWidth / normalizedDx)
      }
      // Left edge  
      else if (normalizedDx < 0) {
        t = Math.min(t, -halfWidth / normalizedDx)
      }
      
      // Bottom edge
      if (normalizedDy > 0) {
        t = Math.min(t, halfHeight / normalizedDy)
      }
      // Top edge
      else if (normalizedDy < 0) {
        t = Math.min(t, -halfHeight / normalizedDy)
      }
      
      return {
        x: center.x + normalizedDx * t,
        y: center.y + normalizedDy * t
      }
    }
    
    // Get edge points
    const fromPoint = getEdgeIntersection(fromCenter, fromCard, { x: dx, y: dy })
    const toPoint = getEdgeIntersection(toCenter, toCard, { x: -dx, y: -dy })
    
    return { from: fromPoint, to: toPoint }
  }

  return (
    <div className="relative w-full h-full bg-gray-50 flex flex-col">
      {/* Fixed Toolbar */}
      <div className="flex-shrink-0 p-4 bg-white border-b border-gray-200">
        <div className="flex items-center gap-2">
          <button
            onClick={() => createCard()}
            className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            title="Add Card"
          >
            <Plus size={16} />
            Add Card
          </button>
          <button
            onClick={() => {
              setConnectingMode(!connectingMode)
              setFirstConnectionCard(null)
            }}
            className={`flex items-center gap-2 px-3 py-2 rounded ${
              connectingMode 
                ? 'bg-orange-500 text-white hover:bg-orange-600' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            title="Connect Cards"
          >
            <ArrowRight size={16} />
            {connectingMode ? 'Cancel Connect' : 'Connect'}
          </button>
          {selectedCardId && (
            <button
              onClick={() => deleteCard(selectedCardId)}
              className="flex items-center gap-2 px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              title="Delete Selected Card"
            >
              <Minus size={16} />
              Delete
            </button>
          )}
          
          {/* Undo/Redo Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={performUndo}
              disabled={undoStack.length === 0}
              className={`flex items-center gap-2 px-3 py-2 rounded ${
                undoStack.length === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title={`Undo (${undoStack.length} actions available)`}
            >
              <Undo size={16} />
              Undo
            </button>
            
            <button
              onClick={performRedo}
              disabled={redoStack.length === 0}
              className={`flex items-center gap-2 px-3 py-2 rounded ${
                redoStack.length === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title={`Redo (${redoStack.length} actions available)`}
            >
              <Redo size={16} />
              Redo
            </button>
          </div>
          
          {/* Grid Controls */}
          <div className="flex items-center gap-3 ml-4 border-l border-gray-300 pl-4">
            {/* Zoom Controls */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Zoom:</span>
              <button
                onClick={zoomOut}
                disabled={zoomLevel <= MIN_ZOOM}
                className={`flex items-center justify-center w-8 h-8 rounded ${
                  zoomLevel <= MIN_ZOOM
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title="Zoom Out"
              >
                <ZoomOut size={14} />
              </button>
              <span className="text-sm text-gray-600 min-w-[3rem] text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={zoomIn}
                disabled={zoomLevel >= MAX_ZOOM}
                className={`flex items-center justify-center w-8 h-8 rounded ${
                  zoomLevel >= MAX_ZOOM
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title="Zoom In"
              >
                <ZoomIn size={14} />
              </button>
              <button
                onClick={resetZoom}
                className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                title="Reset Zoom to 100%"
              >
                100%
              </button>
            </div>

            <button
              onClick={() => {
                const nextType = gridType === 'off' ? 'dots' : gridType === 'dots' ? 'lines' : 'off'
                setGridType(nextType)
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded ${
                gridType !== 'off'
                  ? 'bg-purple-500 text-white hover:bg-purple-600' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title={`Grid: ${gridType === 'off' ? 'Off' : gridType === 'dots' ? 'Dots' : 'Lines'} (click to cycle)`}
            >
              <Grid3X3 size={16} />
              {gridType === 'off' ? 'Grid: Off' : gridType === 'dots' ? 'Grid: Dots' : 'Grid: Lines'}
            </button>
            
            {/* Snap to Grid Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Snap:</span>
              <button
                onClick={() => setSnapToGrid(!snapToGrid)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                  snapToGrid ? 'bg-purple-600' : 'bg-gray-200'
                }`}
                title="Toggle Snap to Grid"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    snapToGrid ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Reset Button */}
            <button
              onClick={resetViewToShowContent}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              title="Reset View - Show all cards with optimal positioning"
            >
              <RotateCcw size={16} />
              Reset
            </button>
          </div>
          
          {/* Connection status */}
          {connectingMode && (
            <div className="ml-4 bg-orange-100 border border-orange-200 rounded-lg px-3 py-2">
              <p className="text-orange-800 text-sm">
                {firstConnectionCard 
                  ? 'Click another card to create connection' 
                  : 'Click a card to start connecting'
                }
              </p>
            </div>
          )}
          
          {/* Connection help */}
          {connections.length > 0 && !connectingMode && (
            <div className="ml-4 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
              <p className="text-blue-800 text-sm">
                Click on arrows to delete connections
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Scrollable Canvas Area - ENTIRE AREA DRAGGABLE */}
      <div 
        className={`flex-1 overflow-hidden bg-gray-50 relative ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{
          backgroundImage: gridType === 'lines' ? 
            `linear-gradient(to right, #d1d5db 1px, transparent 1px), linear-gradient(to bottom, #d1d5db 1px, transparent 1px)` :
            gridType === 'dots' ?
            `radial-gradient(circle, #d1d5db 1px, transparent 1px)` :
            'none',
          backgroundSize: gridType !== 'off' ? `${gridSize * zoomLevel}px ${gridSize * zoomLevel}px` : 'auto',
          backgroundPosition: gridType !== 'off' ? `${panOffset.x % (gridSize * zoomLevel)}px ${panOffset.y % (gridSize * zoomLevel)}px` : 'auto',
        }}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseLeave}
        onWheel={handleCanvasWheel}
        onClick={handleCanvasClick}
        onDoubleClick={handleCanvasDoubleClick}
      >
        {/* Paging Indicators */}
        {pageIndicators.left && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              navigateToDirection('left')
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-blue-50/90 hover:bg-blue-100 border border-blue-200 rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110"
            title="Navigate to cards on the left"
          >
            <ChevronLeft size={20} className="text-blue-600" />
          </button>
        )}
        
        {pageIndicators.right && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              navigateToDirection('right')
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-blue-50/90 hover:bg-blue-100 border border-blue-200 rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110"
            title="Navigate to cards on the right"
          >
            <ChevronRight size={20} className="text-blue-600" />
          </button>
        )}
        
        {pageIndicators.up && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              navigateToDirection('up')
            }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-blue-50/90 hover:bg-blue-100 border border-blue-200 rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110"
            title="Navigate to cards above"
          >
            <ChevronUp size={20} className="text-blue-600" />
          </button>
        )}
        
        {pageIndicators.down && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              navigateToDirection('down')
            }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 bg-blue-50/90 hover:bg-blue-100 border border-blue-200 rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110"
            title="Navigate to cards below"
          >
            <ChevronDown size={20} className="text-blue-600" />
          </button>
        )}
        <DndContext
          sensors={sensors}  
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
          collisionDetection={rectIntersection}
        >
          {/* SVG for connections - OUTSIDE the transformed div */}
          <svg 
            className="absolute top-0 left-0 pointer-events-none"
            style={{ 
              width: '100%', 
              height: '100%',
              zIndex: 5
            }}
          >
            {connections.map(connection => {
              const fromCard = cards.find(c => c.id === connection.fromCardId)
              const toCard = cards.find(c => c.id === connection.toCardId)
              
              if (!fromCard || !toCard) return null
              
              const { from, to } = getCardConnectionPoints(fromCard, toCard)
              
              // Apply pan offset and zoom to connection coordinates
              const adjustedFrom = {
                x: (from.x * zoomLevel) + panOffset.x,
                y: (from.y * zoomLevel) + panOffset.y
              }
              const adjustedTo = {
                x: (to.x * zoomLevel) + panOffset.x,
                y: (to.y * zoomLevel) + panOffset.y
              }
              
              return (
                <g key={connection.id} className="group">
                  {/* Invisible thick line for easier clicking */}
                  <line
                    x1={adjustedFrom.x}
                    y1={adjustedFrom.y}
                    x2={adjustedTo.x}
                    y2={adjustedTo.y}
                    stroke="transparent"
                    strokeWidth={12 * zoomLevel}
                    className="pointer-events-auto cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteConnection(connection.id)
                    }}
                  />
                  {/* Visible connection line */}
                  <line
                    x1={adjustedFrom.x}
                    y1={adjustedFrom.y}
                    x2={adjustedTo.x}
                    y2={adjustedTo.y}
                    stroke="#6B7280"
                    strokeWidth={2 * zoomLevel}
                    markerEnd="url(#arrowhead)"
                    className="pointer-events-none group-hover:opacity-50 transition-opacity"
                  />
                  {/* Hover indicator line */}
                  <line
                    x1={adjustedFrom.x}
                    y1={adjustedFrom.y}
                    x2={adjustedTo.x}
                    y2={adjustedTo.y}
                    stroke="#ef4444"
                    strokeWidth={3 * zoomLevel}
                    markerEnd="url(#arrowhead-red)"
                    className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </g>
              )
            })}
            
            {/* Arrow marker definitions */}
            <defs>
              <marker
                id="arrowhead"
                markerWidth={10 * zoomLevel}
                markerHeight={7 * zoomLevel}
                refX={9 * zoomLevel}
                refY={3.5 * zoomLevel}
                orient="auto"
                markerUnits="userSpaceOnUse"
              >
                <polygon
                  points={`0 0, ${10 * zoomLevel} ${3.5 * zoomLevel}, 0 ${7 * zoomLevel}`}
                  fill="#6B7280"
                />
              </marker>
              <marker
                id="arrowhead-red"
                markerWidth={10 * zoomLevel}
                markerHeight={7 * zoomLevel}
                refX={9 * zoomLevel}
                refY={3.5 * zoomLevel}
                orient="auto"
                markerUnits="userSpaceOnUse"
              >
                <polygon
                  points={`0 0, ${10 * zoomLevel} ${3.5 * zoomLevel}, 0 ${7 * zoomLevel}`}
                  fill="#ef4444"
                />
              </marker>
            </defs>
          </svg>

          <div 
            className="relative pointer-events-none"
            style={{ 
              minWidth: '300vw', 
              minHeight: '300vh',
              width: '300vw',
              height: '300vh',
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
              transformOrigin: '0 0',
              zIndex: 10
            }}
          >
          {/* Cards */}
          {cards.map(card => (
            <div key={card.id} style={{ pointerEvents: 'auto' }}>
              <Card
                card={card}
                onUpdate={updateCard}
                onDelete={deleteCard}
                onSelect={handleCardSelect}
                isSelected={selectedCardId === card.id || firstConnectionCard === card.id}
                snapToGrid={snapToGrid}
                gridSize={gridSize}
                connectingMode={connectingMode}
                onCardInteraction={() => setLastCardInteractionTime(Date.now())}
              />
            </div>
          ))}
        </div>
        
        <DragOverlay>
          {draggedCard && (
            <div 
              className="bg-white border-2 border-blue-500 rounded-lg shadow-xl opacity-80"
              style={{ width: draggedCard.width, height: draggedCard.height }}
            >
              <div className="p-3 border-b border-gray-200 bg-gray-50">
                <h3 className="font-medium text-sm text-gray-900">
                  {draggedCard.title || 'Untitled Card'}
                </h3>
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>
      </div>
    </div>
  )
})

WorkspaceCanvas.displayName = 'WorkspaceCanvas'

export default WorkspaceCanvas
