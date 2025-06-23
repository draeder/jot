'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Card as CardType } from '@/lib/db'
import RichTextEditor from './rich-text-editor'
import { GripVertical, X, Edit2 } from 'lucide-react'
import { useDraggable } from '@dnd-kit/core'

interface CardProps {
  card: CardType
  onUpdate: (card: CardType) => void
  onDelete: (cardId: string) => void
  onSelect: (cardId: string) => void
  isSelected: boolean
  snapToGrid?: boolean
  gridSize?: number
  connectingMode?: boolean
  onCardInteraction?: () => void
}

export default function Card({ 
  card, 
  onUpdate, 
  onDelete, 
  onSelect, 
  isSelected, 
  snapToGrid = false, 
  gridSize = 20,
  connectingMode = false,
  onCardInteraction
}: CardProps) {
  const [isEditing, setIsEditing] = useState(false)
  
  // Debug isEditing state changes
  useEffect(() => {
    console.log(`Card ${card.id} isEditing changed to:`, isEditing)
  }, [isEditing, card.id])
  const [title, setTitle] = useState(card.title)
  const [content, setContent] = useState(card.content)
  const [isResizing, setIsResizing] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  // Snap dimensions to grid
  const snapToGridDimensions = useCallback((width: number, height: number) => {
    if (!snapToGrid) return { width, height }
    
    return {
      width: Math.round(width / gridSize) * gridSize,
      height: Math.round(height / gridSize) * gridSize
    }
  }, [snapToGrid, gridSize])

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: card.id,
    data: {
      type: 'card',
      card,
    },
    disabled: isResizing, // Only disable dragging when resizing, allow dragging while editing
  })

  // During dragging, use transform for positioning. Otherwise use left/top
  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: isDragging ? 1000 : undefined, // Ensure dragged card is on top
    left: card.x, // Keep original position as base
    top: card.y,
  } : {
    left: card.x,
    top: card.y,
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !cardRef.current) return

      const rect = cardRef.current.getBoundingClientRect()
      let newWidth = e.clientX - rect.left
      let newHeight = e.clientY - rect.top

      // Apply minimum size constraints
      newWidth = Math.max(200, newWidth)
      newHeight = Math.max(150, newHeight)

      // Apply snap to grid if enabled
      const snappedDimensions = snapToGridDimensions(newWidth, newHeight)
      newWidth = snappedDimensions.width
      newHeight = snappedDimensions.height

      onUpdate({
        ...card,
        width: newWidth,
        height: newHeight,
        updatedAt: new Date(),
      })
    }

    const handleMouseUp = (e: MouseEvent) => {
      if (isResizing) {
        e.preventDefault()
        e.stopPropagation()
        setIsResizing(false)
      }
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      // Also listen for mouse leave to handle edge cases
      document.addEventListener('mouseleave', handleMouseUp)
      
      // Prevent text selection during resize
      document.body.style.userSelect = 'none'
      document.body.style.pointerEvents = 'none'
      
      // Re-enable pointer events on the card being resized
      if (cardRef.current) {
        cardRef.current.style.pointerEvents = 'auto'
      }
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('mouseleave', handleMouseUp)
      
      // Restore normal pointer events and text selection
      document.body.style.userSelect = ''
      document.body.style.pointerEvents = ''
      if (cardRef.current) {
        cardRef.current.style.pointerEvents = ''
      }
    }
  }, [isResizing, card, onUpdate, snapToGrid, gridSize, snapToGridDimensions])

  const handleSave = useCallback(() => {
    console.log('handleSave called, setting isEditing to false')
    console.log('Saving content:', { title, content })
    onUpdate({
      ...card,
      title,
      content,
      updatedAt: new Date(),
    })
    setIsEditing(false)
  }, [card, title, content, onUpdate])

  const handleCancel = () => {
    console.log('handleCancel called, setting isEditing to false')
    setTitle(card.title)
    setContent(card.content)
    setIsEditing(false)
  }

  // New effect to handle clicks outside the card to force save
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!isEditing || !cardRef.current || isResizing) return
      
      // Check if the click is outside this card
      const target = event.target as Element
      if (!cardRef.current.contains(target)) {
        console.log('Click outside card detected, saving')
        handleSave()
      }
    }

    if (isEditing && !isResizing) {
      // Add delay to prevent immediate triggering when entering edit mode
      const timer = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside)
      }, 100)
      
      return () => {
        clearTimeout(timer)
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [isEditing, isResizing, handleSave])

  return (
    <div
      ref={(node) => {
        setNodeRef(node)
        cardRef.current = node
      }}
      style={{ 
        ...style,
        width: card.width,
        height: card.height,
      }}
      className={`absolute bg-white border-2 rounded-lg shadow-lg flex flex-col cursor-default ${
        isSelected ? 'border-blue-500' : 'border-gray-200'
      } ${isDragging ? 'opacity-50' : ''} ${
        connectingMode ? 'hover:border-orange-400 hover:shadow-orange-200' : ''
      }`}
      data-card-id={card.id}
      onClick={(e) => {
        e.stopPropagation()
        e.preventDefault()
        onCardInteraction?.()
        onSelect(card.id)
      }}
      onMouseDown={(e) => {
        e.stopPropagation()
        e.preventDefault()
        onCardInteraction?.()
      }}
      onMouseUp={(e) => {
        e.stopPropagation()
        e.preventDefault()
        onCardInteraction?.()
      }}
      onDoubleClick={(e) => {
        e.stopPropagation()
        e.preventDefault()
        onCardInteraction?.()
      }}
    >
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div className="flex items-center gap-2 flex-1">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-2 hover:bg-gray-200 rounded flex-shrink-0"
            style={{ touchAction: 'none' }} // Prevent touch scrolling on mobile
          >
            <GripVertical size={16} className="text-gray-400" />
          </div>
          {isEditing ? (
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
              }}
              onKeyDown={(e) => {
                e.stopPropagation()
                if (e.key === 'Escape') {
                  handleCancel()
                }
              }}
              onKeyUp={(e) => {
                e.stopPropagation()
              }}
              onKeyPress={(e) => {
                e.stopPropagation()
              }}
              onMouseDown={(e) => {
                e.stopPropagation()
              }}
              onMouseUp={(e) => {
                e.stopPropagation()
              }}
              onSelect={(e) => {
                e.stopPropagation()
              }}
              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
              placeholder="Card title"
              autoFocus
            />
          ) : (
            <h3 
              className="flex-1 font-medium text-sm text-gray-900 truncate cursor-pointer hover:bg-gray-100 rounded px-2 py-1 transition-colors"
              onClick={(e) => {
                console.log('Title clicked - entering edit mode')
                
                // Check if there's active text selection - if so, don't enter edit mode
                const selection = window.getSelection()
                if (selection && !selection.isCollapsed) {
                  console.log('Text selection detected, not entering edit mode')
                  e.stopPropagation()
                  return
                }
                
                e.stopPropagation()
                onCardInteraction?.()
                
                // Enter edit mode for the entire card
                setIsEditing(true)
              }}
              title="Click to edit title"
            >
              {card.title || 'Untitled Card'}
            </h3>
          )}
        </div>
        <div className="flex items-center gap-1">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                className="p-1 text-green-600 hover:bg-green-100 rounded"
                title="Save"
              >
                ✓
              </button>
              <button
                onClick={handleCancel}
                className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                title="Cancel"
              >
                ✗
              </button>
            </>
          ) : (
            <>
              <button
                onClick={(e) => {
                  console.log('Edit button clicked!')
                  
                  // Check if there's active text selection - if so, don't enter edit mode
                  const selection = window.getSelection()
                  if (selection && !selection.isCollapsed) {
                    console.log('Text selection detected, not entering edit mode')
                    e.stopPropagation()
                    return
                  }
                  
                  e.stopPropagation()
                  onCardInteraction?.()
                  
                  console.log('Setting isEditing to true')
                  setIsEditing(true)
                }}
                className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                title="Edit"
              >
                <Edit2 size={14} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(card.id)
                }}
                className="p-1 text-red-600 hover:bg-red-100 rounded"
                title="Delete"
              >
                <X size={14} />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 p-2 overflow-hidden">
        {isEditing ? (
          <div
            style={{ 
              height: 'calc(100% - 20px)',
              display: 'flex',
              flexDirection: 'column'
            }}
            onKeyDown={(e) => {
              e.stopPropagation()
            }}
            onKeyUp={(e) => {
              e.stopPropagation()
            }}
            onKeyPress={(e) => {
              e.stopPropagation()
            }}
            onClick={(e) => {
              e.stopPropagation()
            }}
          >
            <RichTextEditor
              content={content}
              onChange={(newContent) => {
                setContent(newContent)
              }}
              placeholder="Write your note here..."
              className="flex-1"
            />
          </div>
        ) : (
          <div 
            className={`prose prose-sm max-w-none h-full overflow-auto hover:bg-gray-50 card-content transition-colors ${
              connectingMode ? 'cursor-crosshair' : 'cursor-text'
            }`}
            onClick={(e) => {
              console.log('Content area clicked!', { connectingMode, isEditing })
              
              onCardInteraction?.()
              
              // Check if there's an active text selection - if so, don't enter edit mode
              const selection = window.getSelection()
              if (selection && !selection.isCollapsed && selection.toString().trim().length > 0) {
                console.log('Text selection detected, not entering edit mode')
                e.stopPropagation()
                return
              }
              
              e.stopPropagation()
              
              // If in connecting mode, prioritize connection over editing
              if (connectingMode) {
                onSelect(card.id)
                return
              }
              
              console.log('Setting isEditing to true from content click')
              setIsEditing(true)
            }}
            onMouseDown={(e) => {
              e.stopPropagation()
            }}
            onMouseUp={(e) => {
              e.stopPropagation()
            }}
            title="Click to edit content"
            dangerouslySetInnerHTML={{ __html: card.content || '<p class="text-gray-500 text-sm italic">Click to add content...</p>' }}
          />
        )}
      </div>

      {/* Resize handle */}
      <div
        className={`absolute bottom-0 right-0 w-4 h-4 cursor-se-resize bg-gray-300 hover:bg-gray-400 ${
          isResizing ? 'bg-gray-400' : ''
        }`}
        style={{
          clipPath: 'polygon(100% 0%, 0% 100%, 100% 100%)',
          zIndex: 10, // Ensure resize handle is always on top
        }}
        onMouseDown={(e) => {
          e.preventDefault()
          e.stopPropagation()
          console.log('Resize handle mousedown - setting isResizing to true')
          setIsResizing(true)
          onCardInteraction?.()
        }}
        onMouseUp={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
      />
    </div>
  )
}
