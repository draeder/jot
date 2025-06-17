'use client'

import { useState, useEffect, useCallback } from 'react'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, DragCancelEvent, useSensor, useSensors, PointerSensor, rectIntersection } from '@dnd-kit/core'
import { Card as CardType, Connection, db } from '@/lib/db'
import Card from './card'
import { Plus, ArrowRight, Minus } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'

interface WorkspaceCanvasProps {
  workspaceId: string
}

export default function WorkspaceCanvas({ workspaceId }: WorkspaceCanvasProps) {
  const [cards, setCards] = useState<CardType[]>([])
  const [connections, setConnections] = useState<Connection[]>([])
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [draggedCard, setDraggedCard] = useState<CardType | null>(null)
  const [connectingMode, setConnectingMode] = useState(false)
  const [firstConnectionCard, setFirstConnectionCard] = useState<string | null>(null)

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

  const createCard = async (x: number = 20, y: number = 20) => {
    const newCard: CardType = {
      id: uuidv4(),
      workspaceId,
      title: 'New Card',
      content: '',
      x,
      y,
      width: 350,
      height: 280,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    try {
      await db.cards.add(newCard)
      setCards(prev => [...prev, newCard])
      setSelectedCardId(newCard.id)
    } catch (error) {
      console.error('Error creating card:', error)
    }
  }

  const updateCard = async (updatedCard: CardType) => {
    try {
      await db.cards.update(updatedCard.id, updatedCard)
      setCards(prev => prev.map(card => card.id === updatedCard.id ? updatedCard : card))
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
    try {
      await db.cards.delete(cardId)
      // Also delete connections involving this card
      const cardConnections = connections.filter(
        conn => conn.fromCardId === cardId || conn.toCardId === cardId
      )
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
    } catch (error) {
      console.error('Error creating connection:', error)
    }
  }

  const deleteConnection = async (connectionId: string) => {
    try {
      await db.connections.delete(connectionId)
      setConnections(prev => prev.filter(conn => conn.id !== connectionId))
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

    // Calculate new position and ensure it stays within reasonable bounds
    let newX = card.x + delta.x
    let newY = card.y + delta.y

    // Prevent cards from going behind the sidebar (256px wide w-64 class)
    // Cards should not be positioned with negative x values since they're within the canvas area
    newX = Math.max(0, newX)
    newY = Math.max(0, newY)

    // Also prevent cards from being dragged too far to the right/bottom
    // This helps prevent them from getting lost off-screen
    const maxX = window.innerWidth + card.width / 2
    const maxY = window.innerHeight + card.height / 2
    newX = Math.min(maxX, newX)
    newY = Math.min(maxY, newY)

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
  }

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      if (connectingMode && firstConnectionCard) {
        // Cancel connection mode
        setConnectingMode(false)
        setFirstConnectionCard(null)
      } else {
        setSelectedCardId(null)
      }
    }
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

      {/* Scrollable Canvas Area */}
      <div className="flex-1 overflow-auto bg-gray-50">
        <DndContext
          sensors={sensors}  
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
          collisionDetection={rectIntersection}
        >
          <div 
            className="relative cursor-default"
            style={{ 
              minWidth: '100%', 
              minHeight: '100%',
              width: 'max-content',
              height: 'max-content'
            }}
            onClick={handleCanvasClick}
          >
          {/* SVG for connections */}
          <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
            {connections.map(connection => {
              const fromCard = cards.find(c => c.id === connection.fromCardId)
              const toCard = cards.find(c => c.id === connection.toCardId)
              
              if (!fromCard || !toCard) return null
              
              const { from, to } = getCardConnectionPoints(fromCard, toCard)
              
              return (
                <g key={connection.id} className="group">
                  {/* Invisible thick line for easier clicking */}
                  <line
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke="transparent"
                    strokeWidth="12"
                    className="pointer-events-auto cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteConnection(connection.id)
                    }}
                  />
                  {/* Visible connection line */}
                  <line
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke="#6B7280"
                    strokeWidth="2"
                    markerEnd="url(#arrowhead)"
                    className="pointer-events-none group-hover:opacity-50 transition-opacity"
                  />
                  {/* Hover indicator line */}
                  <line
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke="#ef4444"
                    strokeWidth="3"
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
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3.5, 0 7"
                  fill="#6B7280"
                />
              </marker>
              <marker
                id="arrowhead-red"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3.5, 0 7"
                  fill="#ef4444"
                />
              </marker>
            </defs>
          </svg>

          {/* Cards */}
          {cards.map(card => (
            <Card
              key={card.id}
              card={card}
              onUpdate={updateCard}
              onDelete={deleteCard}
              onSelect={handleCardSelect}
              isSelected={selectedCardId === card.id || firstConnectionCard === card.id}
            />
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
}
