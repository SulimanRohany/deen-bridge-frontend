'use client'

import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { IconSearch, IconBold, IconItalic, IconLink, IconPhoto, IconList, IconCode, IconTable } from '@tabler/icons-react'

const commands = [
  {
    id: 'bold',
    label: 'Bold',
    icon: IconBold,
    keywords: ['bold', 'strong'],
    action: (editor) => editor.chain().focus().toggleBold().run(),
  },
  {
    id: 'italic',
    label: 'Italic',
    icon: IconItalic,
    keywords: ['italic', 'emphasis'],
    action: (editor) => editor.chain().focus().toggleItalic().run(),
  },
  {
    id: 'link',
    label: 'Insert Link',
    icon: IconLink,
    keywords: ['link', 'url', 'hyperlink'],
    action: (editor) => {
      // Trigger link input
      editor.chain().focus().run()
    },
  },
  {
    id: 'image',
    label: 'Insert Image',
    icon: IconPhoto,
    keywords: ['image', 'photo', 'picture'],
    action: (editor) => {
      const fileInput = document.querySelector('input[type="file"][accept="image/*"]')
      if (fileInput) fileInput.click()
    },
  },
  {
    id: 'heading1',
    label: 'Heading 1',
    icon: IconList,
    keywords: ['h1', 'heading', 'title'],
    action: (editor) => editor.chain().focus().setHeading({ level: 1 }).run(),
  },
  {
    id: 'heading2',
    label: 'Heading 2',
    icon: IconList,
    keywords: ['h2', 'heading', 'subtitle'],
    action: (editor) => editor.chain().focus().setHeading({ level: 2 }).run(),
  },
  {
    id: 'heading3',
    label: 'Heading 3',
    icon: IconList,
    keywords: ['h3', 'heading'],
    action: (editor) => editor.chain().focus().setHeading({ level: 3 }).run(),
  },
  {
    id: 'code',
    label: 'Inline Code',
    icon: IconCode,
    keywords: ['code', 'monospace'],
    action: (editor) => editor.chain().focus().toggleCode().run(),
  },
  {
    id: 'codeblock',
    label: 'Code Block',
    icon: IconCode,
    keywords: ['code block', 'pre'],
    action: (editor) => editor.chain().focus().toggleCodeBlock().run(),
  },
  {
    id: 'table',
    label: 'Insert Table',
    icon: IconTable,
    keywords: ['table', 'grid'],
    action: (editor) => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
  },
]

export default function CommandPalette({ editor, open, onOpenChange }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef(null)

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  const filteredCommands = commands.filter((cmd) => {
    const query = searchQuery.toLowerCase()
    return (
      cmd.label.toLowerCase().includes(query) ||
      cmd.keywords.some((keyword) => keyword.toLowerCase().includes(query))
    )
  })

  useEffect(() => {
    setSelectedIndex(0)
  }, [searchQuery])

  const handleSelect = (command) => {
    if (command && editor) {
      command.action(editor)
      onOpenChange(false)
      setSearchQuery('')
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % filteredCommands.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filteredCommands[selectedIndex]) {
        handleSelect(filteredCommands[selectedIndex])
      }
    } else if (e.key === 'Escape') {
      onOpenChange(false)
      setSearchQuery('')
    }
  }

  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0">
        <div className="p-2 border-b">
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input
              ref={inputRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a command or search..."
              className="pl-9"
            />
          </div>
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {filteredCommands.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No commands found</div>
          ) : (
            <div className="py-2">
              {filteredCommands.map((command, index) => {
                const Icon = command.icon
                return (
                  <button
                    key={command.id}
                    onClick={() => handleSelect(command)}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-100 transition-colors ${
                      index === selectedIndex ? 'bg-gray-100' : ''
                    }`}
                  >
                    <Icon size={20} className="text-gray-500" />
                    <span>{command.label}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

