'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Typography from '@tiptap/extension-typography'
import Focus from '@tiptap/extension-focus'
import Code from '@tiptap/extension-code'
import { useEffect } from 'react'
import { Bold, Italic, List, ListOrdered, Quote, Undo, Redo } from 'lucide-react'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  className?: string
}

export default function RichTextEditor({ 
  content, 
  onChange, 
  placeholder = 'Start typing...', 
  className = '' 
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable code block with syntax highlighting but keep other features
        codeBlock: false,
      }),
      Code, // Keep inline code
      Placeholder.configure({
        placeholder,
      }),
      Typography,
      Focus.configure({
        className: 'has-focus',
        mode: 'all',
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[100px] p-3',
      },
    },
  })

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  if (!editor) {
    return null
  }

  return (
    <div className={`rich-text-editor border border-gray-200 rounded-lg ${className}`}>
      {/* Toolbar */}
      <div className="border-b border-gray-200 p-2 flex items-center gap-1 bg-gray-50 rounded-t-lg">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded hover:bg-gray-200 text-black ${
            editor.isActive('bold') ? 'bg-gray-300' : ''
          }`}
          title="Bold"
        >
          <Bold size={16} strokeWidth={2} className="text-black" />
        </button>
        
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded hover:bg-gray-200 text-black ${
            editor.isActive('italic') ? 'bg-gray-300' : ''
          }`}
          title="Italic"
        >
          <Italic size={16} strokeWidth={2} className="text-black" />
        </button>
        
        <button
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={`p-2 rounded hover:bg-gray-200 text-black ${
            editor.isActive('code') ? 'bg-gray-300' : ''
          }`}
          title="Inline Code"
        >
          <span className="text-sm font-mono text-black font-bold">{'</>'}</span>
        </button>
        
        <div className="w-px h-6 bg-gray-300 mx-1" />
        
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded hover:bg-gray-200 text-black ${
            editor.isActive('bulletList') ? 'bg-gray-300' : ''
          }`}
          title="Bullet List"
        >
          <List size={16} strokeWidth={2} className="text-black" />
        </button>
        
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded hover:bg-gray-200 text-black ${
            editor.isActive('orderedList') ? 'bg-gray-300' : ''
          }`}
          title="Numbered List"
        >
          <ListOrdered size={16} strokeWidth={2} className="text-black" />
        </button>
        
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-2 rounded hover:bg-gray-200 text-black ${
            editor.isActive('blockquote') ? 'bg-gray-300' : ''
          }`}
          title="Quote"
        >
          <Quote size={16} strokeWidth={2} className="text-black" />
        </button>
        
        <div className="w-px h-6 bg-gray-300 mx-1" />
        
        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-black"
          title="Undo"
        >
          <Undo size={16} strokeWidth={2} className={editor.can().undo() ? "text-black" : "text-gray-400"} />
        </button>
        
        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-black"
          title="Redo"
        >
          <Redo size={16} strokeWidth={2} className={editor.can().redo() ? "text-black" : "text-gray-400"} />
        </button>
      </div>
      
      {/* Editor Content */}
      <EditorContent editor={editor} />
    </div>
  )
}