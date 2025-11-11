'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import TextAlign from '@tiptap/extension-text-align'
// import { Placeholder } from '@tiptap/extension-placeholder'
import { Placeholder } from '@tiptap/extensions'
import YouTube from '@tiptap/extension-youtube'
// import { TaskList, TaskItem } from '@tiptap/extension-task-list'
import { TaskList, TaskItem } from '@tiptap/extension-list'
import Highlight from '@tiptap/extension-highlight'
import { Color, FontFamily, FontSize, TextStyle } from '@tiptap/extension-text-style'
import { Node } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import {
  IconBold,
  IconItalic,
  IconUnderline,
  IconStrikethrough,
  IconHighlight,
  IconPilcrow,
  IconCode,
  IconAlignLeft,
  IconAlignCenter,
  IconAlignRight,
  IconLink,
  IconPhoto,
  IconBrandYoutube,
  IconMinus,
  IconArrowBackUp,
  IconArrowForwardUp,
  IconTypography,
  IconAbc,
  IconPalette,
  IconTrash,
  IconList,
  IconListNumbers,
  IconMoodSmile,
  IconWeight,
  IconAnchor,
} from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useState, useRef, useEffect } from 'react'
import EmojiPicker from 'emoji-picker-react'

// Custom Link Extension with enhanced styling
const CustomLink = Link.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      class: {
        default: 'external-link',
        parseHTML: element => element.getAttribute('class'),
        renderHTML: attributes => {
          return {
            class: attributes.class,
          }
        },
      },
      color: {
        default: '#3b82f6', // Default link color (primary blue-500)
        parseHTML: element => element.style.color,
        renderHTML: attributes => {
          if (!attributes.color) {
            return {}
          }
          return {
            style: `color: ${attributes.color}`,
          }
        },
      },
      target: {
        default: '_blank',
        parseHTML: element => element.getAttribute('target'),
        renderHTML: attributes => {
          if (!attributes.target) {
            return {}
          }
          return {
            target: attributes.target,
          }
        },
      },
    }
  },
  renderHTML({ HTMLAttributes }) {
    // Always add underline to links
    const style = HTMLAttributes.style ? `${HTMLAttributes.style}; text-decoration: underline;` : 'text-decoration: underline;'
    
    return [
      'a',
      { ...HTMLAttributes, style },
      0,
    ]
  },
})

// Custom Font Weight Extension
const FontWeight = TextStyle.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      fontWeight: {
        default: null,
        parseHTML: element => element.style.fontWeight,
        renderHTML: attributes => {
          if (!attributes.fontWeight) {
            return {}
          }
          return {
            style: `font-weight: ${attributes.fontWeight}`,
          }
        },
      },
    }
  },
  addCommands() {
    return {
      setFontWeight: fontWeight => ({ chain }) => {
        return chain()
          .setMark('textStyle', { fontWeight })
          .run()
      },
      unsetFontWeight: () => ({ chain }) => {
        return chain()
          .setMark('textStyle', { fontWeight: null })
          .removeEmptyTextStyle()
          .run()
      },
    }
  },
})

// Custom Image Node View with Resizing
const ImageNodeView = ({ node, updateAttributes, getPos, editor }) => {
  const [isResizing, setIsResizing] = useState(false)
  const [startX, setStartX] = useState(0)
  const [startY, setStartY] = useState(0)
  const [startWidth, setStartWidth] = useState(0)
  const [startHeight, setStartHeight] = useState(0)
  const imgRef = useRef(null)

  const startResize = (e) => {
    e.preventDefault()
    setIsResizing(true)
    setStartX(e.clientX)
    setStartY(e.clientY)
    setStartWidth(parseInt(node.attrs.width || imgRef.current.naturalWidth, 10))
    setStartHeight(parseInt(node.attrs.height || imgRef.current.naturalHeight, 10))
  }

  const resize = (e) => {
    if (!isResizing) return
    const deltaX = e.clientX - startX
    const newWidth = Math.max(100, startWidth + deltaX)
    const aspectRatio = startWidth / startHeight
    const newHeight = Math.round(newWidth / aspectRatio)
    updateAttributes({
      width: `${newWidth}px`,
      height: `${newHeight}px`,
    })
  }

  const stopResize = () => {
    setIsResizing(false)
  }

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize)
      window.addEventListener('mouseup', stopResize)
    }
    return () => {
      window.removeEventListener('mousemove', resize)
      window.removeEventListener('mouseup', stopResize)
    }
  }, [isResizing])

  const deleteImage = () => {
    const pos = getPos()
    editor.chain().focus().deleteRange({ from: pos, to: pos + 1 }).run()
  }

  return (
    <NodeViewWrapper className={`image-wrapper text-align-${node.attrs.textAlign || 'left'}`} data-drag-handle>
      <div className="relative inline-block">
        <img
          ref={imgRef}
          src={node.attrs.src}
          alt={node.attrs.alt || ''}
          style={{
            width: node.attrs.width || 'auto',
            height: node.attrs.height || 'auto',
          }}
        />
        <div
          className="absolute bottom-0 right-0 w-4 h-4 bg-primary cursor-se-resize"
          onMouseDown={startResize}
        />
        <button
          className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 opacity-0 hover:opacity-100 transition-opacity"
          style={{ transform: 'translate(50%, -50%)' }}
          onClick={deleteImage}
        >
          <svg
            stroke="currentColor"
            fill="currentColor"
            strokeWidth="0"
            viewBox="0 0 24 24"
            height="16"
            width="16"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M6 6h12v12H6z" fill="none" />
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z" />
          </svg>
        </button>
      </div>
    </NodeViewWrapper>
  )
}

// Custom Image Extension
const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      textAlign: {
        default: 'left',
        parseHTML: (el) => el.getAttribute('data-align') || el.style.textAlign || 'left',
        renderHTML: (attrs) => {
          return {
            style: `text-align: ${attrs.textAlign}`,
            'data-align': attrs.textAlign,
          }
        },
      },
      width: {
        default: null,
        parseHTML: (el) => el.getAttribute('width'),
        renderHTML: (attrs) => {
          if (!attrs.width) {
            return {}
          }
          return {
            width: attrs.width,
          }
        },
      },
      height: {
        default: null,
        parseHTML: (el) => el.getAttribute('height'),
        renderHTML: (attrs) => {
          if (!attrs.height) {
            return {}
          }
          return {
            height: attrs.height,
          }
        },
      },
    }
  },
  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView)
  },
  draggable: true,
})

// Menu Bar Component
const MenuBar = ({ editor }) => {
  const [linkUrl, setLinkUrl] = useState('')
  const [linkType, setLinkType] = useState('external') // 'external' or 'anchor'
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [showYoutubeInput, setShowYoutubeInput] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showLinkSettings, setShowLinkSettings] = useState(false)
  const [linkColor, setLinkColor] = useState('#3b82f6') // Default link color (primary)
  const fileInputRef = useRef(null)
  const emojiPickerRef = useRef(null)
  const linkSettingsRef = useRef(null)

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false)
      }
      if (linkSettingsRef.current && !linkSettingsRef.current.contains(event.target)) {
        setShowLinkSettings(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  if (!editor) {
    return null
  }

  const toggleLinkInput = () => {
    if (!showLinkInput) {
      const existingLink = editor.getAttributes('link')
      setLinkUrl(existingLink.href || '')
      setLinkType(existingLink.target === '_self' ? 'anchor' : 'external')
    }
    setShowLinkInput(!showLinkInput)
    setShowLinkSettings(false)
  }

  const setLink = () => {
    if (linkUrl === '') {
      editor.chain().focus().unsetLink().run()
    } else {
      // Add # for anchor links if not present
      const finalUrl = linkType === 'anchor' && !linkUrl.startsWith('#') ? `#${linkUrl}` : linkUrl
      
      editor.chain().focus().setLink({ 
        href: finalUrl, 
        target: linkType === 'anchor' ? '_self' : '_blank',
        class: linkType === 'anchor' ? 'anchor-link' : 'external-link',
        color: linkColor
      }).run()
    }
    setLinkUrl('')
    setShowLinkInput(false)
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (readerEvent) => {
        editor
          .chain()
          .focus()
          .setImage({ src: readerEvent.target.result, width: 'auto', height: 'auto', textAlign: 'left' })
          .run()
      }
      reader.readAsDataURL(file)
    }
  }

  const setYoutube = () => {
    if (youtubeUrl) {
      editor.chain().focus().setYoutubeVideo({ src: youtubeUrl }).run()
      setYoutubeUrl('')
      setShowYoutubeInput(false)
    }
  }

  const onEmojiClick = (emojiData) => {
    editor.chain().focus().insertContent(emojiData.emoji).run()
    setShowEmojiPicker(false)
  }

  const currentFontFamily = editor.getAttributes('textStyle').fontFamily || 'Default'
  const currentFontSize = editor.getAttributes('textStyle').fontSize || 'Default'
  const currentColor = editor.getAttributes('textStyle').color || '#000000'
  const currentFontWeight = editor.getAttributes('textStyle').fontWeight || '400'

  const unsetFontFamily = () => editor.chain().focus().unsetFontFamily().run()
  const unsetFontSize = () => editor.chain().focus().unsetFontSize().run()
  const unsetColor = () => editor.chain().focus().unsetColor().run()
  const unsetFontWeight = () => editor.chain().focus().unsetFontWeight().run()

  // Color palette with predefined colors
  const colorPalette = [
    '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00', 
    '#00ffff', '#ff00ff', '#c0c0c0', '#808080', '#800000', '#808000', 
    '#008000', '#800080', '#008080', '#000080', '#ff6b35', '#004e89',
    '#2ec4b6', '#e71d36', '#f46036', '#5b85aa', '#413c58', '#a3a3a3'
  ]

  // Font weight options
  const fontWeightOptions = [
    { label: 'Thin', value: '100' },
    { label: 'Extra Light', value: '200' },
    { label: 'Light', value: '300' },
    { label: 'Normal', value: '400' },
    { label: 'Medium', value: '500' },
    { label: 'Semi Bold', value: '600' },
    { label: 'Bold', value: '700' },
    { label: 'Extra Bold', value: '800' },
    { label: 'Black', value: '900' },
  ]

  return (
    <div className="border rounded-t-lg bg-gray-50 flex flex-col gap-2 p-2">
      <div className="flex flex-wrap gap-1">
        {/* Text styles */}
        <Button
          type="button"
          variant={editor.isActive('bold') ? 'default' : 'outline'}
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <IconBold size={16} />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('italic') ? 'default' : 'outline'}
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <IconItalic size={16} />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('underline') ? 'default' : 'outline'}
          size="sm"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <IconUnderline size={16} />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('strike') ? 'default' : 'outline'}
          size="sm"
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <IconStrikethrough size={16} />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('highlight') ? 'default' : 'outline'}
          size="sm"
          onClick={() => editor.chain().focus().toggleHighlight().run()}
        >
          <IconHighlight size={16} />
        </Button>

        {/* List buttons */}
        <Button
          type="button"
          variant={editor.isActive('bulletList') ? 'default' : 'outline'}
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <IconList size={16} />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('orderedList') ? 'default' : 'outline'}
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <IconListNumbers size={16} />
        </Button>

        {/* Turn Into Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <IconPilcrow size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => editor.chain().focus().setParagraph().run()}>
              Paragraph
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().setHeading({ level: 1 }).run()}>
              Heading 1
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().setHeading({ level: 2 }).run()}>
              Heading 2
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().setHeading({ level: 3 }).run()}>
              Heading 3
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().toggleBulletList().run()}>
              Bullet List
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().toggleOrderedList().run()}>
              Numbered List
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().toggleTaskList().run()}>
              Task List
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().toggleBlockquote().run()}>
              Blockquote
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
              Code Block
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Code */}
        <Button
          type="button"
          variant={editor.isActive('code') ? 'default' : 'outline'}
          size="sm"
          onClick={() => editor.chain().focus().toggleCode().run()}
        >
          <IconCode size={16} />
        </Button>

        {/* Alignment (for text) */}
        <Button
          type="button"
          variant={editor.isActive({ textAlign: 'left' }) ? 'default' : 'outline'}
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
        >
          <IconAlignLeft size={16} />
        </Button>
        <Button
          type="button"
          variant={editor.isActive({ textAlign: 'center' }) ? 'default' : 'outline'}
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
        >
          <IconAlignCenter size={16} />
        </Button>
        <Button
          type="button"
          variant={editor.isActive({ textAlign: 'right' }) ? 'default' : 'outline'}
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
        >
          <IconAlignRight size={16} />
        </Button>

        {/* Emoji Picker */}
        <div className="relative" ref={emojiPickerRef}>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          >
            <IconMoodSmile size={16} />
          </Button>
          {showEmojiPicker && (
            <div className="absolute z-50 mt-1">
              <EmojiPicker onEmojiClick={onEmojiClick} />
            </div>
          )}
        </div>

        {/* Link button with settings */}
        <div className="relative" ref={linkSettingsRef}>
          <Button
            type="button"
            variant={editor.isActive('link') ? 'default' : 'outline'}
            size="sm"
            onClick={toggleLinkInput}
          >
            <IconLink size={16} />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowLinkSettings(!showLinkSettings)}
            className="ml-1"
          >
            ...
          </Button>
          {showLinkSettings && (
            <div className="absolute z-50 mt-1 bg-white p-3 rounded-md shadow-lg border w-64">
              <h4 className="font-medium mb-2">Link Settings</h4>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="link-color">Link Color</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      id="link-color"
                      value={linkColor}
                      onChange={(e) => setLinkColor(e.target.value)}
                      className="h-8 w-8 cursor-pointer"
                    />
                    <Input
                      value={linkColor}
                      onChange={(e) => setLinkColor(e.target.value)}
                      className="flex-1 h-8"
                    />
                  </div>
                </div>
                <div>
                  <Label>Default Link Type</Label>
                  <RadioGroup 
                    value={linkType} 
                    onValueChange={setLinkType}
                    className="mt-1"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="external" id="external" />
                      <Label htmlFor="external" className="cursor-pointer">External Link</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="anchor" id="anchor" />
                      <Label htmlFor="anchor" className="cursor-pointer">Anchor Link</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Inserts */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current.click()}
        >
          <IconPhoto size={16} />
        </Button>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleImageUpload}
          className="hidden"
        />
        <Button
          type="button"
          variant={editor.isActive('youtube') ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowYoutubeInput(!showYoutubeInput)}
        >
          <IconBrandYoutube size={16} />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <IconMinus size={16} />
        </Button>

        {/* Font Family */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <IconTypography size={16} /> {currentFontFamily}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="max-h-60 overflow-y-auto">
            <DropdownMenuItem onClick={unsetFontFamily}>Default</DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().setFontFamily('Arial').run()}>
              Arial
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().setFontFamily('Helvetica').run()}>
              Helvetica
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().setFontFamily('Times New Roman').run()}>
              Times New Roman
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().setFontFamily('Georgia').run()}>
              Georgia
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().setFontFamily('Verdana').run()}>
              Verdana
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().setFontFamily('Courier New').run()}>
              Courier New
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().setFontFamily('Impact').run()}>
              Impact
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().setFontFamily('Trebuchet MS').run()}>
              Trebuchet MS
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().setFontFamily('Palatino').run()}>
              Palatino
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().setFontFamily('Garamond').run()}>
              Garamond
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().setFontFamily('Bookman').run()}>
              Bookman
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().setFontFamily('Comic Sans MS').run()}>
              Comic Sans MS
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().setFontFamily('Tahoma').run()}>
              Tahoma
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().setFontFamily('Lucida Sans').run()}>
              Lucida Sans
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Font Size */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <IconAbc size={16} /> {currentFontSize}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="max-h-60 overflow-y-auto">
            <DropdownMenuItem onClick={unsetFontSize}>Default</DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().setFontSize('8px').run()}>
              8px
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().setFontSize('10px').run()}>
              10px
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().setFontSize('12px').run()}>
              12px
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().setFontSize('14px').run()}>
              14px
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().setFontSize('16px').run()}>
              16px
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().setFontSize('18px').run()}>
              18px
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().setFontSize('20px').run()}>
              20px
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().setFontSize('24px').run()}>
              24px
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().setFontSize('28px').run()}>
              28px
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().setFontSize('32px').run()}>
              32px
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().setFontSize('36px').run()}>
              36px
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().setFontSize('42px').run()}>
              42px
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().setFontSize('48px').run()}>
              48px
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().setFontSize('56px').run()}>
              56px
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().setFontSize('64px').run()}>
              64px
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().setFontSize('72px').run()}>
              72px
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Font Weight */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <IconWeight size={16} /> {currentFontWeight}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={unsetFontWeight}>Default</DropdownMenuItem>
            {fontWeightOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => editor.chain().focus().setFontWeight(option.value).run()}
              >
                {option.label} ({option.value})
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Font Color */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="relative">
              <IconPalette size={16} style={{ color: currentColor }} />
              <div 
                className="absolute bottom-0 right-0 w-2 h-2 rounded-full border border-white"
                style={{ backgroundColor: currentColor }}
              />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-4">
            <h4 className="font-medium mb-3">Text Color</h4>
            
            {/* Color Palette Grid */}
            <div className="grid grid-cols-8 gap-2 mb-4">
              {colorPalette.map((color) => (
                <button
                  key={color}
                  className="w-6 h-6 rounded border cursor-pointer hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  onClick={() => editor.chain().focus().setColor(color).run()}
                  title={color}
                />
              ))}
            </div>
            
            {/* Custom Color Picker */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm">Custom:</span>
              <input
                type="color"
                value={currentColor}
                onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
                className="flex-1 h-8 cursor-pointer"
              />
            </div>
            
            {/* Current Color Display and Reset */}
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded border"
                  style={{ backgroundColor: currentColor }}
                />
                <span className="text-xs">{currentColor}</span>
              </div>
              <Button variant="outline" size="sm" onClick={unsetColor}>
                Reset
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* History */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <IconArrowBackUp size={16} />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <IconArrowForwardUp size={16} />
        </Button>
      </div>

      {showLinkInput && (
        <div className="flex items-center gap-2">
          <Input
            placeholder={linkType === 'anchor' ? 'Enter anchor ID (without #)' : 'Enter URL'}
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            className="flex-1"
          />
          <Button type="button" size="sm" onClick={setLink}>
            Set Link
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowLinkInput(false)}
          >
            Cancel
          </Button>
        </div>
      )}

      {showYoutubeInput && (
        <div className="flex items-center gap-2">
          <Input
            placeholder="Enter YouTube URL"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            className="flex-1"
          />
          <Button type="button" size="sm" onClick={setYoutube}>
            Add Video
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowYoutubeInput(false)}
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  )
}

// Rich Text Editor Component
export default function RichTextEditor({ content, onChange }) {
  const [isBubbleMenuVisible, setIsBubbleMenuVisible] = useState(false)
  const [bubbleMenuPosition, setBubbleMenuPosition] = useState({ top: 0, left: 0 })
  const bubbleMenuRef = useRef(null)
  const editorRef = useRef(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        bulletList: {
          HTMLAttributes: {
            class: 'list-disc list-outside ms-5',
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: 'list-decimal list-outside ms-5',
          },
        },
        listItem: {
          HTMLAttributes: {
            class: 'leading-7',
          },
        },
      }),
      Underline,
      CustomLink.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'external-link',
        },
      }),
      CustomImage.configure({
        allowBase64: true,
        inline: false,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph', 'image'],
      }),
      Placeholder.configure({
        placeholder: 'Write your blog post here...',
      }),
      YouTube.configure({
        inline: false,
        width: 640,
        height: 360,
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Highlight,
      TextStyle,
      FontFamily,
      FontSize,
      Color,
      FontWeight,
    ],
    content,
    onUpdate: ({ editor }) => {
      // Preserve whitespace by converting line breaks to paragraphs
      const html = editor.getHTML();
      onChange(html);
    },
    onSelectionUpdate: ({ editor }) => {
      const { state } = editor
      const { from } = state.selection
      const node = state.doc.nodeAt(from)

      if (node && node.type.name === 'image') {
        const domNode = editor.view.nodeDOM(from)
        if (domNode) {
          const rect = domNode.getBoundingClientRect()
          setBubbleMenuPosition({
            top: rect.bottom + window.scrollY,
            left: rect.left + window.scrollX + rect.width / 2, // Center below the image
          })
          setIsBubbleMenuVisible(true)
        }
      } else {
        setIsBubbleMenuVisible(false)
      }
    },
    immediatelyRender: false,
  })

  useEffect(() => {
    if (editor) {
      editorRef.current = editor
    }
  }, [editor])

  return (
    <div className="border rounded-lg relative">
      <MenuBar editor={editor} />
      <EditorContent
        editor={editor}
        className="prose max-w-none p-4 min-h-[300px] focus:outline-none"
        style={{ whiteSpace: 'pre-wrap' }}
      />
      {isBubbleMenuVisible && editor && (
        <div
          ref={bubbleMenuRef}
          className="bubble-menu fixed bg-white shadow-lg rounded-full p-1 flex items-center gap-1 z-50"
          style={{
            top: `${bubbleMenuPosition.top}px`,
            left: `${bubbleMenuPosition.left}px`,
            transform: 'translateX(-50%)', // Center the menu horizontally
          }}
        >
          <Button
            variant={editor.isActive({ textAlign: 'left' }) ? 'default' : 'ghost'}
            size="icon"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
          >
            <IconAlignLeft size={16} />
          </Button>
          <Button
            variant={editor.isActive({ textAlign: 'center' }) ? 'default' : 'ghost'}
            size="icon"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
          >
            <IconAlignCenter size={16} />
          </Button>
          <Button
            variant={editor.isActive({ textAlign: 'right' }) ? 'default' : 'ghost'}
            size="icon"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
          >
            <IconAlignRight size={16} />
          </Button>
          <div className="w-px h-6 bg-gray-300 mx-1" /> {/* Separator */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().deleteSelection().run()}
          >
            <IconTrash size={16} />
          </Button>
        </div>
      )}
    </div>
  )
}