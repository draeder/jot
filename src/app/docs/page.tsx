import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Book, 
  ArrowLeft, 
  Zap, 
  Shield, 
  Infinity, 
  Search, 
  Edit3,
  GitBranch 
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Documentation - Jot Visual Note Taking',
  description: 'Complete guide to using Jot for visual note-taking. Learn about workspaces, cards, connections, rich text editing, and all features.',
  keywords: ['jot documentation', 'visual notes guide', 'note taking help', 'canvas workspace', 'rich text editor'],
  openGraph: {
    title: 'Jot Documentation - Complete User Guide',
    description: 'Master Jot\'s visual note-taking features with our comprehensive documentation.',
    type: 'website',
    url: 'https://jot-app.com/docs',
    images: [
      {
        url: '/jotlogo.png',
        width: 1200,
        height: 630,
        alt: 'Jot Documentation',
      },
    ],
  },
}

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center text-blue-600 hover:text-blue-700 transition-colors">
                <ArrowLeft size={20} className="mr-2" />
                Back to Jot
              </Link>
              <div className="text-gray-300">|</div>
              <div className="flex items-center space-x-3">
                <Book className="text-blue-600" size={24} />
                <span className="text-xl font-semibold text-gray-900">Documentation</span>
              </div>
            </div>
            <Link 
              href="/auth/signin"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Jot Documentation
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Complete guide to mastering visual note-taking with Jot. 
            Learn every feature and become a productivity powerhouse.
          </p>
        </div>
      </section>

      {/* Quick Start */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Quick Start Guide</h2>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h3 className="text-xl font-semibold text-blue-900 mb-4">Your First Steps</h3>
            <ol className="list-decimal list-inside space-y-3 text-gray-700">
              <li><strong>Sign In</strong>: Enter any name to get started - no account creation needed</li>
              <li><strong>Default Workspace</strong>: A &quot;My First Workspace&quot; is automatically created for new users</li>
              <li><strong>Create Your First Card</strong>: Click the &quot;Add Card&quot; button in the toolbar or double-click anywhere on the canvas</li>
              <li><strong>Start Typing</strong>: Click on any card to begin editing with rich text formatting</li>
            </ol>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Core Features</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <Infinity className="text-blue-600 mt-1 flex-shrink-0" size={20} />
                  <div>
                    <strong>Infinite Canvas</strong>: Unlimited workspace with zoom and pan controls
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Edit3 className="text-green-600 mt-1 flex-shrink-0" size={20} />
                  <div>
                    <strong>Rich Text Cards</strong>: Full formatting, code highlighting, images, and task lists
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <GitBranch className="text-purple-600 mt-1 flex-shrink-0" size={20} />
                  <div>
                    <strong>Visual Connections</strong>: Connect cards with arrows to show relationships
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Search className="text-orange-600 mt-1 flex-shrink-0" size={20} />
                  <div>
                    <strong>Global Search</strong>: Find content across all workspaces instantly
                  </div>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Privacy & Storage</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <Shield className="text-red-600 mt-1 flex-shrink-0" size={20} />
                  <div>
                    <strong>Local Storage</strong>: All data stored in your browser using IndexedDB
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Zap className="text-yellow-600 mt-1 flex-shrink-0" size={20} />
                  <div>
                    <strong>No Servers</strong>: Complete privacy with no data sent to external servers
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Shield className="text-blue-600 mt-1 flex-shrink-0" size={20} />
                  <div>
                    <strong>Offline Ready</strong>: Works without internet after initial load
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Sections */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">Key Features</h2>

          {/* Workspaces */}
          <div className="mb-12">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6">Workspace Management</h3>
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <p className="text-gray-600 mb-4">
                Workspaces are your organizational containers - each one is a separate canvas for different projects or topics.
              </p>
              
              <h4 className="font-semibold text-lg mb-3">Creating & Managing Workspaces:</h4>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-4">
                <li>Click the &quot;New Workspace&quot; button in the sidebar</li>
                <li>Enter a descriptive name</li>
                <li>Press Enter or click the checkmark to save</li>
                <li>Your new workspace appears in the sidebar list</li>
              </ol>

              <h4 className="font-semibold text-lg mb-3">Workspace Operations:</h4>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li><strong>Rename</strong>: Click the edit icon next to any workspace name</li>
                <li><strong>Delete</strong>: Click the trash icon (with confirmation dialog)</li>
                <li><strong>Reorder</strong>: Use the grip handle to drag workspaces up/down in the list</li>
                <li><strong>Select</strong>: Click any workspace to switch to it (auto-saves your position)</li>
              </ul>
            </div>
          </div>

          {/* Cards */}
          <div className="mb-12">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6">Cards - Your Content Containers</h3>
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <p className="text-gray-600 mb-4">
                Cards are the fundamental building blocks of your visual workspace. Each card can contain rich text, code, images, and more.
              </p>
              
              <h4 className="font-semibold text-lg mb-3">Creating Cards:</h4>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-4">
                <li>Click &quot;Add Card&quot; in the toolbar</li>
                <li><strong>Double-click anywhere on empty canvas</strong> to create a card at that location</li>
                <li>New card appears at the center of your current view (toolbar) or at click location (double-click)</li>
                <li>Automatically enters edit mode for immediate typing</li>
                <li>Default size: 300x200 pixels</li>
              </ol>

              <h4 className="font-semibold text-lg mb-3">Card Components:</h4>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li><strong>Title Bar</strong>: Contains title, edit button, save/cancel buttons</li>
                <li><strong>Content Area</strong>: Rich text editor with full formatting</li>
                <li><strong>Resize Handle</strong>: Bottom-right corner for manual resizing</li>
                <li><strong>Drag Handle</strong>: Grip icon in title bar for moving</li>
              </ul>
            </div>
          </div>

          {/* Rich Text Editing */}
          <div className="mb-12">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6">Rich Text Editing</h3>
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <p className="text-gray-600 mb-4">
                Jot includes a powerful rich text editor with comprehensive formatting options, code highlighting, and media support.
              </p>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-lg mb-3">Basic Formatting:</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                    <li><strong>Bold</strong>: Ctrl/Cmd+B or toolbar button</li>
                    <li><strong>Italic</strong>: Ctrl/Cmd+I or toolbar button</li>
                    <li><strong>Strikethrough</strong>: Toolbar button</li>
                    <li><strong>Inline Code</strong>: Toolbar &lt;/&gt; button for code snippets</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-lg mb-3">Paragraph Formatting:</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                    <li><strong>Headings</strong>: H1, H2, H3 options</li>
                    <li><strong>Blockquotes</strong>: For emphasized text or citations</li>
                    <li><strong>Normal Paragraph</strong>: Default text formatting</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-lg mb-3">Lists:</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                    <li><strong>Bullet Lists</strong>: Unordered lists with disc bullets</li>
                    <li><strong>Numbered Lists</strong>: Ordered lists with automatic numbering</li>
                    <li><strong>Task Lists</strong>: Interactive checkboxes for to-do items</li>
                    <li><strong>Nested Lists</strong>: Multi-level organization supported</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-lg mb-3">Code Support:</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                    <li><strong>Inline Code</strong>: Monospace with gray background</li>
                    <li><strong>Code Blocks</strong>: Full syntax highlighting</li>
                    <li><strong>10+ Languages</strong>: JavaScript, Python, Java, C++, HTML, CSS, JSON, SQL, and more</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Connections */}
          <div className="mb-12">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6">Card Connections</h3>
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <p className="text-gray-600 mb-4">
                Create visual relationships between cards using arrows and lines to show how ideas connect.
              </p>
              
              <h4 className="font-semibold text-lg mb-3">Connection Process:</h4>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-4">
                <li>Click &quot;Connect&quot; button in toolbar (turns orange)</li>
                <li>Click on the first card you want to connect</li>
                <li>Click on the second card to complete the connection</li>
                <li>Arrow appears connecting the two cards</li>
                <li>Click &quot;Cancel Connect&quot; or Connect button again to exit mode</li>
              </ol>

              <h4 className="font-semibold text-lg mb-3">Use Cases:</h4>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li><strong>Process Flows</strong>: Show step-by-step workflows</li>
                <li><strong>Mind Maps</strong>: Connect related concepts</li>
                <li><strong>Project Dependencies</strong>: Show task relationships</li>
                <li><strong>Knowledge Graphs</strong>: Link related information</li>
              </ul>
            </div>
          </div>

          {/* Navigation */}
          <div className="mb-12">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6">Canvas Navigation & View Controls</h3>
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-lg mb-3">Panning (Moving Around):</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                    <li><strong>Mouse</strong>: Click and drag empty canvas area</li>
                    <li><strong>Touch</strong>: Touch and drag on mobile devices</li>
                    <li><strong>Keyboard</strong>: Arrow keys for fine movement</li>
                    <li><strong>Auto-Save</strong>: Pan position saved per workspace</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-lg mb-3">Zoom Controls:</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                    <li><strong>Zoom In/Out</strong>: Buttons in toolbar (+ and - icons)</li>
                    <li><strong>Mouse Wheel</strong>: Scroll to zoom in/out</li>
                    <li><strong>Zoom Range</strong>: 10% to 300% magnification</li>
                    <li><strong>Reset Zoom</strong>: 100% button in toolbar</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="mb-12">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6">Global Search</h3>
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <p className="text-gray-600 mb-4">
                Find content across all your workspaces instantly with powerful search capabilities.
              </p>
              
              <h4 className="font-semibold text-lg mb-3">Search Features:</h4>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li><strong>Global</strong>: Searches across ALL your workspaces</li>
                <li><strong>Real-time</strong>: Results update as you type</li>
                <li><strong>Content Types</strong>: Card titles and content text</li>
                <li><strong>Instant Access</strong>: Located in header for quick access</li>
                <li><strong>Smart Navigation</strong>: Click any result to jump directly to that card</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Keyboard Shortcuts */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Keyboard Shortcuts</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Text Formatting</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-sm bg-gray-200 px-2 py-1 rounded">Ctrl/Cmd+B</span>
                  <span className="text-gray-700">Bold text</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-mono text-sm bg-gray-200 px-2 py-1 rounded">Ctrl/Cmd+I</span>
                  <span className="text-gray-700">Italic text</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-mono text-sm bg-gray-200 px-2 py-1 rounded">Ctrl/Cmd+Z</span>
                  <span className="text-gray-700">Undo</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-mono text-sm bg-gray-200 px-2 py-1 rounded">Ctrl/Cmd+Y</span>
                  <span className="text-gray-700">Redo</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">List Management</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-sm bg-gray-200 px-2 py-1 rounded">Tab</span>
                  <span className="text-gray-700">Indent list item</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-mono text-sm bg-gray-200 px-2 py-1 rounded">Shift+Tab</span>
                  <span className="text-gray-700">Unindent list item</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-mono text-sm bg-gray-200 px-2 py-1 rounded">Enter</span>
                  <span className="text-gray-700">New list item</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-mono text-sm bg-gray-200 px-2 py-1 rounded">Escape</span>
                  <span className="text-gray-700">Exit edit mode</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to start creating?</h2>
          <p className="text-xl mb-8 text-blue-100">
            Put this knowledge into practice with your own visual workspace.
          </p>
          <Link 
            href="/auth/signin"
            className="bg-white text-blue-600 px-8 py-4 rounded-lg hover:bg-gray-100 transition-colors font-medium text-lg inline-flex items-center gap-2"
          >
            Get Started for Free
            <Edit3 size={20} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Image 
              src="/jotlogo.png" 
              alt="Jot Logo" 
              width={32} 
              height={32}
              className="object-contain"
            />
            <span className="text-xl font-bold">Jot</span>
          </div>
          <p className="text-gray-400 mb-4">
            Visual note-taking workspace for creative minds.
          </p>
          <div className="flex justify-center space-x-6">
            <Link href="/" className="text-gray-400 hover:text-white transition-colors">Home</Link>
            <Link href="/docs" className="text-gray-400 hover:text-white transition-colors">Documentation</Link>
            <a href="https://buymeacoffee.com/jot" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
