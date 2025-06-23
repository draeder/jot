'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Search, ChevronRight } from 'lucide-react'
import { db, Card, Workspace } from '@/lib/db'

interface SearchResult {
  card: Card
  workspace: Workspace
  matchType: 'title' | 'content'
  snippet?: string
}

interface GlobalSearchProps {
  onResultSelect: (workspaceId: string, cardId: string) => void
}

export default function GlobalSearch({ onResultSelect }: GlobalSearchProps) {
  const { data: session } = useSession()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Search function
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!session?.user?.email || !searchQuery.trim()) {
      setResults([])
      return
    }

    setIsLoading(true)
    try {
      // Get user ID
      const dbUser = await db.users.where('email').equals(session.user.email).first()
      if (!dbUser) {
        setResults([])
        return
      }

      // Get all workspaces for the user
      const workspaces = await db.workspaces.where('userId').equals(dbUser.id).toArray()
      const workspaceMap = new Map(workspaces.map(ws => [ws.id, ws]))

      // Get all cards for all user workspaces
      const workspaceIds = workspaces.map(ws => ws.id)
      const allCards: Card[] = []
      
      for (const workspaceId of workspaceIds) {
        const cards = await db.cards.where('workspaceId').equals(workspaceId).toArray()
        allCards.push(...cards)
      }

      // Search through cards
      const searchResults: SearchResult[] = []
      const lowerQuery = searchQuery.toLowerCase()

      for (const card of allCards) {
        const workspace = workspaceMap.get(card.workspaceId)
        if (!workspace) continue

        // Check title match
        if (card.title.toLowerCase().includes(lowerQuery)) {
          searchResults.push({
            card,
            workspace,
            matchType: 'title'
          })
          continue // Don't duplicate if title matches
        }

        // Check content match (strip HTML and search)
        const textContent = stripHtml(card.content)
        if (textContent.toLowerCase().includes(lowerQuery)) {
          // Create snippet around the match
          const snippet = createSnippet(textContent, lowerQuery)
          searchResults.push({
            card,
            workspace,
            matchType: 'content',
            snippet
          })
        }
      }

      // Sort results: title matches first, then by workspace name, then by card title
      searchResults.sort((a, b) => {
        if (a.matchType !== b.matchType) {
          return a.matchType === 'title' ? -1 : 1
        }
        if (a.workspace.name !== b.workspace.name) {
          return a.workspace.name.localeCompare(b.workspace.name)
        }
        return a.card.title.localeCompare(b.card.title)
      })

      setResults(searchResults.slice(0, 10)) // Limit to 10 results
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [session])

  // Strip HTML tags from content
  const stripHtml = (html: string): string => {
    const doc = new DOMParser().parseFromString(html, 'text/html')
    return doc.body.textContent || ''
  }

  // Create snippet around search match
  const createSnippet = (text: string, query: string, maxLength: number = 100): string => {
    const lowerText = text.toLowerCase()
    const lowerQuery = query.toLowerCase()
    const index = lowerText.indexOf(lowerQuery)
    
    if (index === -1) return text.substring(0, maxLength) + '...'
    
    const start = Math.max(0, index - Math.floor((maxLength - query.length) / 2))
    const end = Math.min(text.length, start + maxLength)
    
    let snippet = text.substring(start, end)
    if (start > 0) snippet = '...' + snippet
    if (end < text.length) snippet = snippet + '...'
    
    return snippet
  }

  // Highlight search terms in text
  const highlightMatch = (text: string, query: string) => {
    if (!query) return text
    const regex = new RegExp(`(${query})`, 'gi')
    const parts = text.split(regex)
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 font-medium">
          {part}
        </mark>
      ) : (
        part
      )
    )
  }

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        performSearch(query)
      } else {
        setResults([])
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, performSearch])

  // Handle clicks outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle result selection
  const handleResultClick = (result: SearchResult) => {
    onResultSelect(result.workspace.id, result.card.id)
    setQuery('')
    setResults([])
    setIsOpen(false)
    inputRef.current?.blur()
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
      inputRef.current?.blur()
    }
  }

  return (
    <div ref={searchRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search across all workspaces..."
          className="w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        />
      </div>

      {/* Dropdown Results */}
      {isOpen && (query.trim() || results.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
              Searching...
            </div>
          ) : results.length > 0 ? (
            <div className="py-1">
              {results.map((result, index) => (
                <button
                  key={`${result.workspace.id}-${result.card.id}-${index}`}
                  onClick={() => handleResultClick(result)}
                  className="w-full px-4 py-3 hover:bg-gray-50 text-left border-b border-gray-100 last:border-b-0 transition-colors"
                >
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-600 font-medium">
                      {result.workspace.name}
                    </span>
                    <ChevronRight size={14} className="text-gray-400" />
                    <span className="text-gray-900 font-medium">
                      {highlightMatch(result.card.title || 'Untitled', query)}
                    </span>
                    {result.matchType === 'title' && (
                      <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                        Title
                      </span>
                    )}
                  </div>
                  {result.snippet && (
                    <div className="text-xs text-gray-600 mt-1 max-h-8 overflow-hidden">
                      {highlightMatch(result.snippet, query)}
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : query.trim() ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              No results found for &ldquo;{query}&rdquo;
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
