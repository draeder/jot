'use client'

import { useState, useRef, useEffect } from 'react'
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
}

export default function Card({ card, onUpdate, onDelete, onSelect, isSelected }: CardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(card.title)
  const [content, setContent] = useState(card.content)
  const [isResizing, setIsResizing] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: card.id,
    data: {
      type: 'card',
      card,
    },
    disabled: isResizing || isEditing, // Disable dragging when resizing or editing
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
      const newWidth = e.clientX - rect.left
      const newHeight = e.clientY - rect.top

      if (newWidth > 200 && newHeight > 150) {
        onUpdate({
          ...card,
          width: newWidth,
          height: newHeight,
          updatedAt: new Date(),
        })
      }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, card, onUpdate])

  const handleSave = () => {
    onUpdate({
      ...card,
      title,
      content,
      updatedAt: new Date(),
    })
    setIsEditing(false)
  }

  const handleCancel = () => {
    setTitle(card.title)
    setContent(card.content)
    setIsEditing(false)
  }

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
      className={`absolute bg-white border-2 rounded-lg shadow-lg flex flex-col ${
        isSelected ? 'border-blue-500' : 'border-gray-200'
      } ${isDragging ? 'opacity-50' : ''}`}
      onClick={() => onSelect(card.id)}
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
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
              placeholder="Card title"
              autoFocus
            />
          ) : (
            <h3 className="flex-1 font-medium text-sm text-gray-900 truncate">
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
                  e.stopPropagation()
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
          <RichTextEditor
            content={content}
            onChange={setContent}
            placeholder="Write your note here..."
            className="flex-1 min-h-0 h-full"
          />
        ) : (
          <div 
            className="prose prose-sm max-w-none h-full overflow-y-auto"
            dangerouslySetInnerHTML={{ __html: card.content || '<p class="text-gray-500 text-sm">Click edit to add content...</p>' }}
          />
        )}
      </div>

      {/* Resize handle */}
      <div
        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize bg-gray-300 hover:bg-gray-400"
        style={{
          clipPath: 'polygon(100% 0%, 0% 100%, 100% 100%)',
        }}
        onMouseDown={(e) => {
          e.preventDefault()
          setIsResizing(true)
        }}
      />
    </div>
  )
}
