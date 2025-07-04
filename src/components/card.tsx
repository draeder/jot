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
  const [showColorPicker, setShowColorPicker] = useState(false)
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

  const handleColorChange = (color: string) => {
    onUpdate({
      ...card,
      backgroundColor: color,
      updatedAt: new Date(),
    })
    setShowColorPicker(false)
  }

  // Calculate text color based on background luminosity
  const getTextColor = (backgroundColor: string) => {
    if (!backgroundColor || backgroundColor === '#ffffff') return '#000000'
    
    // Convert hex to RGB
    const hex = backgroundColor.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    
    // Calculate luminosity using the relative luminance formula
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    
    // Return white text for dark backgrounds, black text for light backgrounds
    return luminance > 0.5 ? '#000000' : '#ffffff'
  }

  // New effect to handle clicks outside the card to force save
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if ((!isEditing && !showColorPicker) || !cardRef.current || isResizing) return
      
      // Check if the click is outside this card
      const target = event.target as Element
      if (!cardRef.current.contains(target)) {
        if (isEditing) {
          console.log('Click outside card detected, saving')
          handleSave()
        }
        if (showColorPicker) {
          setShowColorPicker(false)
        }
      }
    }

    if ((isEditing || showColorPicker) && !isResizing) {
      // Add delay to prevent immediate triggering when entering edit mode
      const timer = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside)
      }, 100)
      
      return () => {
        clearTimeout(timer)
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [isEditing, isResizing, handleSave, showColorPicker])

  // Separate effect to handle color picker clicks outside
  useEffect(() => {
    const handleColorPickerClickOutside = (event: MouseEvent) => {
      if (!showColorPicker || !cardRef.current) return
      
      const target = event.target as Element
      const colorPickerContainer = cardRef.current.querySelector('.color-picker-container')
      
      // Check if click is outside the color picker container
      if (colorPickerContainer && !colorPickerContainer.contains(target)) {
        setShowColorPicker(false)
      }
    }

    if (showColorPicker) {
      // Add a small delay to prevent immediate closure
      const timer = setTimeout(() => {
        document.addEventListener('mousedown', handleColorPickerClickOutside)
      }, 100)
      
      return () => {
        clearTimeout(timer)
        document.removeEventListener('mousedown', handleColorPickerClickOutside)
      }
    }
  }, [showColorPicker])

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
        backgroundColor: card.backgroundColor || '#ffffff',
      }}
      className={`absolute border-2 rounded-lg shadow-lg flex flex-col cursor-default ${
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
      <div className="flex items-center justify-between p-3 border-b border-gray-200 rounded-t-lg" style={{ backgroundColor: 'rgba(249, 250, 251, 0.8)' }}>
        <div className="flex items-center gap-3 flex-1 mr-3">
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
        <div className="flex items-center gap-2">
          {/* Color picker - always visible */}
          <div className="relative color-picker-container">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowColorPicker(!showColorPicker)
              }}
              className="w-5 h-5 rounded border-2 border-gray-300 hover:border-gray-400 transition-colors"
              style={{ 
                background: card.backgroundColor === '#ffffff' || !card.backgroundColor
                  ? 'conic-gradient(from 0deg, #ff0000 0deg, #ff8000 45deg, #ffff00 90deg, #80ff00 135deg, #00ff00 180deg, #00ff80 225deg, #00ffff 270deg, #0080ff 315deg, #0000ff 360deg, #8000ff 405deg, #ff00ff 450deg, #ff0080 495deg, #ff0000 540deg)'
                  : `linear-gradient(45deg, ${card.backgroundColor} 0%, #ffffff 100%)`
              }}
              title="Change background color"
            />
            {showColorPicker && (
              <div className="absolute top-6 right-0 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-3">
                <div className="w-32 h-32 relative">
                  {/* Rainbow color wheel */}
                  <svg
                    width="128"
                    height="128"
                    viewBox="0 0 128 128"
                    className="absolute top-0 left-0"
                  >
                    {/* Create the rainbow wheel with clickable segments */}
                    {Array.from({ length: 360 }, (_, i) => {
                      const angle = i * (Math.PI / 180)
                      const hue = i
                      const innerRadius = 30
                      const outerRadius = 60
                      
                      // Calculate path coordinates for a slice
                      const x1 = 64 + innerRadius * Math.cos(angle)
                      const y1 = 64 + innerRadius * Math.sin(angle)
                      const x2 = 64 + outerRadius * Math.cos(angle)
                      const y2 = 64 + outerRadius * Math.sin(angle)
                      
                      const nextAngle = (i + 1) * (Math.PI / 180)
                      const x3 = 64 + outerRadius * Math.cos(nextAngle)
                      const y3 = 64 + outerRadius * Math.sin(nextAngle)
                      const x4 = 64 + innerRadius * Math.cos(nextAngle)
                      const y4 = 64 + innerRadius * Math.sin(nextAngle)
                      
                      const pathData = `M ${x1} ${y1} L ${x2} ${y2} L ${x3} ${y3} L ${x4} ${y4} Z`
                      
                      return (
                        <path
                          key={i}
                          d={pathData}
                          fill={`hsl(${hue}, 85%, 60%)`}
                          style={{ cursor: 'pointer' }}
                          onClick={() => {
                            // Convert HSL to hex
                            const hslToHex = (h: number, s: number, l: number) => {
                              l /= 100
                              const a = s * Math.min(l, 1 - l) / 100
                              const f = (n: number) => {
                                const k = (n + h / 30) % 12
                                const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
                                return Math.round(255 * color).toString(16).padStart(2, '0')
                              }
                              return `#${f(0)}${f(8)}${f(4)}`
                            }
                            
                            const hexColor = hslToHex(hue, 85, 60)
                            handleColorChange(hexColor)
                          }}
                        />
                      )
                    })}
                    
                    {/* Inner white circle for reset */}
                    <circle
                      cx="64"
                      cy="64"
                      r="25"
                      fill="white"
                      stroke="#ddd"
                      strokeWidth="2"
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleColorChange('#ffffff')}
                    />
                  </svg>
                </div>
              </div>
            )}
          </div>
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

      <div className="flex-1 overflow-hidden">
        {isEditing ? (
          <div
            className="p-2 h-full"
            style={{ 
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
            className={`prose prose-sm max-w-none h-full overflow-auto transition-colors ${
              connectingMode ? 'cursor-crosshair' : 'cursor-text'
            }`}
            style={{
              backgroundColor: 'transparent',
              color: getTextColor(card.backgroundColor || '#ffffff'),
              padding: 0
            }}
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
            dangerouslySetInnerHTML={{ 
              __html: `
                <div class="card-content-${card.id}" style="background-color: ${card.backgroundColor || '#ffffff'}; color: ${getTextColor(card.backgroundColor || '#ffffff')}; min-height: 100%; padding: 20px;">
                  <style>
                    .card-content-${card.id} *,
                    .card-content-${card.id} p,
                    .card-content-${card.id} h1,
                    .card-content-${card.id} h2,
                    .card-content-${card.id} h3,
                    .card-content-${card.id} h4,
                    .card-content-${card.id} h5,
                    .card-content-${card.id} h6,
                    .card-content-${card.id} li,
                    .card-content-${card.id} strong,
                    .card-content-${card.id} em,
                    .card-content-${card.id} span,
                    .card-content-${card.id} div,
                    .card-content-${card.id} blockquote,
                    .card-content-${card.id} a {
                      color: ${getTextColor(card.backgroundColor || '#ffffff')} !important;
                      background-color: transparent !important;
                    }
                    .card-content-${card.id} p {
                      margin-bottom: 14px;
                    }
                    .card-content-${card.id} p:last-child {
                      margin-bottom: 0;
                    }
                    .card-content-${card.id} h1, 
                    .card-content-${card.id} h2, 
                    .card-content-${card.id} h3, 
                    .card-content-${card.id} h4, 
                    .card-content-${card.id} h5, 
                    .card-content-${card.id} h6 {
                      margin-bottom: 10px;
                      margin-top: 18px;
                    }
                    .card-content-${card.id} h1:first-child, 
                    .card-content-${card.id} h2:first-child, 
                    .card-content-${card.id} h3:first-child, 
                    .card-content-${card.id} h4:first-child, 
                    .card-content-${card.id} h5:first-child, 
                    .card-content-${card.id} h6:first-child {
                      margin-top: 0;
                    }
                    .card-content-${card.id} ul, 
                    .card-content-${card.id} ol {
                      margin-bottom: 14px;
                      padding-left: 24px;
                    }
                    .card-content-${card.id} li {
                      margin-bottom: 6px;
                    }
                    .card-content-${card.id} blockquote {
                      margin: 14px 0;
                      padding-left: 18px;
                      border-left: 3px solid currentColor;
                      opacity: 0.8;
                    }
                  </style>
                  ${card.content || `<p class="text-sm italic" style="opacity: 0.7; color: ${getTextColor(card.backgroundColor || '#ffffff')};">Click to add content...</p>`}
                </div>
              `
            }}
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
