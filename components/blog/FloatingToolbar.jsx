'use client'

import { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import {
  IconBold,
  IconItalic,
  IconUnderline,
  IconStrikethrough,
  IconHighlight,
  IconLink,
  IconCode,
  IconAlignLeft,
  IconAlignCenter,
  IconAlignRight,
} from '@tabler/icons-react'

/**
 * Floating Toolbar that appears on text selection
 */
export default function FloatingToolbar({ editor }) {
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const toolbarRef = useRef(null)

  useEffect(() => {
    if (!editor) return

    const updateToolbar = () => {
      const { state, view } = editor
      const { from, to, empty } = state.selection

      if (empty || !view.hasFocus()) {
        setIsVisible(false)
        return
      }

      // Get the DOM coordinates of the selection
      const { $anchor } = state.selection
      const start = view.coordsAtPos(from)
      const end = view.coordsAtPos(to)

      // Position toolbar above the selection
      const top = Math.min(start.top, end.top) - 10
      const left = (start.left + end.left) / 2

      setPosition({
        top: top + window.scrollY,
        left: left + window.scrollX,
      })
      setIsVisible(true)
    }

    editor.on('selectionUpdate', updateToolbar)
    editor.on('focus', updateToolbar)
    editor.on('blur', () => setIsVisible(false))

    return () => {
      editor.off('selectionUpdate', updateToolbar)
      editor.off('focus', updateToolbar)
      editor.off('blur', () => setIsVisible(false))
    }
  }, [editor])

  // Hide toolbar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (toolbarRef.current && !toolbarRef.current.contains(event.target)) {
        // Check if click is in the editor
        const editorElement = event.target.closest('.ProseMirror')
        if (!editorElement) {
          setIsVisible(false)
        }
      }
    }

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [isVisible])

  if (!editor || !isVisible) return null

  return (
    <div
      ref={toolbarRef}
      className="fixed z-50 bg-white border rounded-lg shadow-lg p-1 flex items-center gap-1"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: 'translate(-50%, -100%)',
      }}
    >
      <Button
        type="button"
        variant={editor.isActive('bold') ? 'default' : 'ghost'}
        size="sm"
        onClick={() => editor.chain().focus().toggleBold().run()}
        title="Bold (Ctrl+B)"
      >
        <IconBold size={16} />
      </Button>
      <Button
        type="button"
        variant={editor.isActive('italic') ? 'default' : 'ghost'}
        size="sm"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        title="Italic (Ctrl+I)"
      >
        <IconItalic size={16} />
      </Button>
      <Button
        type="button"
        variant={editor.isActive('underline') ? 'default' : 'ghost'}
        size="sm"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        title="Underline (Ctrl+U)"
      >
        <IconUnderline size={16} />
      </Button>
      <Button
        type="button"
        variant={editor.isActive('strike') ? 'default' : 'ghost'}
        size="sm"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        title="Strikethrough"
      >
        <IconStrikethrough size={16} />
      </Button>
      <Button
        type="button"
        variant={editor.isActive('highlight') ? 'default' : 'ghost'}
        size="sm"
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        title="Highlight"
      >
        <IconHighlight size={16} />
      </Button>
      <div className="w-px h-6 bg-gray-300 mx-1" />
      <Button
        type="button"
        variant={editor.isActive('link') ? 'default' : 'ghost'}
        size="sm"
        onClick={() => {
          const { from, to } = editor.state.selection
          const text = editor.state.doc.textBetween(from, to)
          if (text) {
            // Trigger link input in parent component
            editor.chain().focus().run()
          }
        }}
        title="Add Link (Ctrl+K)"
      >
        <IconLink size={16} />
      </Button>
      <Button
        type="button"
        variant={editor.isActive('code') ? 'default' : 'ghost'}
        size="sm"
        onClick={() => editor.chain().focus().toggleCode().run()}
        title="Inline Code (Ctrl+E)"
      >
        <IconCode size={16} />
      </Button>
      <div className="w-px h-6 bg-gray-300 mx-1" />
      <Button
        type="button"
        variant={editor.isActive({ textAlign: 'left' }) ? 'default' : 'ghost'}
        size="sm"
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        title="Align Left"
      >
        <IconAlignLeft size={16} />
      </Button>
      <Button
        type="button"
        variant={editor.isActive({ textAlign: 'center' }) ? 'default' : 'ghost'}
        size="sm"
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        title="Align Center"
      >
        <IconAlignCenter size={16} />
      </Button>
      <Button
        type="button"
        variant={editor.isActive({ textAlign: 'right' }) ? 'default' : 'ghost'}
        size="sm"
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        title="Align Right"
      >
        <IconAlignRight size={16} />
      </Button>
    </div>
  )
}

