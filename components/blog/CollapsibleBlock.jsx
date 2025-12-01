'use client'

import { Node } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from '@tiptap/react'
import { useState, useEffect } from 'react'
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react'

const CollapsibleNodeView = ({ node, updateAttributes }) => {
  const [isOpen, setIsOpen] = useState(node.attrs.open || false)
  const title = node.attrs.title || 'Click to expand'

  // Update the open state when node attributes change
  useEffect(() => {
    setIsOpen(node.attrs.open || false)
  }, [node.attrs.open])

  const handleToggle = () => {
    const newOpenState = !isOpen
    setIsOpen(newOpenState)
    updateAttributes({ open: newOpenState })
  }

  return (
    <NodeViewWrapper className="my-4 border rounded-lg" data-drag-handle>
      <div className="bg-gray-50">
        <button
          onClick={handleToggle}
          className="w-full flex items-center gap-2 p-3 text-left font-semibold hover:bg-gray-100 transition-colors"
          type="button"
        >
          {isOpen ? (
            <IconChevronDown size={20} className="text-gray-500" />
          ) : (
            <IconChevronRight size={20} className="text-gray-500" />
          )}
          <span>{title}</span>
        </button>
        <div 
          className={`border-t overflow-hidden transition-all ${!isOpen && 'hidden'}`}
        >
          <div className="p-4 prose prose-sm max-w-none w-full">
            <NodeViewContent 
              className="ProseMirror collapsible-content w-full
                [&_.ProseMirror]:outline-none
                [&_.ProseMirror_p]:my-2
                [&_.ProseMirror_p:first-child]:mt-0
                [&_.ProseMirror_p:last-child]:mb-0
                [&_.ProseMirror_ul]:my-2
                [&_.ProseMirror_ol]:my-2
                [&_.ProseMirror_li]:my-1
                [&_.ProseMirror_h1]:my-2
                [&_.ProseMirror_h2]:my-2
                [&_.ProseMirror_h3]:my-2
                [&_.ProseMirror_blockquote]:my-2
                [&_.ProseMirror_pre]:my-2"
            />
          </div>
        </div>
      </div>
    </NodeViewWrapper>
  )
}

export const CollapsibleBlock = Node.create({
  name: 'collapsible',
  group: 'block',
  content: 'block*', // Allow block-level content (paragraphs, headings, lists, etc.) - zero or more blocks
  draggable: true,

  addAttributes() {
    return {
      title: {
        default: 'Click to expand',
        parseHTML: (element) => element.getAttribute('data-title') || 'Click to expand',
        renderHTML: (attributes) => {
          return {
            'data-title': attributes.title,
          }
        },
      },
      open: {
        default: false,
        parseHTML: (element) => element.getAttribute('data-open') === 'true',
        renderHTML: (attributes) => {
          return {
            'data-open': attributes.open ? 'true' : 'false',
          }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-collapsible]',
        getAttrs: (node) => {
          if (typeof node === 'string') return false
          return {
            title: node.getAttribute('data-title') || 'Click to expand',
            open: node.getAttribute('data-open') === 'true',
          }
        },
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', { ...HTMLAttributes, 'data-collapsible': 'true', class: 'collapsible-block' }, 0]
  },

  addNodeView() {
    return ReactNodeViewRenderer(CollapsibleNodeView)
  },

  addCommands() {
    return {
      setCollapsible: (attributes) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: attributes,
          content: [
            {
              type: 'paragraph',
            },
          ],
        })
      },
    }
  },
})

