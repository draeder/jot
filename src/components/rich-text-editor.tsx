'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Focus from '@tiptap/extension-focus'
import Typography from '@tiptap/extension-typography'
import { Bold, Italic, List, ListOrdered, Quote, Redo, Undo } from 'lucide-react'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  className?: string
}

export default function RichTextEditor({ 
  content, 
  onChange, 
  placeholder = "Start writing...", 
  className = "" 
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
      Focus.configure({
        className: 'has-focus',
        mode: 'all',
      }),
      Typography,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  if (!editor) {
    return null
  }

  // Check if this is being used in a constrained container (like a card)
  const isConstrained = className.includes('flex-1') || className.includes('min-h-0')

  return (
    <div className={`border border-gray-300 rounded-lg overflow-hidden bg-white ${isConstrained ? 'flex flex-col h-full' : ''} ${className}`}>
      <div className="border-b border-gray-300 p-2 flex items-center gap-1 bg-gray-100 flex-shrink-0">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded transition-colors border text-xs ${
            editor.isActive('bold') 
              ? 'bg-blue-500 text-white border-blue-600 shadow-sm' 
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          }`}
          title="Bold"
        >
          <Bold size={14} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded transition-colors border text-xs ${
            editor.isActive('italic') 
              ? 'bg-blue-500 text-white border-blue-600 shadow-sm' 
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          }`}
          title="Italic"
        >
          <Italic size={14} />
        </button>
        <div className="w-px h-4 bg-gray-400 mx-1" />
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded transition-colors border text-xs ${
            editor.isActive('bulletList') 
              ? 'bg-blue-500 text-white border-blue-600 shadow-sm' 
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          }`}
          title="Bullet List"
        >
          <List size={14} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded transition-colors border text-xs ${
            editor.isActive('orderedList') 
              ? 'bg-blue-500 text-white border-blue-600 shadow-sm' 
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          }`}
          title="Ordered List"
        >
          <ListOrdered size={14} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-1.5 rounded transition-colors border text-xs ${
            editor.isActive('blockquote') 
              ? 'bg-blue-500 text-white border-blue-600 shadow-sm' 
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          }`}
          title="Quote"
        >
          <Quote size={14} />
        </button>
      </div>
      <EditorContent 
        editor={editor} 
        className={`prose prose-sm max-w-none bg-white focus-within:outline-none ${
          isConstrained 
            ? 'flex-1 overflow-y-auto p-2 min-h-0' 
            : 'p-4 min-h-[120px]'
        }`}
      />
    </div>
  )
}
