'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import Placeholder from '@tiptap/extension-placeholder'
import Typography from '@tiptap/extension-typography'
import Focus from '@tiptap/extension-focus'
import { createLowlight } from 'lowlight'
import { useEffect } from 'react'
import { Bold, Italic, Strikethrough, List, ListOrdered, Quote, Undo, Redo, Code, FileCode } from 'lucide-react'

// Import common language syntaxes
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import python from 'highlight.js/lib/languages/python'
import java from 'highlight.js/lib/languages/java'
import cpp from 'highlight.js/lib/languages/cpp'
import html from 'highlight.js/lib/languages/xml'
import css from 'highlight.js/lib/languages/css'
import json from 'highlight.js/lib/languages/json'
import bash from 'highlight.js/lib/languages/bash'
import sql from 'highlight.js/lib/languages/sql'

// Create lowlight instance and register languages
const lowlight = createLowlight()
lowlight.register('javascript', javascript)
lowlight.register('typescript', typescript)
lowlight.register('python', python)
lowlight.register('java', java)
lowlight.register('cpp', cpp)
lowlight.register('html', html)
lowlight.register('css', css)
lowlight.register('json', json)
lowlight.register('bash', bash)
lowlight.register('sql', sql)

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
        // Enable code block but we'll replace it with CodeBlockLowlight
        codeBlock: false,
        // Ensure proper paragraph and hard break handling
        paragraph: {
          HTMLAttributes: {
            class: 'paragraph-spacing', // Custom class for paragraph spacing
          },
        },
        hardBreak: {
          keepMarks: false,
          HTMLAttributes: {
            class: 'hard-break',
          },
        },
      }),
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: 'javascript',
        HTMLAttributes: {
          class: 'code-block',
        },
        languageClassPrefix: 'language-',
        exitOnTripleEnter: false,
      }),
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
    immediatelyRender: false, // Fix SSR hydration issues
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      console.log('TipTap HTML output:', html)
      console.log('TipTap JSON output:', editor.getJSON())
      onChange(html)
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none p-3 editor-content',
        style: 'height: 100%; min-height: 100px; overflow-y: auto;',
      },
      handleKeyDown: (view, event) => {
        // Stop all keyboard events from bubbling up
        event.stopPropagation()
        
        // Handle Shift+Enter for hard breaks
        if (event.key === 'Enter' && event.shiftKey) {
          // Let TipTap handle Shift+Enter for hard breaks
          return false
        }
        
        return false // Let TipTap handle the event normally
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
    <div 
      className={`rich-text-editor border border-gray-200 rounded-lg flex flex-col ${className}`}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      onKeyUp={(e) => e.stopPropagation()}
      onKeyPress={(e) => e.stopPropagation()}
      style={{ height: '100%', minHeight: '200px' }}
    >
      {/* Toolbar */}
      <div className="border-b border-gray-200 p-2 flex items-center gap-1 bg-gray-50 rounded-t-lg flex-shrink-0">
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
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-2 rounded hover:bg-gray-200 text-black ${
            editor.isActive('strike') ? 'bg-gray-300' : ''
          }`}
          title="Strikethrough"
        >
          <Strikethrough size={16} strokeWidth={2} className="text-black" />
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
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={`p-2 rounded hover:bg-gray-200 text-black ${
            editor.isActive('code') ? 'bg-gray-300' : ''
          }`}
          title="Code"
        >
          <Code size={16} strokeWidth={2} className="text-black" />
        </button>
        
        <button
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`p-2 rounded hover:bg-gray-200 text-black ${
            editor.isActive('codeBlock') ? 'bg-gray-300' : ''
          }`}
          title="Code Block"
        >
          <FileCode size={16} strokeWidth={2} className="text-black" />
        </button>
        
        {editor.isActive('codeBlock') && (
          <select
            onChange={(e) => {
              const language = e.target.value
              editor.chain().focus().updateAttributes('codeBlock', { language }).run()
            }}
            className="ml-1 px-2 py-1 text-xs border border-gray-300 rounded bg-white text-black"
            value={editor.getAttributes('codeBlock').language || 'javascript'}
          >
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
            <option value="html">HTML</option>
            <option value="css">CSS</option>
            <option value="json">JSON</option>
            <option value="bash">Bash</option>
            <option value="sql">SQL</option>
            <option value="text">Plain Text</option>
          </select>
        )}
        
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
      <div 
        className="flex-1 min-h-0"
        style={{ 
          height: 'calc(100% - 60px)', // Account for toolbar height
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        onKeyUp={(e) => e.stopPropagation()}
        onKeyPress={(e) => e.stopPropagation()}
      >
        <div style={{ height: '100%', overflow: 'auto' }}>
          <EditorContent 
            editor={editor} 
            style={{ height: '100%', minHeight: '100px' }}
          />
        </div>
      </div>
    </div>
  )
}