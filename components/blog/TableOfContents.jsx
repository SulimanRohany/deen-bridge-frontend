'use client'

import { useState, useEffect } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { IconList } from '@tabler/icons-react'

/**
 * Table of Contents component that auto-generates from headings
 */
export default function TableOfContents({ editor, open, onOpenChange }) {
  const [headings, setHeadings] = useState([])

  useEffect(() => {
    if (!editor) return

    const updateHeadings = () => {
      const headingList = []
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'heading') {
          const level = node.attrs.level
          const text = node.textContent
          const id = `heading-${pos}`
          headingList.push({ level, text, id, pos })
        }
      })
      setHeadings(headingList)
    }

    editor.on('update', updateHeadings)
    editor.on('selectionUpdate', updateHeadings)
    updateHeadings()

    return () => {
      editor.off('update', updateHeadings)
      editor.off('selectionUpdate', updateHeadings)
    }
  }, [editor])

  const scrollToHeading = (pos) => {
    if (!editor) return
    editor.commands.setTextSelection(pos)
    // Scroll to the selection using DOM manipulation
    setTimeout(() => {
      try {
        const domAtPos = editor.view.domAtPos(pos)
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
    editor.view.focus()
  }

  if (!open || headings.length === 0) return null

  return (
    <div className="border-l bg-gray-50 p-4 w-64">
      <div className="flex items-center gap-2 mb-4">
        <IconList size={20} />
        <h3 className="font-semibold">Table of Contents</h3>
      </div>
      <ScrollArea className="h-[calc(100vh-200px)]">
        <nav className="space-y-1">
          {headings.map((heading, index) => (
            <button
              key={index}
              onClick={() => scrollToHeading(heading.pos)}
              className={`block w-full text-left px-2 py-1 rounded hover:bg-gray-200 transition-colors ${
                heading.level === 1 ? 'font-semibold text-base' :
                heading.level === 2 ? 'font-medium text-sm ml-2' :
                'text-xs ml-4 text-gray-600'
              }`}
            >
              {heading.text || `Heading ${heading.level}`}
            </button>
          ))}
        </nav>
      </ScrollArea>
    </div>
  )
}

