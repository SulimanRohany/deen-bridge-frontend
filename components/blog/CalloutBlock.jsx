'use client'

import { Node } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from '@tiptap/react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { IconInfoCircle, IconAlertTriangle, IconCheck, IconX } from '@tabler/icons-react'

const CalloutNodeView = ({ node, updateAttributes }) => {
  const [isEditing, setIsEditing] = useState(false)
  const type = node.attrs.type || 'info'
  const title = node.attrs.title || ''

  const icons = {
    info: IconInfoCircle,
    warning: IconAlertTriangle,
    success: IconCheck,
    error: IconX,
  }

  const colors = {
    info: 'bg-blue-50 border-blue-200 text-blue-900',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    success: 'bg-green-50 border-green-200 text-green-900',
    error: 'bg-red-50 border-red-200 text-red-900',
  }

  const Icon = icons[type] || IconInfoCircle

  return (
    <NodeViewWrapper className="my-4" data-drag-handle>
      <div className={`border-l-4 rounded-r-lg p-4 ${colors[type]}`}>
        <div className="flex items-start gap-3">
          <Icon className="mt-0.5 flex-shrink-0" size={20} />
          <div className="flex-1 min-w-0">
            {title && (
              <div className="font-semibold mb-2">{title}</div>
            )}
            <div className="prose prose-sm max-w-none">
              <NodeViewContent className="ProseMirror" />
            </div>
          </div>
        </div>
      </div>
    </NodeViewWrapper>
  )
}

export const CalloutBlock = Node.create({
  name: 'callout',
  group: 'block',
  content: 'block+', // Allow block-level content (paragraphs, headings, lists, etc.)
  draggable: true,

  addAttributes() {
    return {
      type: {
        default: 'info',
        parseHTML: (element) => element.getAttribute('data-type') || 'info',
        renderHTML: (attributes) => {
          return {
            'data-type': attributes.type,
          }
        },
      },
      title: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-title') || '',
        renderHTML: (attributes) => {
          if (!attributes.title) return {}
          return {
            'data-title': attributes.title,
          }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type]',
        getAttrs: (node) => {
          if (typeof node === 'string') return false
          return {
            type: node.getAttribute('data-type') || 'info',
            title: node.getAttribute('data-title') || '',
          }
        },
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', { ...HTMLAttributes, class: 'callout-block' }, 0]
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalloutNodeView)
  },

  addCommands() {
    return {
      setCallout: (attributes) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: attributes,
        })
      },
    }
  },
})

