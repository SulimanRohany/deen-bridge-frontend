'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { IconX } from '@tabler/icons-react'

const shortcuts = [
  {
    category: 'Text Formatting',
    items: [
      { keys: ['Ctrl', 'B'], description: 'Bold' },
      { keys: ['Ctrl', 'I'], description: 'Italic' },
      { keys: ['Ctrl', 'U'], description: 'Underline' },
      { keys: ['Ctrl', 'Shift', 'S'], description: 'Strikethrough' },
      { keys: ['Ctrl', 'Shift', 'H'], description: 'Highlight' },
    ],
  },
  {
    category: 'Headings',
    items: [
      { keys: ['Ctrl', 'Alt', '1'], description: 'Heading 1' },
      { keys: ['Ctrl', 'Alt', '2'], description: 'Heading 2' },
      { keys: ['Ctrl', 'Alt', '3'], description: 'Heading 3' },
      { keys: ['Ctrl', 'Alt', '0'], description: 'Paragraph' },
    ],
  },
  {
    category: 'Links & Media',
    items: [
      { keys: ['Ctrl', 'K'], description: 'Insert Link' },
      { keys: ['Ctrl', 'Shift', 'I'], description: 'Insert Image' },
      { keys: ['Ctrl', 'Shift', 'V'], description: 'Insert YouTube Video' },
    ],
  },
  {
    category: 'Lists',
    items: [
      { keys: ['Ctrl', 'Shift', '7'], description: 'Bullet List' },
      { keys: ['Ctrl', 'Shift', '8'], description: 'Ordered List' },
      { keys: ['Ctrl', 'Shift', '9'], description: 'Task List' },
    ],
  },
  {
    category: 'Code',
    items: [
      { keys: ['Ctrl', 'E'], description: 'Inline Code' },
      { keys: ['Ctrl', 'Alt', 'C'], description: 'Code Block' },
    ],
  },
  {
    category: 'History',
    items: [
      { keys: ['Ctrl', 'Z'], description: 'Undo' },
      { keys: ['Ctrl', 'Y'], description: 'Redo' },
      { keys: ['Ctrl', 'Shift', 'Z'], description: 'Redo (Alternative)' },
    ],
  },
  {
    category: 'Other',
    items: [
      { keys: ['Ctrl', '/'], description: 'Show Keyboard Shortcuts' },
      { keys: ['Ctrl', 'Shift', 'V'], description: 'Paste as Plain Text' },
    ],
  },
]

export default function KeyboardShortcuts({ open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Use these keyboard shortcuts to format your content faster
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 mt-4">
          {shortcuts.map((category, idx) => (
            <div key={idx}>
              <h3 className="font-semibold text-sm mb-2">{category.category}</h3>
              <div className="space-y-2">
                {category.items.map((item, itemIdx) => (
                  <div
                    key={itemIdx}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <span className="text-sm text-muted-foreground">
                      {item.description}
                    </span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((key, keyIdx) => (
                        <span key={keyIdx}>
                          <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">
                            {key}
                          </kbd>
                          {keyIdx < item.keys.length - 1 && (
                            <span className="mx-1 text-muted-foreground">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Helper to format key for display
export const formatKey = (key) => {
  const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0
  const keyMap = {
    'Ctrl': isMac ? '⌘' : 'Ctrl',
    'Alt': isMac ? '⌥' : 'Alt',
    'Shift': isMac ? '⇧' : 'Shift',
  }
  return keyMap[key] || key
}

