'use client'

import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { IconSearch, IconReplace, IconArrowUp, IconArrowDown, IconX } from '@tabler/icons-react'

/**
 * Search and Replace component for the editor
 */
export default function SearchReplace({ editor, open, onOpenChange }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [replaceQuery, setReplaceQuery] = useState('')
  const [matchCase, setMatchCase] = useState(false)
  const [matches, setMatches] = useState([])
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1)
  const searchInputRef = useRef(null)

  useEffect(() => {
    if (open && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [open])

  useEffect(() => {
    if (!editor || !searchQuery) {
      setMatches([])
      setCurrentMatchIndex(-1)
      return
    }

    const text = editor.state.doc.textContent
    const flags = matchCase ? 'g' : 'gi'
    const regex = new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags)
    const foundMatches = []
    let match

    while ((match = regex.exec(text)) !== null) {
      foundMatches.push({
        index: match.index,
        length: match[0].length,
      })
    }

    setMatches(foundMatches)
    setCurrentMatchIndex(foundMatches.length > 0 ? 0 : -1)
  }, [searchQuery, matchCase, editor])

  useEffect(() => {
    if (!editor || matches.length === 0 || currentMatchIndex < 0) return

    const match = matches[currentMatchIndex]
    if (match) {
      // Find the position in the document
      let pos = 0
      let found = false

      editor.state.doc.descendants((node, nodePos) => {
        if (found) return false
        if (node.isText) {
          const text = node.text
          const relativeIndex = match.index - pos
          if (relativeIndex >= 0 && relativeIndex < text.length) {
            const from = nodePos + relativeIndex
            const to = from + match.length
            editor.commands.setTextSelection({ from, to })
            // Scroll to the selection using DOM manipulation
            setTimeout(() => {
              try {
                const domAtPos = editor.view.domAtPos(from)
                if (domAtPos && domAtPos.node) {
                  const domNode = domAtPos.node
                  let element = null
                  
                  if (domNode.nodeType === Node.TEXT_NODE) {
                    element = domNode.parentElement
                  } else if (domNode.nodeType === Node.ELEMENT_NODE) {
                    element = domNode
                  }
                  
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
                  }
                }
              } catch (error) {
                // Fallback: scroll the editor container
                const editorElement = editor.view.dom.closest('.ProseMirror')
                if (editorElement) {
                  editorElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
                }
              }
            }, 100)
            found = true
            return false
          }
          pos += text.length
        }
        return true
      })
    }
  }, [currentMatchIndex, matches, editor])

  const handleNext = () => {
    if (matches.length === 0) return
    setCurrentMatchIndex((prev) => (prev + 1) % matches.length)
  }

  const handlePrevious = () => {
    if (matches.length === 0) return
    setCurrentMatchIndex((prev) => (prev - 1 + matches.length) % matches.length)
  }

  const handleReplace = () => {
    if (!editor || !searchQuery || currentMatchIndex < 0) return

    const { from, to } = editor.state.selection
    const selectedText = editor.state.doc.textBetween(from, to)

    // Check if the selected text matches the search query
    const flags = matchCase ? 'g' : 'gi'
    const regex = new RegExp(`^${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, flags)
    
    if (regex.test(selectedText)) {
      editor.chain().focus().insertContent(replaceQuery).run()
      // Move to next match
      handleNext()
    }
  }

  const handleReplaceAll = () => {
    if (!editor || !searchQuery) return

    const text = editor.getText()
    const flags = matchCase ? 'g' : 'gi'
    const regex = new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags)
    const newText = text.replace(regex, replaceQuery)

    editor.commands.setContent(newText)
    setMatches([])
    setCurrentMatchIndex(-1)
  }

  const handleClose = () => {
    setSearchQuery('')
    setReplaceQuery('')
    setMatches([])
    setCurrentMatchIndex(-1)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Find & Replace</DialogTitle>
          <DialogDescription>
            Search and replace text in your document
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="space-y-2">
            <Label htmlFor="search">Find</Label>
            <div className="relative">
              <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <Input
                id="search"
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="pl-9"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.shiftKey) {
                    e.preventDefault()
                    handlePrevious()
                  } else if (e.key === 'Enter') {
                    e.preventDefault()
                    handleNext()
                  }
                }}
              />
            </div>
          </div>

          {/* Replace Input */}
          <div className="space-y-2">
            <Label htmlFor="replace">Replace</Label>
            <div className="relative">
              <IconReplace className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <Input
                id="replace"
                value={replaceQuery}
                onChange={(e) => setReplaceQuery(e.target.value)}
                placeholder="Replace with..."
                className="pl-9"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleReplace()
                  }
                }}
              />
            </div>
          </div>

          {/* Options */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={matchCase}
                onChange={(e) => setMatchCase(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Match case</span>
            </label>
            {matches.length > 0 && (
              <span className="text-sm text-gray-500">
                {currentMatchIndex + 1} of {matches.length}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevious}
                disabled={matches.length === 0}
                title="Previous (Shift+Enter)"
              >
                <IconArrowUp size={16} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNext}
                disabled={matches.length === 0}
                title="Next (Enter)"
              >
                <IconArrowDown size={16} />
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReplace}
                disabled={matches.length === 0 || currentMatchIndex < 0}
              >
                Replace
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReplaceAll}
                disabled={matches.length === 0}
              >
                Replace All
              </Button>
              <Button variant="outline" size="sm" onClick={handleClose}>
                <IconX size={16} />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

