'use client'

import { useState, useEffect } from 'react'
import { X, ChevronDown, ChevronRight, Book, Search, HelpCircle } from 'lucide-react'

interface DocsModalProps {
  isOpen: boolean
  onClose: () => void
}

interface Section {
  id: string
  title: string
  content: string | React.ReactNode
  subsections?: Section[]
}

const docsContent: Section[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    content: (
      <div className="space-y-4">
        <p className="text-lg">Welcome to Jot - your visual note-taking workspace! This guide will help you understand every feature and capability.</p>
        <p>Jot is designed for visual thinking, allowing you to create, organize, and connect ideas in an infinite canvas environment.</p>
      </div>
    ),
    subsections: [
      {
        id: 'first-steps',
        title: 'Your First Steps',
        content: (
          <div>
            <ol className="list-decimal list-inside space-y-2">
              <li><strong>Sign In</strong>: Choose from multiple authentication options (Google, GitHub, Apple, Microsoft, or Local)</li>
              <li><strong>Default Workspace</strong>: A &quot;My First Workspace&quot; is automatically created for new users</li>
              <li><strong>Create Your First Card</strong>: Click the &quot;Add Card&quot; button in the toolbar</li>
              <li><strong>Start Typing</strong>: Click on any card to begin editing with rich text</li>
            </ol>
          </div>
        )
      },
      {
        id: 'interface-overview',
        title: 'Interface Overview',
        content: (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-lg mb-2">Header Bar:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Jot logo and branding</li>
                <li>Global search (searches across ALL workspaces)</li>
                <li>User profile and sign-out button</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Sidebar (Left):</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Workspace list with drag-to-reorder</li>
                <li>Create new workspace button</li>
                <li>Workspace-specific undo/redo actions</li>
                <li>Workspace management (rename, delete)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Main Canvas:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Infinite scrollable workspace</li>
                <li><strong>Double-click anywhere to create a new card</strong></li>
                <li>Grid overlay (dots, lines, or off)</li>
                <li>Zoom controls (10% to 300%)</li>
                <li>Card creation and management area</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Toolbar (Top of Canvas):</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Add Card button</li>
                <li>Connect mode toggle</li>
                <li>Delete selected card</li>
                <li>Canvas undo/redo</li>
                <li>Grid and snap controls</li>
                <li>Zoom controls</li>
                <li>Reset view button</li>
              </ul>
            </div>
          </div>
        )
      }
    ]
  },
  {
    id: 'authentication',
    title: 'Authentication & Account Management',
    content: `Jot supports multiple authentication providers for flexible access to your notes.`,
    subsections: [
      {
        id: 'auth-providers',
        title: 'Supported Providers',
        content: (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-lg mb-2">OAuth Providers:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Google</strong>: Sign in with your Google account</li>
                <li><strong>GitHub</strong>: Use your GitHub credentials</li>
                <li><strong>Apple</strong>: Apple ID authentication</li>
                <li><strong>Microsoft</strong>: Corporate/organizational accounts</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Local Authentication:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Local-only</strong>: Enter any name, no external account required</li>
                <li>Perfect for testing or when you prefer not to use OAuth</li>
                <li>Data remains local to your browser</li>
              </ul>
            </div>
          </div>
        )
      },
      {
        id: 'data-privacy',
        title: 'Data Storage & Privacy',
        content: (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-lg mb-2">Local Storage:</h4>
              <p className="mb-2">All your data is stored locally in your browser using IndexedDB</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>No server-side data storage</li>
                <li>Complete privacy and control</li>
                <li>Works offline after initial load</li>
                <li>Data persists across browser sessions</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">User Data Stored:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>User profile (email, name, image from auth provider)</li>
                <li>Workspace definitions and organization</li>
                <li>All cards and their content</li>
                <li>Card positions and sizes</li>
                <li>Connections between cards</li>
                <li>View preferences (zoom, grid settings)</li>
              </ul>
            </div>
            <div>
              <p><strong>Data Portability</strong>: Currently stored locally; future versions may include export/import features</p>
            </div>
          </div>
        )
      }
    ]
  },
  {
    id: 'workspaces',
    title: 'Workspace Management',
    content: `Workspaces are your organizational containers - each one is a separate canvas for different projects or topics.`,
    subsections: [
      {
        id: 'creating-workspaces',
        title: 'Creating & Managing Workspaces',
        content: (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-lg mb-2">Creating New Workspaces:</h4>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>Click the &quot;New Workspace&quot; button in the sidebar</li>
                <li>Enter a descriptive name</li>
                <li>Press Enter or click the checkmark to save</li>
                <li>Your new workspace appears in the sidebar list</li>
              </ol>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Workspace Operations:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Rename</strong>: Click the edit icon next to any workspace name</li>
                <li><strong>Delete</strong>: Click the trash icon (with confirmation dialog)</li>
                <li><strong>Reorder</strong>: Use the grip handle to drag workspaces up/down in the list</li>
                <li><strong>Select</strong>: Click any workspace to switch to it (auto-saves your position)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Workspace Features:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Each workspace maintains its own view state (zoom, pan position)</li>
                <li>Independent undo/redo history per workspace</li>
                <li>Cards and connections are workspace-specific</li>
                <li>Last active workspace is remembered when you return</li>
              </ul>
            </div>
          </div>
        )
      },
      {
        id: 'workspace-navigation',
        title: 'Navigation & View Management',
        content: (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-lg mb-2">Switching Between Workspaces:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Click any workspace in the sidebar</li>
                <li>Your view position is saved automatically</li>
                <li>Each workspace remembers its zoom level and pan offset</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">View Persistence:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Pan position (where you&apos;ve scrolled)</li>
                <li>Zoom level (10% to 300%)</li>
                <li>Grid display preferences</li>
                <li>Snap-to-grid settings</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Auto-Reset Feature:</h4>
              <p>When switching workspaces, the view automatically resets to show your content optimally after a brief delay.</p>
            </div>
          </div>
        )
      },
      {
        id: 'workspace-undo-redo',
        title: 'Workspace-Level Undo/Redo',
        content: (
          <div className="space-y-4">
            <p>The sidebar includes workspace-specific undo/redo that tracks:</p>
            <div>
              <h4 className="font-semibold text-lg mb-2">Workspace Operations:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Creating new workspaces</li>
                <li>Deleting workspaces (with full restoration of cards/connections)</li>
                <li>Renaming workspaces</li>
                <li>Reordering workspaces</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Undo/Redo Buttons:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Located in the sidebar above the workspace list</li>
                <li>Show count of available actions</li>
                <li>Disabled when no actions are available</li>
                <li>Independent from canvas-level undo/redo</li>
              </ul>
            </div>
          </div>
        )
      }
    ]
  },
  {
    id: 'cards',
    title: 'Cards - Your Content Containers',
    content: `Cards are the fundamental building blocks of your visual workspace. Each card can contain rich text, code, images, and more.`,
    subsections: [
      {
        id: 'creating-cards',
        title: 'Creating & Basic Operations',
        content: (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-lg mb-2">Creating Cards:</h4>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>Click &quot;Add Card&quot; in the toolbar</li>
                <li><strong>Double-click anywhere on empty canvas</strong> to create a card at that location</li>
                <li>New card appears at the center of your current view (toolbar) or at click location (double-click)</li>
                <li>Automatically enters edit mode for immediate typing</li>
                <li>Default size: 300x200 pixels</li>
              </ol>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Card Components:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Title Bar</strong>: Contains title, edit button, save/cancel buttons</li>
                <li><strong>Content Area</strong>: Rich text editor with full formatting</li>
                <li><strong>Resize Handle</strong>: Bottom-right corner for manual resizing</li>
                <li><strong>Drag Handle</strong>: Grip icon in title bar for moving</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Card States:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>View Mode</strong>: Display formatted content, click to select</li>
                <li><strong>Edit Mode</strong>: Active rich text editor with toolbar</li>
                <li><strong>Selected</strong>: Blue border indicates selection</li>
                <li><strong>Connecting</strong>: Special cursor when in connection mode</li>
              </ul>
            </div>
          </div>
        )
      },
      {
        id: 'card-editing',
        title: 'Editing Cards',
        content: (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-lg mb-2">Entering Edit Mode:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Click the edit button (pencil icon)</li>
                <li>Click directly on the card title</li>
                <li>Click in the content area</li>
                <li>Double-click anywhere on the card</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Edit Mode Features:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Rich text toolbar appears at top of card</li>
                <li>Full formatting options available</li>
                <li>Auto-saves changes as you type</li>
                <li>Click outside card or press Escape to exit</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Title Editing:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Click directly on the title text</li>
                <li>Inline editing with immediate feedback</li>
                <li>Auto-saves on blur or Enter key</li>
                <li>Empty titles display as &quot;Untitled Card&quot;</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Content Editing:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Full rich text editor with comprehensive formatting</li>
                <li>All formatting preserved in edit and view modes</li>
                <li>Supports text selection, copy/paste</li>
                <li>Keyboard shortcuts for common formatting</li>
              </ul>
            </div>
          </div>
        )
      },
      {
        id: 'card-positioning',
        title: 'Positioning & Sizing',
        content: (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-lg mb-2">Moving Cards:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Use the grip handle (vertical dots) in the title bar</li>
                <li>Drag to any position on the infinite canvas</li>
                <li>Position persists when you switch workspaces</li>
                <li>Snap-to-grid option available</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Resizing Cards:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Drag the resize handle in bottom-right corner</li>
                <li>Minimum size: 200x150 pixels</li>
                <li>Respects snap-to-grid when enabled</li>
                <li>Content automatically reflows</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Snap-to-Grid:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Toggle in the toolbar</li>
                <li>20-pixel grid alignment</li>
                <li>Affects both positioning and sizing</li>
                <li>Visual grid overlay shows alignment points</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Position Memory:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Each card remembers its exact position</li>
                <li>Positions saved automatically</li>
                <li>Restored when revisiting workspace</li>
              </ul>
            </div>
          </div>
        )
      },
      {
        id: 'card-deletion',
        title: 'Deleting Cards',
        content: (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-lg mb-2">Selection Required:</h4>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>Click on a card to select it (blue border appears)</li>
                <li>Click the &quot;Delete&quot; button in the toolbar</li>
                <li>Card is immediately removed</li>
              </ol>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Undo Support:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Deleted cards can be restored with Undo</li>
                <li>Preserves all content, formatting, and connections</li>
                <li>Undo available until you perform other actions</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Connection Cleanup:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>All connections to/from deleted cards are automatically removed</li>
                <li>Connection deletions are also tracked in undo history</li>
              </ul>
            </div>
          </div>
        )
      }
    ]
  },
  {
    id: 'rich-text',
    title: 'Rich Text Editing',
    content: `
Jot includes a powerful rich text editor with comprehensive formatting options, code highlighting, and media support.
    `,
    subsections: [
      {
        id: 'text-formatting',
        title: 'Text Formatting Options',
        content: (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-lg mb-2">Basic Formatting:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Bold</strong>: Ctrl/Cmd+B or toolbar button</li>
                <li><strong>Italic</strong>: Ctrl/Cmd+I or toolbar button</li>
                <li><strong>Strikethrough</strong>: Toolbar button</li>
                <li><strong>Inline Code</strong>: Toolbar &lt;/&gt; button for code snippets</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Paragraph Formatting:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Headings</strong>: H1, H2, H3 options</li>
                <li><strong>Blockquotes</strong>: For emphasized text or citations</li>
                <li><strong>Normal Paragraph</strong>: Default text formatting</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Lists:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Bullet Lists</strong>: Unordered lists with disc bullets</li>
                <li><strong>Numbered Lists</strong>: Ordered lists with automatic numbering</li>
                <li><strong>Task Lists</strong>: Interactive checkboxes for to-do items</li>
                <li><strong>Nested Lists</strong>: Multi-level organization supported</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Special Elements:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Hard Breaks</strong>: Shift+Enter for line breaks within paragraphs</li>
                <li><strong>Horizontal Rules</strong>: Visual separators</li>
                <li><strong>Links</strong>: Automatic link detection and formatting</li>
              </ul>
            </div>
          </div>
        )
      },
      {
        id: 'code-support',
        title: 'Code & Programming Support',
        content: (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-lg mb-2">Inline Code:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Use the code button for short code snippets</li>
                <li>Monospace font with gray background</li>
                <li>Perfect for variable names, functions, file paths</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Code Blocks:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Full syntax highlighting for multiple languages</li>
                <li>Language selection dropdown when code block is active</li>
                <li>Professional styling with proper indentation</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Supported Languages:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>JavaScript / TypeScript</li>
                <li>Python</li>
                <li>Java</li>
                <li>C++</li>
                <li>HTML / XML</li>
                <li>CSS</li>
                <li>JSON</li>
                <li>Bash / Shell</li>
                <li>SQL</li>
                <li>Plain Text</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Code Block Features:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Line-by-line syntax highlighting</li>
                <li>Proper indentation preservation</li>
                <li>Copy-friendly formatting</li>
                <li>Professional color scheme</li>
                <li>Scroll support for long code</li>
              </ul>
            </div>
          </div>
        )
      },
      {
        id: 'images-media',
        title: 'Images & Media',
        content: (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-lg mb-2">Image Support:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Drag & drop images directly into cards</li>
                <li>Paste images from clipboard</li>
                <li>Automatic base64 encoding for local storage</li>
                <li>Resizable images with handles</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Image Features:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Resize Handles</strong>: Click and drag to resize</li>
                <li><strong>Aspect Ratio</strong>: Maintained during resize</li>
                <li><strong>Responsive</strong>: Automatically scales to card width</li>
                <li><strong>Styling</strong>: Rounded corners and subtle shadows</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Image Formats:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>JPEG, PNG, GIF, WebP supported</li>
                <li>Base64 encoding for local storage</li>
                <li>No external dependencies required</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Placeholder Images:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Toolbar includes placeholder image button</li>
                <li>Useful for layout planning</li>
                <li>Can be replaced with real images later</li>
              </ul>
            </div>
          </div>
        )
      },
      {
        id: 'task-lists',
        title: 'Interactive Task Lists',
        content: (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-lg mb-2">Creating Task Lists:</h4>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>Click the checklist button in toolbar</li>
                <li>Type your task items</li>
                <li>Press Enter for new task items</li>
                <li>Checkboxes are automatically added</li>
              </ol>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Task Features:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Interactive Checkboxes</strong>: Click to mark complete/incomplete</li>
                <li><strong>Visual Feedback</strong>: Completed items show strikethrough</li>
                <li><strong>Nested Tasks</strong>: Create sub-tasks with indentation</li>
                <li><strong>Persistence</strong>: Checkbox states are saved</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Task List Shortcuts:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><kbd className="px-2 py-1 bg-gray-100 rounded text-sm">Enter</kbd>: Create new task item</li>
                <li><kbd className="px-2 py-1 bg-gray-100 rounded text-sm">Tab</kbd>: Indent task (create sub-task)</li>
                <li><kbd className="px-2 py-1 bg-gray-100 rounded text-sm">Shift+Tab</kbd>: Unindent task</li>
                <li><kbd className="px-2 py-1 bg-gray-100 rounded text-sm">Backspace</kbd> on empty task: Remove task item</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Use Cases:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Project to-do lists</li>
                <li>Meeting action items</li>
                <li>Feature checklists</li>
                <li>Research tasks</li>
              </ul>
            </div>
          </div>
        )
      },
      {
        id: 'editor-shortcuts',
        title: 'Keyboard Shortcuts',
        content: (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-lg mb-3">Formatting Shortcuts:</h4>
              <div className="grid grid-cols-1 gap-2">
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="font-mono text-sm bg-gray-200 px-2 py-1 rounded">Ctrl/Cmd+B</span>
                  <span>Bold text</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="font-mono text-sm bg-gray-200 px-2 py-1 rounded">Ctrl/Cmd+I</span>
                  <span>Italic text</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="font-mono text-sm bg-gray-200 px-2 py-1 rounded">Ctrl/Cmd+Z</span>
                  <span>Undo</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="font-mono text-sm bg-gray-200 px-2 py-1 rounded">Ctrl/Cmd+Y</span>
                  <span>Redo</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-3">List Shortcuts:</h4>
              <div className="grid grid-cols-1 gap-2">
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="font-mono text-sm bg-gray-200 px-2 py-1 rounded">Tab</span>
                  <span>Indent list item</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="font-mono text-sm bg-gray-200 px-2 py-1 rounded">Shift+Tab</span>
                  <span>Unindent list item</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="font-mono text-sm bg-gray-200 px-2 py-1 rounded">Enter</span>
                  <span>New list item</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="font-mono text-sm bg-gray-200 px-2 py-1 rounded">Backspace</span>
                  <span>Exit list (on empty item)</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-3">Special Keys:</h4>
              <div className="grid grid-cols-1 gap-2">
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="font-mono text-sm bg-gray-200 px-2 py-1 rounded">Shift+Enter</span>
                  <span>Hard line break</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="font-mono text-sm bg-gray-200 px-2 py-1 rounded">Escape</span>
                  <span>Exit edit mode</span>
                </div>
              </div>
            </div>
          </div>
        )
      }
    ]
  },
  {
    id: 'connections',
    title: 'Card Connections',
    content: `
Create visual relationships between cards using arrows and lines to show how ideas connect.
    `,
    subsections: [
      {
        id: 'creating-connections',
        title: 'Creating Connections',
        content: (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-lg mb-2">Connection Process:</h4>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>Click &quot;Connect&quot; button in toolbar (turns orange)</li>
                <li>Click on the first card you want to connect</li>
                <li>Click on the second card to complete the connection</li>
                <li>Arrow appears connecting the two cards</li>
                <li>Click &quot;Cancel Connect&quot; or Connect button again to exit mode</li>
              </ol>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Connection Types:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Arrows</strong>: Directional connections showing flow or relationship</li>
                <li><strong>Visual Feedback</strong>: Smooth curved lines between card centers</li>
                <li><strong>Automatic Routing</strong>: Connections update when cards move</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Connection States:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Creating</strong>: Orange connect button, crosshair cursor</li>
                <li><strong>Active</strong>: Visible arrow connections between cards</li>
                <li><strong>Hoverable</strong>: Click connections to delete them</li>
              </ul>
            </div>
          </div>
        )
      },
      {
        id: 'managing-connections',
        title: 'Managing Connections',
        content: (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-lg mb-2">Deleting Connections:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Click directly on any connection arrow</li>
                <li>Immediate deletion with undo support</li>
                <li>All connections to deleted cards are auto-removed</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Connection Behavior:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Dynamic</strong>: Automatically adjust when cards are moved</li>
                <li><strong>Persistent</strong>: Saved with workspace data</li>
                <li><strong>Visual</strong>: Clear arrows show direction and relationship</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Connection Limitations:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>One connection per card pair (no duplicate connections)</li>
                <li>Unidirectional arrows (from first clicked to second clicked)</li>
                <li>No connection styling options (consistent visual design)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Use Cases:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Process Flows</strong>: Show step-by-step workflows</li>
                <li><strong>Mind Maps</strong>: Connect related concepts</li>
                <li><strong>Project Dependencies</strong>: Show task relationships</li>
                <li><strong>Knowledge Graphs</strong>: Link related information</li>
              </ul>
            </div>
          </div>
        )
      }
    ]
  },
  {
    id: 'canvas-navigation',
    title: 'Canvas Navigation & View Controls',
    content: `
Navigate your infinite workspace with precision using zoom, pan, and smart view management.
    `,
    subsections: [
      {
        id: 'pan-zoom',
        title: 'Pan & Zoom Controls',
        content: (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-lg mb-2">Panning (Moving Around):</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Mouse</strong>: Click and drag empty canvas area</li>
                <li><strong>Touch</strong>: Touch and drag on mobile devices</li>
                <li><strong>Keyboard</strong>: Arrow keys for fine movement</li>
                <li><strong>Auto-Save</strong>: Pan position saved per workspace</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Zoom Controls:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Zoom In/Out</strong>: Buttons in toolbar (+ and - icons)</li>
                <li><strong>Mouse Wheel</strong>: Scroll to zoom in/out</li>
                <li><strong>Zoom Range</strong>: 10% to 300% magnification</li>
                <li><strong>Reset Zoom</strong>: 100% button in toolbar</li>
                <li><strong>Zoom Center</strong>: Zooms toward center of current view</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">View Memory:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Each workspace remembers its zoom level</li>
                <li>Pan position preserved when switching workspaces</li>
                <li>Settings persist across browser sessions</li>
              </ul>
            </div>
          </div>
        )
      },
      {
        id: 'grid-system',
        title: 'Grid System & Alignment',
        content: (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-lg mb-2">Grid Display Options:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Off</strong>: No visual grid (default for clean look)</li>
                <li><strong>Dots</strong>: Subtle dot grid for reference</li>
                <li><strong>Lines</strong>: Full line grid for precise alignment</li>
                <li><strong>Toggle</strong>: Cycle through options with grid button</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Snap-to-Grid:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Toggle</strong>: Enable/disable with switch in toolbar</li>
                <li><strong>Grid Size</strong>: 20-pixel alignment</li>
                <li><strong>Affects</strong>: Both card positioning and resizing</li>
                <li><strong>Visual Feedback</strong>: Grid overlay shows snap points</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Grid Benefits:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Alignment</strong>: Perfect card alignment</li>
                <li><strong>Consistency</strong>: Uniform spacing and sizing</li>
                <li><strong>Organization</strong>: Clean, structured layouts</li>
                <li><strong>Precision</strong>: Exact positioning for detailed work</li>
              </ul>
            </div>
          </div>
        )
      },
      {
        id: 'view-management',
        title: 'Smart View Management',
        content: (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-lg mb-2">Reset View:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>&quot;Reset&quot; button in toolbar</li>
                <li>Automatically centers and zooms to show all cards</li>
                <li>Optimal zoom level for current content</li>
                <li>Perfect for getting oriented in large workspaces</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Page Indicators:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Directional Arrows</strong>: Appear when cards exist off-screen</li>
                <li><strong>Smart Positioning</strong>: Shows direction of hidden content</li>
                <li><strong>One-Click Navigation</strong>: Click arrows to jump to content</li>
                <li><strong>Auto-Hide</strong>: Only visible when needed</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">View States:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Empty Workspace</strong>: Centered welcome message</li>
                <li><strong>Content View</strong>: Optimized for your cards</li>
                <li><strong>Navigation Mode</strong>: Clear indicators for off-screen content</li>
                <li><strong>Connection View</strong>: Optimized to show relationships</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Auto-Navigation:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>When switching workspaces with existing content</li>
                <li>After creating connections between distant cards</li>
                <li>When jumping to search results in other workspaces</li>
              </ul>
            </div>
          </div>
        )
      }
    ]
  },
  {
    id: 'search',
    title: 'Global Search',
    content: `
Find content across all your workspaces instantly with powerful search capabilities.
    `,
    subsections: [
      {
        id: 'search-basics',
        title: 'Search Functionality',
        content: (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-lg mb-2">Search Scope:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Global</strong>: Searches across ALL your workspaces</li>
                <li><strong>Real-time</strong>: Results update as you type</li>
                <li><strong>Content Types</strong>: Card titles and content text</li>
                <li><strong>Instant Access</strong>: Located in header for quick access</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Search Process:</h4>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>Click in the search box (header area)</li>
                <li>Type your search query</li>
                <li>Results appear in dropdown instantly</li>
                <li>Click any result to navigate directly to that card</li>
              </ol>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Search Features:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Debounced</strong>: 300ms delay prevents excessive searching</li>
                <li><strong>Live Results</strong>: No need to press Enter</li>
                <li><strong>Auto-Complete</strong>: Dropdown with formatted results</li>
                <li><strong>Quick Access</strong>: Search while in any workspace</li>
              </ul>
            </div>
          </div>
        )
      },
      {
        id: 'search-results',
        title: 'Understanding Search Results',
        content: (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-lg mb-2">Result Display:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Workspace Name</strong>: Shows which workspace contains the match</li>
                <li><strong>Card Title</strong>: The title of the matching card</li>
                <li><strong>Match Type</strong>: &quot;Title&quot; badge for title matches</li>
                <li><strong>Content Snippets</strong>: Preview of matching content</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Result Prioritization:</h4>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li><strong>Title Matches</strong>: Appear first (marked with &quot;Title&quot; badge)</li>
                <li><strong>Content Matches</strong>: Show relevant snippets</li>
                <li><strong>Alphabetical</strong>: Within match types, sorted by workspace then card title</li>
                <li><strong>Limited Results</strong>: Top 10 matches shown for performance</li>
              </ol>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Match Highlighting:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Yellow Background</strong>: Search terms highlighted in results</li>
                <li><strong>Context</strong>: Snippets show text around the match</li>
                <li><strong>Ellipsis</strong>: Indicates truncated content</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Navigation:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Click any result to instantly jump to that card</li>
                <li>Automatically switches workspaces if needed</li>
                <li>Card is focused and highlighted when you arrive</li>
              </ul>
            </div>
          </div>
        )
      },
      {
        id: 'search-tips',
        title: 'Search Tips & Best Practices',
        content: (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-lg mb-2">Effective Searching:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Keywords</strong>: Use distinctive words for better matches</li>
                <li><strong>Partial Matches</strong>: Search works with incomplete words</li>
                <li><strong>Case Insensitive</strong>: No need to worry about capitalization</li>
                <li><strong>Content Search</strong>: Searches inside formatted text, ignoring HTML</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Search Strategies:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Project Names</strong>: Search workspace or card titles</li>
                <li><strong>Concepts</strong>: Find cards by main topics</li>
                <li><strong>Code Terms</strong>: Locate specific functions or variables</li>
                <li><strong>Task Items</strong>: Find specific to-do items</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Performance Notes:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Local Search</strong>: All searching happens in your browser</li>
                <li><strong>Privacy</strong>: No search data sent to servers</li>
                <li><strong>Speed</strong>: Optimized for large numbers of cards</li>
                <li><strong>Memory</strong>: Efficient for extensive workspaces</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Limitations:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Text Only</strong>: Doesn&apos;t search image content</li>
                <li><strong>Exact Text</strong>: Searches rendered text, not formatting codes</li>
                <li><strong>Current User</strong>: Only searches your own workspaces</li>
              </ul>
            </div>
          </div>
        )
      }
    ]
  },
  {
    id: 'undo-redo',
    title: 'Undo & Redo System',
    content: `
Comprehensive undo/redo system tracks all your actions with precision and reliability.
    `,
    subsections: [
      {
        id: 'canvas-undo',
        title: 'Canvas-Level Undo/Redo',
        content: (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-lg mb-2">Canvas Actions Tracked:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Card Creation</strong>: Creating new cards</li>
                <li><strong>Card Deletion</strong>: Removing cards (with full restoration)</li>
                <li><strong>Card Updates</strong>: Title and content changes</li>
                <li><strong>Card Movement</strong>: Position changes from dragging</li>
                <li><strong>Connection Creation</strong>: Making new connections</li>
                <li><strong>Connection Deletion</strong>: Removing connections</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Undo/Redo Controls:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Toolbar Buttons</strong>: Located in main canvas toolbar</li>
                <li><strong>Action Counts</strong>: Show number of available undo/redo actions</li>
                <li><strong>Visual Feedback</strong>: Buttons disabled when no actions available</li>
                <li><strong>Tooltips</strong>: Hover for action count information</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Action Scope:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Per Workspace</strong>: Each workspace has independent undo history</li>
                <li><strong>Session Based</strong>: History resets when you reload the page</li>
                <li><strong>Comprehensive</strong>: Captures all state for perfect restoration</li>
              </ul>
            </div>
          </div>
        )
      },
      {
        id: 'workspace-undo',
        title: 'Workspace-Level Undo/Redo',
        content: (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-lg mb-2">Workspace Actions Tracked:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Workspace Creation</strong>: Creating new workspaces</li>
                <li><strong>Workspace Deletion</strong>: Removing workspaces with ALL content</li>
                <li><strong>Workspace Renaming</strong>: Title changes</li>
                <li><strong>Workspace Reordering</strong>: Sidebar drag-and-drop changes</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Sidebar Controls:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Dedicated Buttons</strong>: Separate from canvas undo/redo</li>
                <li><strong>Independent History</strong>: Doesn&apos;t interfere with canvas actions</li>
                <li><strong>Full Restoration</strong>: Deleted workspaces restored with all cards/connections</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Smart Restoration:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Complete State</strong>: All cards, connections, and settings restored</li>
                <li><strong>Position Memory</strong>: Restores to exact previous state</li>
                <li><strong>Content Preservation</strong>: All formatting and content intact</li>
              </ul>
            </div>
          </div>
        )
      },
      {
        id: 'undo-best-practices',
        title: 'Undo System Best Practices',
        content: (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-lg mb-2">Understanding Undo Stacks:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Independent Systems</strong>: Canvas and workspace undo are separate</li>
                <li><strong>Action Grouping</strong>: Related changes grouped into single undo actions</li>
                <li><strong>Stack Limits</strong>: Reasonable limits prevent memory issues</li>
                <li><strong>Clear History</strong>: New actions clear the redo stack</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">When to Use Undo:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Accidental Deletions</strong>: Quickly restore removed content</li>
                <li><strong>Experimental Changes</strong>: Try changes knowing you can revert</li>
                <li><strong>Content Mistakes</strong>: Fix text edits or formatting errors</li>
                <li><strong>Layout Adjustments</strong>: Revert positioning experiments</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Undo Limitations:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Session Scope</strong>: History lost on page reload</li>
                <li><strong>View State</strong>: Pan/zoom positions not tracked</li>
                <li><strong>Settings</strong>: Grid/snap preferences not undoable</li>
                <li><strong>Search Actions</strong>: Search and navigation not tracked</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Performance Notes:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Memory Efficient</strong>: Only essential state data stored</li>
                <li><strong>Fast Restoration</strong>: Optimized for quick undo/redo</li>
                <li><strong>Reliable</strong>: Thoroughly tested state management</li>
              </ul>
            </div>
          </div>
        )
      }
    ]
  },
  {
    id: 'data-persistence',
    title: 'Data Storage & Persistence',
    content: `
Understanding how Jot stores and manages your data locally for privacy and performance.
    `,
    subsections: [
      {
        id: 'local-storage',
        title: 'Local Data Storage',
        content: (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-lg mb-2">IndexedDB Storage:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Browser Database</strong>: All data stored in your browser&apos;s IndexedDB</li>
                <li><strong>No Server Storage</strong>: Complete privacy and control</li>
                <li><strong>Offline Capable</strong>: Works without internet after initial load</li>
                <li><strong>Persistent</strong>: Data survives browser restarts</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Data Schema:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Users Table</strong>: Profile information from auth providers</li>
                <li><strong>Workspaces Table</strong>: Workspace definitions and metadata</li>
                <li><strong>Cards Table</strong>: All card content, positions, and formatting</li>
                <li><strong>Connections Table</strong>: Arrow connections between cards</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Storage Efficiency:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Optimized Structure</strong>: Minimal data overhead</li>
                <li><strong>Indexed Queries</strong>: Fast retrieval for large datasets</li>
                <li><strong>Incremental Updates</strong>: Only changed data is written</li>
                <li><strong>Compression</strong>: Efficient storage of rich text content</li>
              </ul>
            </div>
          </div>
        )
      },
      {
        id: 'data-backup',
        title: 'Data Backup & Recovery',
        content: (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-lg mb-2">Current Backup Options:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Browser Backup</strong>: Data tied to browser profile</li>
                <li><strong>Manual Backup</strong>: Currently requires browser tools</li>
                <li><strong>Export Feature</strong>: Planned for future versions</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Data Recovery Scenarios:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Browser Reset</strong>: Data lost if browser data is cleared</li>
                <li><strong>Device Change</strong>: Currently no automatic sync</li>
                <li><strong>Corruption</strong>: IndexedDB corruption rare but possible</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Best Practices:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Regular Browser Backups</strong>: Use browser sync features</li>
                <li><strong>Multiple Browsers</strong>: Consider using different browsers for important data</li>
                <li><strong>Device Awareness</strong>: Understand data is device/browser specific</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Future Features:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Export/Import</strong>: JSON export of all workspace data</li>
                <li><strong>Cloud Sync</strong>: Optional cloud synchronization</li>
                <li><strong>Backup Reminders</strong>: Notifications for data protection</li>
              </ul>
            </div>
          </div>
        )
      },
      {
        id: 'performance',
        title: 'Performance & Scalability',
        content: (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-lg mb-2">Performance Characteristics:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Local Speed</strong>: All operations happen locally</li>
                <li><strong>Smooth Rendering</strong>: Optimized canvas and card rendering</li>
                <li><strong>Efficient Updates</strong>: Only changed elements re-render</li>
                <li><strong>Memory Management</strong>: Careful resource cleanup</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Scalability Limits:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Large Workspaces</strong>: Tested with hundreds of cards</li>
                <li><strong>Complex Content</strong>: Rich text and images handled efficiently</li>
                <li><strong>Connection Performance</strong>: Optimized connection rendering</li>
                <li><strong>Search Speed</strong>: Fast text search across all content</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Performance Tips:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Reasonable Workspace Size</strong>: Keep workspaces focused</li>
                <li><strong>Image Optimization</strong>: Compress large images before adding</li>
                <li><strong>Connection Moderation</strong>: Too many connections can clutter</li>
                <li><strong>Regular Cleanup</strong>: Remove unused cards and workspaces</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Technical Optimizations:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>React Performance</strong>: Optimized component updates</li>
                <li><strong>Canvas Rendering</strong>: Efficient SVG connection rendering</li>
                <li><strong>IndexedDB Queries</strong>: Indexed database queries</li>
                <li><strong>Memory Cleanup</strong>: Proper event listener management</li>
              </ul>
            </div>
          </div>
        )
      }
    ]
  },
  {
    id: 'keyboard-shortcuts',
    title: 'Complete Keyboard Shortcuts',
    content: (
      <div>
        <p>Master Jot with comprehensive keyboard shortcuts for efficient note-taking and navigation.</p>
      </div>
    ),
    subsections: [
      {
        id: 'global-shortcuts',
        title: 'Global Application Shortcuts',
        content: (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-lg mb-2">Navigation Shortcuts:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Tab</strong>: Navigate between workspaces (when sidebar focused)</li>
                <li><strong>Enter</strong>: Select workspace (when workspace highlighted)</li>
                <li><strong>Escape</strong>: Close modals, exit edit modes</li>
                <li><strong>Ctrl/Cmd+F</strong>: Focus global search (when implemented)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Canvas Shortcuts:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Arrow Keys</strong>: Fine pan movement (when canvas focused)</li>
                <li><strong>+</strong>: Zoom in (when canvas focused)</li>
                <li><strong>-</strong>: Zoom out (when canvas focused)</li>
                <li><strong>0</strong>: Reset zoom to 100%</li>
                <li><strong>Space+Drag</strong>: Pan canvas (alternative to mouse drag)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Application Shortcuts:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Ctrl/Cmd+N</strong>: New workspace (when implemented)</li>
                <li><strong>Ctrl/Cmd+S</strong>: Save current state (auto-saves continuously)</li>
                <li><strong>F11</strong>: Full screen mode (browser dependent)</li>
              </ul>
            </div>
          </div>
        )
      },
      {
        id: 'editor-shortcuts',
        title: 'Rich Text Editor Shortcuts',
        content: (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-lg mb-2">Text Formatting:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Ctrl/Cmd+B</strong>: Bold text</li>
                <li><strong>Ctrl/Cmd+I</strong>: Italic text</li>
                <li><strong>Ctrl/Cmd+U</strong>: Underline (where supported)</li>
                <li><strong>Ctrl/Cmd+Shift+S</strong>: Strikethrough</li>
                <li><strong>Ctrl/Cmd+E</strong>: Inline code formatting</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Paragraph Formatting:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Ctrl/Cmd+Shift+7</strong>: Toggle bullet list</li>
                <li><strong>Ctrl/Cmd+Shift+8</strong>: Toggle numbered list</li>
                <li><strong>Ctrl/Cmd+Shift+9</strong>: Toggle task list</li>
                <li><strong>Ctrl/Cmd+Shift+B</strong>: Toggle blockquote</li>
                <li><strong>Ctrl/Cmd+Alt+0</strong>: Normal paragraph</li>
                <li><strong>Ctrl/Cmd+Alt+1</strong>: Heading 1</li>
                <li><strong>Ctrl/Cmd+Alt+2</strong>: Heading 2</li>
                <li><strong>Ctrl/Cmd+Alt+3</strong>: Heading 3</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Editor Navigation:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Ctrl/Cmd+A</strong>: Select all content</li>
                <li><strong>Ctrl/Cmd+Z</strong>: Undo</li>
                <li><strong>Ctrl/Cmd+Y</strong>: Redo</li>
                <li><strong>Ctrl/Cmd+Shift+Z</strong>: Redo (alternative)</li>
              </ul>
            </div>
          </div>
        )
      },
      {
        id: 'list-shortcuts',
        title: 'List Management Shortcuts',
        content: (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-lg mb-2">List Navigation:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Enter</strong>: Create new list item</li>
                <li><strong>Shift+Enter</strong>: Create line break within list item</li>
                <li><strong>Tab</strong>: Indent list item (create sub-item)</li>
                <li><strong>Shift+Tab</strong>: Unindent list item</li>
                <li><strong>Backspace</strong>: Remove empty list item / exit list</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Task List Specific:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Ctrl/Cmd+Enter</strong>: Toggle task completion</li>
                <li><strong>Space</strong>: Toggle checkbox (when checkbox focused)</li>
                <li><strong>Arrow Keys</strong>: Navigate between tasks</li>
                <li><strong>Delete</strong>: Remove completed tasks (when implemented)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">List Formatting:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Ctrl/Cmd+Shift+L</strong>: Convert to bullet list</li>
                <li><strong>Ctrl/Cmd+Shift+O</strong>: Convert to numbered list</li>
                <li><strong>Ctrl/Cmd+Shift+T</strong>: Convert to task list</li>
              </ul>
            </div>
          </div>
        )
      },
      {
        id: 'card-shortcuts',
        title: 'Card Management Shortcuts',
        content: (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-lg mb-2">Card Selection:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Click</strong>: Select card</li>
                <li><strong>Ctrl/Cmd+Click</strong>: Multi-select (when implemented)</li>
                <li><strong>Escape</strong>: Deselect all cards</li>
                <li><strong>Delete</strong>: Delete selected card</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Card Editing:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Double-Click</strong>: Enter edit mode</li>
                <li><strong>Enter</strong>: Enter edit mode (when card selected)</li>
                <li><strong>Escape</strong>: Exit edit mode</li>
                <li><strong>Ctrl/Cmd+Enter</strong>: Save and exit edit mode</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Card Movement:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Arrow Keys</strong>: Move selected card (fine movement)</li>
                <li><strong>Shift+Arrow Keys</strong>: Move card in larger increments</li>
                <li><strong>Ctrl/Cmd+Arrow Keys</strong>: Move to edge of canvas</li>
                <li><strong>Home</strong>: Move to top-left of canvas</li>
                <li><strong>End</strong>: Move to bottom-right of content area</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Card Operations:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Ctrl/Cmd+D</strong>: Duplicate card (when implemented)</li>
                <li><strong>Ctrl/Cmd+X</strong>: Cut card (when implemented)</li>
                <li><strong>Ctrl/Cmd+C</strong>: Copy card content</li>
                <li><strong>Ctrl/Cmd+V</strong>: Paste content into card</li>
              </ul>
            </div>
          </div>
        )
      }
    ]
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting & FAQ',
    content: (
      <div>
        <p>Common issues and solutions for optimal Jot experience.</p>
      </div>
    ),
    subsections: [
      {
        id: 'common-issues',
        title: 'Common Issues & Solutions',
        content: (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-lg mb-2">Authentication Problems:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Provider Not Working</strong>: Check internet connection and try different provider</li>
                <li><strong>Login Loop</strong>: Clear browser cache and cookies</li>
                <li><strong>No Providers Available</strong>: Use Local-only option as fallback</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Performance Issues:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Slow Loading</strong>: Check browser IndexedDB storage space</li>
                <li><strong>Laggy Canvas</strong>: Reduce number of cards or simplify content</li>
                <li><strong>Memory Warnings</strong>: Close other browser tabs, restart browser</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Data Issues:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Missing Workspaces</strong>: Check if signed in with correct account</li>
                <li><strong>Lost Cards</strong>: Use Undo functionality or check different workspace</li>
                <li><strong>Formatting Problems</strong>: Try exiting and re-entering edit mode</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Display Issues:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Blurry Text</strong>: Check browser zoom level (should be 100%)</li>
                <li><strong>Layout Problems</strong>: Try refreshing page or resetting view</li>
                <li><strong>Missing Buttons</strong>: Check browser window size and extension conflicts</li>
              </ul>
            </div>
          </div>
        )
      },
      {
        id: 'browser-support',
        title: 'Browser Compatibility',
        content: (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-lg mb-2">Recommended Browsers:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Chrome/Chromium</strong>: Best performance and feature support</li>
                <li><strong>Firefox</strong>: Full functionality with good performance</li>
                <li><strong>Safari</strong>: Good support, some CSS differences</li>
                <li><strong>Edge</strong>: Full compatibility with Chrome-like performance</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Required Features:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>IndexedDB</strong>: Essential for data storage</li>
                <li><strong>ES6+ JavaScript</strong>: Modern JavaScript features required</li>
                <li><strong>CSS Grid/Flexbox</strong>: For layout rendering</li>
                <li><strong>SVG Support</strong>: For connection arrows</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Known Issues:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Mobile Browsers</strong>: Limited drag-and-drop support</li>
                <li><strong>Older Browsers</strong>: IE not supported, older Safari versions may have issues</li>
                <li><strong>Privacy Mode</strong>: Some features may not persist in private browsing</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Optimization Tips:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Disable Extensions</strong>: Try disabling ad blockers if experiencing issues</li>
                <li><strong>Clear Cache</strong>: Refresh cache if seeing old versions</li>
                <li><strong>Update Browser</strong>: Keep browser updated for best experience</li>
              </ul>
            </div>
          </div>
        )
      },
      {
        id: 'data-recovery',
        title: 'Data Recovery & Backup',
        content: (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-lg mb-2">If Data Seems Lost:</h4>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li><strong>Check Authentication</strong>: Ensure signed in with correct account</li>
                <li><strong>Try Different Browser</strong>: Data might be in different browser profile</li>
                <li><strong>Check Browser Storage</strong>: Look for IndexedDB data in developer tools</li>
                <li><strong>Account Switching</strong>: Try signing out and back in</li>
              </ol>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Preventing Data Loss:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Regular Browser Sync</strong>: Enable browser synchronization</li>
                <li><strong>Multiple Devices</strong>: Consider accessing from multiple devices</li>
                <li><strong>Export Important Data</strong>: Manually copy critical content to external files</li>
                <li><strong>Document Important Workspaces</strong>: Keep separate notes of key information</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Developer Tools Recovery:</h4>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>Open browser Developer Tools (F12)</li>
                <li>Go to Application/Storage tab</li>
                <li>Find IndexedDB → JotDatabase</li>
                <li>Check for your workspace and card data</li>
                <li>Contact support if data exists but isn&apos;t loading</li>
              </ol>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Future Backup Features:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>JSON Export</strong>: Export all workspace data</li>
                <li><strong>Selective Backup</strong>: Choose specific workspaces to backup</li>
                <li><strong>Cloud Integration</strong>: Optional cloud storage synchronization</li>
                <li><strong>Automatic Backups</strong>: Scheduled local backups</li>
              </ul>
            </div>
          </div>
        )
      }
    ]
  },
  {
    id: 'advanced-features',
    title: 'Advanced Features & Tips',
    content: (
      <div>
        <p>Power user features and advanced techniques for maximizing Jot&apos;s potential.</p>
      </div>
    ),
    subsections: [
      {
        id: 'workflow-optimization',
        title: 'Workflow Optimization',
        content: (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-lg mb-2">Efficient Workspace Organization:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Project-Based Workspaces</strong>: One workspace per major project</li>
                <li><strong>Topic Segregation</strong>: Separate workspaces for different subjects</li>
                <li><strong>Temporary Workspaces</strong>: Quick workspace for scratch work</li>
                <li><strong>Archive Strategy</strong>: Move completed projects to archive workspaces</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Card Organization Strategies:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Consistent Sizing</strong>: Use similar card sizes for clean appearance</li>
                <li><strong>Color Coding</strong>: Use rich text formatting for visual organization</li>
                <li><strong>Hierarchical Layout</strong>: Use positioning to show relationships</li>
                <li><strong>Connection Patterns</strong>: Develop consistent connection meanings</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Content Organization:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Template Cards</strong>: Create reusable card formats</li>
                <li><strong>Tag Systems</strong>: Use consistent keywords in card titles</li>
                <li><strong>Date Stamping</strong>: Include dates in card titles for tracking</li>
                <li><strong>Version Control</strong>: Use card titles to track iteration versions</li>
              </ul>
            </div>
          </div>
        )
      },
      {
        id: 'collaboration-prep',
        title: 'Preparing for Future Collaboration',
        content: (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-lg mb-2">Content Organization for Sharing:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Clear Titles</strong>: Use descriptive, unambiguous card titles</li>
                <li><strong>Complete Context</strong>: Include sufficient detail for others to understand</li>
                <li><strong>Consistent Formatting</strong>: Maintain consistent style across cards</li>
                <li><strong>Documentation Cards</strong>: Create overview/instruction cards</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Workspace Structure:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Logical Flow</strong>: Organize cards in intuitive patterns</li>
                <li><strong>Clear Connections</strong>: Use connections to show clear relationships</li>
                <li><strong>Overview Areas</strong>: Create summary or index areas</li>
                <li><strong>Progress Tracking</strong>: Show current status and next steps</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Content Quality:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Spell Check</strong>: Review content for accuracy</li>
                <li><strong>Link Verification</strong>: Ensure external links work</li>
                <li><strong>Image Quality</strong>: Use clear, relevant images</li>
                <li><strong>Code Testing</strong>: Verify code examples work correctly</li>
              </ul>
            </div>
          </div>
        )
      },
      {
        id: 'performance-tuning',
        title: 'Performance Tuning',
        content: (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-lg mb-2">Optimal Workspace Size:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Card Count</strong>: Keep workspaces under 100 cards for best performance</li>
                <li><strong>Content Size</strong>: Avoid extremely large images or text blocks</li>
                <li><strong>Connection Count</strong>: Moderate use of connections (under 50 per workspace)</li>
                <li><strong>Workspace Division</strong>: Split large projects into multiple workspaces</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Browser Optimization:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Memory Management</strong>: Restart browser periodically for large workspaces</li>
                <li><strong>Cache Clearing</strong>: Clear browser cache if experiencing slowdowns</li>
                <li><strong>Extension Conflicts</strong>: Disable unnecessary browser extensions</li>
                <li><strong>Tab Management</strong>: Close unused tabs when working with large workspaces</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Content Optimization:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Image Compression</strong>: Compress images before adding to cards</li>
                <li><strong>Text Efficiency</strong>: Use concise, focused content</li>
                <li><strong>Code Formatting</strong>: Use code blocks efficiently</li>
                <li><strong>Link Management</strong>: Remove or update broken links</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">System Resources:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Available RAM</strong>: Ensure sufficient system memory</li>
                <li><strong>Storage Space</strong>: Monitor browser storage usage</li>
                <li><strong>Network Speed</strong>: Faster internet improves authentication experience</li>
                <li><strong>Device Performance</strong>: Consider device capabilities for large workspaces</li>
              </ul>
            </div>
          </div>
        )
      }
    ]
  }
]

export default function DocsModal({ isOpen, onClose }: DocsModalProps) {
  const [selectedSection, setSelectedSection] = useState<string>('getting-started')
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['getting-started']))
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Section[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Search functionality
  const performSearch = (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    const results: Section[] = []
    const lowerQuery = query.toLowerCase()

    const searchSection = (section: Section, parentPath: string = '') => {
      const fullPath = parentPath ? `${parentPath} > ${section.title}` : section.title
      
      // Check title match
      if (section.title.toLowerCase().includes(lowerQuery)) {
        results.push({ ...section, title: fullPath })
      }
      
      // Check content match (convert React nodes to string for search)
      const contentString = typeof section.content === 'string' 
        ? section.content 
        : section.content?.toString() || ''
      
      if (contentString.toLowerCase().includes(lowerQuery) && 
          !section.title.toLowerCase().includes(lowerQuery)) {
        results.push({ ...section, title: `${fullPath} (content match)` })
      }
      
      // Search subsections
      if (section.subsections) {
        section.subsections.forEach(subsection => {
          searchSection(subsection, fullPath)
        })
      }
    }

    docsContent.forEach(section => searchSection(section))
    setSearchResults(results.slice(0, 10)) // Limit results
    setIsSearching(false)
  }

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
  }

  const renderSection = (section: Section, level: number = 0, parentId?: string) => {
    const sectionPath = parentId ? `${parentId}.${section.id}` : section.id
    const isExpanded = expandedSections.has(sectionPath)
    const isSelected = selectedSection === sectionPath
    const hasSubsections = section.subsections && section.subsections.length > 0

    return (
      <div key={sectionPath} className={`${level > 0 ? 'ml-4' : ''}`}>
        <div
          className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
            isSelected ? 'bg-blue-100 text-black' : 'hover:bg-gray-100 text-black'
          }`}
          onClick={() => {
            if (hasSubsections) {
              toggleSection(sectionPath)
            }
            setSelectedSection(sectionPath)
          }}
          style={{color: '#000000 !important'}}
        >
          {hasSubsections ? (
            isExpanded ? (
              <ChevronDown size={16} className="text-black" style={{color: '#000000 !important'}} />
            ) : (
              <ChevronRight size={16} className="text-black" style={{color: '#000000 !important'}} />
            )
          ) : (
            <div className="w-4" />
          )}
          <span className={`text-sm ${level === 0 ? 'font-bold' : 'font-semibold'} text-black`} style={{color: '#000000 !important'}}>
            {section.title}
          </span>
        </div>
        
        {hasSubsections && isExpanded && (
          <div className="ml-2">
            {section.subsections!.map(subsection => 
              renderSection(subsection, level + 1, sectionPath)
            )}
          </div>
        )}
      </div>
    )
  }

  const getSelectedSectionContent = () => {
    const findSection = (sections: Section[], path: string): Section | null => {
      for (const section of sections) {
        if (section.id === path) return section
        
        const parts = path.split('.')
        if (parts.length > 1 && section.id === parts[0] && section.subsections) {
          const subPath = parts.slice(1).join('.')
          const found = findSection(section.subsections, subPath)
          if (found) return found
        }
      }
      return null
    }

    return findSection(docsContent, selectedSection)
  }

  const selectedContent = getSelectedSectionContent()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative h-full max-w-6xl mx-auto bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <Book size={24} className="text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Jot Documentation</h2>
          </div>
          
          {/* Search */}
          <div className="flex-1 max-w-md mx-4 relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documentation..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            
            {/* Search Results Dropdown */}
            {searchQuery && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                {isSearching ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    Searching...
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((result, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSelectedSection(result.id)
                        setSearchQuery('')
                        setSearchResults([])
                      }}
                      className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-sm text-gray-900">
                        {result.title}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    No results found
                  </div>
                )}
              </div>
            )}
          </div>
          
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <div className="w-80 bg-gray-50 border-r border-gray-200 overflow-y-auto">
            <div className="p-4">
              <h3 className="font-medium text-gray-900 mb-3">Contents</h3>
              <div className="space-y-1">
                {docsContent.map(section => renderSection(section))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-8 max-w-4xl">
              <style jsx>{`
                .docs-content {
                  color: #000000 !important;
                }
                .docs-content strong {
                  color: #000000 !important;
                  font-weight: 700 !important;
                }
                .docs-content em {
                  color: #000000 !important;
                  font-style: italic !important;
                }
              `}</style>
              {selectedContent ? (
                <>
                  <h1 className="text-3xl font-bold text-gray-900 mb-6">
                    {selectedContent.title}
                  </h1>
                  <div className="prose prose-lg max-w-none docs-content">
                    {typeof selectedContent.content === 'string' ? (
                      <div className="whitespace-pre-line text-black leading-relaxed font-medium" style={{color: '#000000 !important'}}>
                        {selectedContent.content}
                      </div>
                    ) : (
                      <div className="text-black leading-relaxed font-medium" style={{color: '#000000 !important'}}>
                        {selectedContent.content}
                      </div>
                    )}
                  </div>
                  
                  {/* Subsections for main sections */}
                  {selectedContent.subsections && selectedContent.subsections.map(subsection => (
                    <div key={subsection.id} className="mt-8">
                      <h2 className="text-xl font-semibold text-gray-900 mb-4">
                        {subsection.title}
                      </h2>
                      <div className="prose max-w-none docs-content">
                        {typeof subsection.content === 'string' ? (
                          <div className="whitespace-pre-line text-black leading-relaxed font-medium" style={{color: '#000000 !important'}}>
                            {subsection.content}
                          </div>
                        ) : (
                          <div className="text-black leading-relaxed font-medium" style={{color: '#000000 !important'}}>
                            {subsection.content}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <HelpCircle size={48} className="text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Select a topic
                    </h3>
                    <p className="text-gray-600">
                      Choose a section from the sidebar to view its documentation.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
