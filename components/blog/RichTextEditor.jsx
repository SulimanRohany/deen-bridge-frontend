'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import YouTube from '@tiptap/extension-youtube'
import { TaskList, TaskItem } from '@tiptap/extension-list'
import Highlight from '@tiptap/extension-highlight'
import { Color, FontFamily, FontSize, TextStyle } from '@tiptap/extension-text-style'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
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
  IconTable,
  IconRowInsertBottom,
  IconRowInsertTop,
  IconColumnInsertRight,
  IconColumnInsertLeft,
  IconMerge,
} from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useState, useRef, useEffect } from 'react'
import EmojiPicker from 'emoji-picker-react'
import { uploadImage } from '@/lib/imageUpload'
import { toast } from 'sonner'
import KeyboardShortcuts from './KeyboardShortcuts'
import ContentStatistics from './ContentStatistics'
import { CodeBlockWithHighlight } from './CodeBlockWithHighlight'
import MediaLibrary from './MediaLibrary'
import FloatingToolbar from './FloatingToolbar'
import SearchReplace from './SearchReplace'
import CommandPalette from './CommandPalette'
import { CalloutBlock } from './CalloutBlock'
import { CollapsibleBlock } from './CollapsibleBlock'
import TableOfContents from './TableOfContents'
import { IconEdit, IconSearch, IconInfoCircle, IconChevronDown } from '@tabler/icons-react'

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

// Custom Image Node View with Resizing, Captions, and Alt Text
const ImageNodeView = ({ node, updateAttributes, getPos, editor }) => {
  const [isResizing, setIsResizing] = useState(false)
  const [startX, setStartX] = useState(0)
  const [startY, setStartY] = useState(0)
  const [startWidth, setStartWidth] = useState(0)
  const [startHeight, setStartHeight] = useState(0)
  const [isEditingCaption, setIsEditingCaption] = useState(false)
  const [isEditingAlt, setIsEditingAlt] = useState(false)
  const [captionValue, setCaptionValue] = useState(node.attrs.caption || '')
  const [altValue, setAltValue] = useState(node.attrs.alt || '')
  const imgRef = useRef(null)
  const captionInputRef = useRef(null)
  const altInputRef = useRef(null)

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
    const newWidth = Math.max(100, Math.min(1200, startWidth + deltaX)) // Min 100px, Max 1200px
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
    if (typeof pos === 'number') {
      editor.chain().focus().deleteRange({ from: pos, to: pos + 1 }).run()
    }
  }

  const handleCaptionChange = (value) => {
    setCaptionValue(value)
    updateAttributes({ caption: value })
  }

  const handleAltTextChange = (value) => {
    setAltValue(value)
    updateAttributes({ alt: value })
  }

  const handleCaptionBlur = () => {
    setIsEditingCaption(false)
    updateAttributes({ caption: captionValue })
  }

  const handleAltBlur = () => {
    setIsEditingAlt(false)
    updateAttributes({ alt: altValue })
  }

  useEffect(() => {
    if (isEditingCaption && captionInputRef.current) {
      captionInputRef.current.focus()
    }
  }, [isEditingCaption])

  useEffect(() => {
    if (isEditingAlt && altInputRef.current) {
      altInputRef.current.focus()
    }
  }, [isEditingAlt])

  // Update local state when node attributes change
  useEffect(() => {
    setCaptionValue(node.attrs.caption || '')
    setAltValue(node.attrs.alt || '')
  }, [node.attrs.caption, node.attrs.alt])

  return (
    <NodeViewWrapper className={`image-wrapper text-align-${node.attrs.textAlign || 'left'}`} data-drag-handle>
      <div className="relative inline-block w-full">
        <div className="relative">
          <img
            ref={imgRef}
            src={node.attrs.src}
            alt={node.attrs.alt || ''}
            style={{
              width: node.attrs.width || 'auto',
              height: node.attrs.height || 'auto',
            }}
            className="max-w-full h-auto"
          />
          <div
            className="absolute bottom-0 right-0 w-4 h-4 bg-primary cursor-se-resize z-10"
            onMouseDown={startResize}
          />
          <button
            className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 opacity-0 hover:opacity-100 transition-opacity z-10"
            style={{ transform: 'translate(50%, -50%)' }}
            onClick={deleteImage}
            aria-label="Delete image"
          >
            <IconTrash size={14} />
          </button>
          <button
            className="absolute top-0 left-0 bg-blue-500 text-white rounded-full p-1 opacity-0 hover:opacity-100 transition-opacity z-10"
            style={{ transform: 'translate(-50%, -50%)' }}
            onClick={() => setIsEditingAlt(true)}
            aria-label="Edit alt text"
            title="Edit alt text"
          >
            <IconEdit size={14} />
          </button>
        </div>
        
        {/* Caption */}
        <div className="mt-2">
          {isEditingCaption ? (
            <Input
              ref={captionInputRef}
              value={captionValue}
              onChange={(e) => handleCaptionChange(e.target.value)}
              onBlur={handleCaptionBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleCaptionBlur()
                }
                if (e.key === 'Escape') {
                  setIsEditingCaption(false)
                  setCaptionValue(node.attrs.caption || '')
                }
              }}
              placeholder="Add a caption..."
              className="text-sm text-center italic"
            />
          ) : (
            <div
              className="text-sm text-center text-gray-600 italic cursor-text hover:bg-gray-50 p-1 rounded min-h-[24px]"
              onClick={() => setIsEditingCaption(true)}
            >
              {node.attrs.caption || 'Click to add caption'}
            </div>
          )}
        </div>

        {/* Alt Text Editor Popover */}
        {isEditingAlt && (
          <div className="absolute top-full left-0 mt-2 bg-white border rounded-lg shadow-lg p-3 z-50 min-w-[300px]">
            <Label className="text-xs font-semibold mb-1 block">Alt Text (Accessibility)</Label>
            <Input
              ref={altInputRef}
              value={altValue}
              onChange={(e) => handleAltTextChange(e.target.value)}
              onBlur={handleAltBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAltBlur()
                }
                if (e.key === 'Escape') {
                  setIsEditingAlt(false)
                  setAltValue(node.attrs.alt || '')
                }
              }}
              placeholder="Describe the image for screen readers..."
              className="text-sm mb-2"
            />
            <p className="text-xs text-gray-500">
              {altValue.length === 0 && (
                <span className="text-amber-600">⚠️ Alt text is recommended for accessibility</span>
              )}
            </p>
          </div>
        )}
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
      caption: {
        default: null,
        parseHTML: (el) => {
          // Look for caption in next sibling or data attribute
          const captionEl = el.nextElementSibling?.classList?.contains('image-caption')
            ? el.nextElementSibling
            : null
          return captionEl?.textContent || el.getAttribute('data-caption') || null
        },
        renderHTML: (attrs) => {
          if (!attrs.caption) {
            return {}
          }
          return {
            'data-caption': attrs.caption,
          }
        },
      },
      alt: {
        default: null,
        parseHTML: (el) => el.getAttribute('alt'),
        renderHTML: (attrs) => {
          return {
            alt: attrs.alt || '',
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
const MenuBar = ({ editor, onShowShortcuts, onShowSearchReplace, onShowTableOfContents, onToggleFocusMode, showTableOfContents, showSearchReplace }) => {
  const [linkUrl, setLinkUrl] = useState('')
  const [linkType, setLinkType] = useState('external') // 'external' or 'anchor'
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [showYoutubeInput, setShowYoutubeInput] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showLinkSettings, setShowLinkSettings] = useState(false)
  const [linkColor, setLinkColor] = useState('#3b82f6') // Default link color (primary)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [currentFontFamily, setCurrentFontFamily] = useState('Default')
  const [currentFontSize, setCurrentFontSize] = useState('Default')
  const [currentFontWeight, setCurrentFontWeight] = useState('400')
  const [showMediaLibrary, setShowMediaLibrary] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
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

  // Update font family and size state when selection changes
  useEffect(() => {
    if (!editor) return

    const updateFontAttributes = () => {
      // Get attributes from the current selection
      const textStyleAttrs = editor.getAttributes('textStyle')
      
      // Handle font family
      const fontFamily = textStyleAttrs.fontFamily
      if (fontFamily) {
        setCurrentFontFamily(fontFamily)
      } else {
        // Check if selection spans multiple font families (mixed selection)
        const { from, to } = editor.state.selection
        if (from !== to) {
          // Check if all selected text has the same font family
          let allSameFont = true
          let firstFont = null
          
          editor.state.doc.nodesBetween(from, to, (node, pos) => {
            if (node.isText) {
              const marks = node.marks.filter(mark => mark.type.name === 'textStyle')
              const nodeFont = marks[0]?.attrs?.fontFamily
              if (nodeFont) {
                if (firstFont === null) {
                  firstFont = nodeFont
                } else if (firstFont !== nodeFont) {
                  allSameFont = false
                }
              } else if (firstFont !== null) {
                allSameFont = false
              }
            }
          })
          
          setCurrentFontFamily(allSameFont && firstFont ? firstFont : 'Default')
        } else {
          setCurrentFontFamily('Default')
        }
      }
      
      // Handle font size
      const fontSize = textStyleAttrs.fontSize
      if (fontSize) {
        setCurrentFontSize(fontSize)
      } else {
        // Check if selection spans multiple font sizes (mixed selection)
        const { from, to } = editor.state.selection
        if (from !== to) {
          let allSameSize = true
          let firstSize = null
          
          editor.state.doc.nodesBetween(from, to, (node, pos) => {
            if (node.isText) {
              const marks = node.marks.filter(mark => mark.type.name === 'textStyle')
              const nodeSize = marks[0]?.attrs?.fontSize
              if (nodeSize) {
                if (firstSize === null) {
                  firstSize = nodeSize
                } else if (firstSize !== nodeSize) {
                  allSameSize = false
                }
              } else if (firstSize !== null) {
                allSameSize = false
              }
            }
          })
          
          setCurrentFontSize(allSameSize && firstSize ? firstSize : 'Default')
        } else {
          setCurrentFontSize('Default')
        }
      }
      
      // Handle font weight
      const fontWeight = textStyleAttrs.fontWeight
      if (fontWeight) {
        setCurrentFontWeight(fontWeight)
      } else {
        // Check if selection spans multiple font weights (mixed selection)
        const { from, to } = editor.state.selection
        if (from !== to) {
          let allSameWeight = true
          let firstWeight = null
          
          editor.state.doc.nodesBetween(from, to, (node, pos) => {
            if (node.isText) {
              const marks = node.marks.filter(mark => mark.type.name === 'textStyle')
              const nodeWeight = marks[0]?.attrs?.fontWeight
              if (nodeWeight) {
                if (firstWeight === null) {
                  firstWeight = nodeWeight
                } else if (firstWeight !== nodeWeight) {
                  allSameWeight = false
                }
              } else if (firstWeight !== null) {
                allSameWeight = false
              }
            }
          })
          
          setCurrentFontWeight(allSameWeight && firstWeight ? firstWeight : '400')
        } else {
          setCurrentFontWeight('400')
        }
      }
    }

    // Update on selection changes
    editor.on('selectionUpdate', updateFontAttributes)
    editor.on('update', updateFontAttributes)
    
    // Initial update
    updateFontAttributes()

    return () => {
      editor.off('selectionUpdate', updateFontAttributes)
      editor.off('update', updateFontAttributes)
    }
  }, [editor])

  if (!editor) {
    return null
  }

  const toggleLinkInput = () => {
    if (!showLinkInput) {
      const existingLink = editor.getAttributes('link')
      const href = existingLink.href || ''
      // Remove # prefix for anchor links when displaying
      const displayUrl = href.startsWith('#') ? href.slice(1) : href
      setLinkUrl(displayUrl)
      setLinkType(existingLink.target === '_self' ? 'anchor' : 'external')
      // Sync link color with existing link
      if (existingLink.color) {
        setLinkColor(existingLink.color)
      }
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

  const handleImageUpload = async (files) => {
    const fileArray = Array.isArray(files) ? files : [files]
    if (fileArray.length === 0) return

    // Validate all files
    const validFiles = fileArray.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not a valid image file`)
        return false
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 10MB)`)
        return false
      }
      return true
    })

    if (validFiles.length === 0) return

    setIsUploading(true)
    setUploadProgress(0)
    
    try {
      let uploadedCount = 0
      const totalFiles = validFiles.length

      for (const file of validFiles) {
        try {
          const imageUrl = await uploadImage(file, (progress) => {
            // Calculate overall progress across all files
            const overallProgress = Math.round(
              ((uploadedCount * 100) + progress) / totalFiles
            )
            setUploadProgress(overallProgress)
          })
          
          editor
            .chain()
            .focus()
            .setImage({ src: imageUrl, width: 'auto', height: 'auto', textAlign: 'left', alt: '', caption: '' })
            .run()
          
          uploadedCount++
        } catch (error) {
          console.error('Image upload error:', error)
          
          // Fallback to base64 if server upload fails
          const reader = new FileReader()
          reader.onload = (readerEvent) => {
            editor
              .chain()
              .focus()
              .setImage({ src: readerEvent.target.result, width: 'auto', height: 'auto', textAlign: 'left', alt: '', caption: '' })
              .run()
            uploadedCount++
            if (uploadedCount === totalFiles) {
              toast.warning('Using local image encoding (server upload unavailable)')
            }
          }
          reader.onerror = () => {
            toast.error(`Error reading ${file.name}`)
          }
          reader.readAsDataURL(file)
        }
      }

      if (uploadedCount > 0) {
        toast.success(`Uploaded ${uploadedCount} image(s) successfully`)
      }
    } catch (error) {
      toast.error('Failed to upload images')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
      // Reset file input to allow uploading the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleFileInputChange = (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      handleImageUpload(files)
    }
  }

  const handleMediaLibrarySelect = (imageUrl) => {
    editor
      .chain()
      .focus()
      .setImage({ src: imageUrl, width: 'auto', height: 'auto', textAlign: 'left', alt: '', caption: '' })
      .run()
    setShowMediaLibrary(false)
  }

  const setYoutube = () => {
    if (youtubeUrl) {
      // Parse YouTube URL to extract video ID
      let videoId = ''
      const url = youtubeUrl.trim()
      
      // Handle various YouTube URL formats
      if (url.includes('youtube.com/watch?v=')) {
        videoId = url.split('v=')[1]?.split('&')[0] || ''
      } else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1]?.split('?')[0] || ''
      } else if (url.includes('youtube.com/embed/')) {
        videoId = url.split('embed/')[1]?.split('?')[0] || ''
      } else if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
        // Direct video ID
        videoId = url
      }
      
      if (videoId) {
        editor.chain().focus().setYoutubeVideo({ src: `https://www.youtube.com/embed/${videoId}` }).run()
        setYoutubeUrl('')
        setShowYoutubeInput(false)
      } else {
        // If parsing fails, try to use the URL as-is
        editor.chain().focus().setYoutubeVideo({ src: url }).run()
        setYoutubeUrl('')
        setShowYoutubeInput(false)
      }
    }
  }

  const onEmojiClick = (emojiData) => {
    editor.chain().focus().insertContent(emojiData.emoji).run()
    setShowEmojiPicker(false)
  }

  // Get current color
  const currentColor = editor.getAttributes('textStyle').color || '#000000'

  const unsetFontFamily = () => {
    editor.chain().focus().unsetFontFamily().run()
    setCurrentFontFamily('Default')
  }
  const unsetFontSize = () => {
    editor.chain().focus().unsetFontSize().run()
    setCurrentFontSize('Default')
  }
  const unsetColor = () => editor.chain().focus().unsetColor().run()
  const unsetFontWeight = () => {
    editor.chain().focus().unsetFontWeight().run()
    setCurrentFontWeight('400')
  }

  // Font family options
  const fontFamilyOptions = [
    { label: 'Default', value: null },
    { label: 'Arial', value: 'Arial' },
    { label: 'Helvetica', value: 'Helvetica' },
    { label: 'Times New Roman', value: 'Times New Roman' },
    { label: 'Georgia', value: 'Georgia' },
    { label: 'Verdana', value: 'Verdana' },
    { label: 'Courier New', value: 'Courier New' },
    { label: 'Impact', value: 'Impact' },
    { label: 'Trebuchet MS', value: 'Trebuchet MS' },
    { label: 'Palatino', value: 'Palatino' },
    { label: 'Garamond', value: 'Garamond' },
    { label: 'Bookman', value: 'Bookman' },
    { label: 'Comic Sans MS', value: 'Comic Sans MS' },
    { label: 'Tahoma', value: 'Tahoma' },
    { label: 'Lucida Sans', value: 'Lucida Sans' },
  ]

  // Font size options
  const fontSizeOptions = [
    { label: 'Default', value: null },
    { label: '8px', value: '8px' },
    { label: '10px', value: '10px' },
    { label: '12px', value: '12px' },
    { label: '14px', value: '14px' },
    { label: '16px', value: '16px' },
    { label: '18px', value: '18px' },
    { label: '20px', value: '20px' },
    { label: '24px', value: '24px' },
    { label: '28px', value: '28px' },
    { label: '32px', value: '32px' },
    { label: '36px', value: '36px' },
    { label: '42px', value: '42px' },
    { label: '48px', value: '48px' },
    { label: '56px', value: '56px' },
    { label: '64px', value: '64px' },
    { label: '72px', value: '72px' },
  ]

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
    <TooltipProvider>
      <div className="border rounded-t-lg bg-gray-50 flex flex-col gap-2 p-2">
        <div className="flex flex-wrap gap-1">
          {/* Text styles */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant={editor.isActive('bold') ? 'default' : 'outline'}
                size="sm"
                onClick={() => editor.chain().focus().toggleBold().run()}
                aria-label="Bold (Ctrl+B)"
                aria-pressed={editor.isActive('bold')}
              >
                <IconBold size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Bold (Ctrl+B)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant={editor.isActive('italic') ? 'default' : 'outline'}
                size="sm"
                onClick={() => editor.chain().focus().toggleItalic().run()}
              >
                <IconItalic size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Italic (Ctrl+I)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant={editor.isActive('underline') ? 'default' : 'outline'}
                size="sm"
                onClick={() => editor.chain().focus().toggleUnderline().run()}
              >
                <IconUnderline size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Underline (Ctrl+U)</TooltipContent>
          </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant={editor.isActive('strike') ? 'default' : 'outline'}
              size="sm"
              onClick={() => editor.chain().focus().toggleStrike().run()}
            >
              <IconStrikethrough size={16} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Strikethrough (Ctrl+Shift+S)</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant={editor.isActive('highlight') ? 'default' : 'outline'}
              size="sm"
              onClick={() => editor.chain().focus().toggleHighlight().run()}
            >
              <IconHighlight size={16} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Highlight (Ctrl+Shift+H)</TooltipContent>
        </Tooltip>

          {/* List buttons */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant={editor.isActive('bulletList') ? 'default' : 'outline'}
                size="sm"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
              >
                <IconList size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Bullet List (Ctrl+Shift+7)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant={editor.isActive('orderedList') ? 'default' : 'outline'}
                size="sm"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
              >
                <IconListNumbers size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Numbered List (Ctrl+Shift+8)</TooltipContent>
          </Tooltip>

        {/* Turn Into Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant={editor.isActive('paragraph') || editor.isActive('heading') || editor.isActive('blockquote') || editor.isActive('codeBlock') || editor.isActive('bulletList') || editor.isActive('orderedList') || editor.isActive('taskList') ? 'default' : 'outline'} 
              size="sm"
            >
              <IconPilcrow size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem 
              onClick={() => editor.chain().focus().setParagraph().run()}
              className={editor.isActive('paragraph') ? 'bg-accent' : ''}
            >
              <span className="flex items-center justify-between w-full">
                <span>Paragraph</span>
                {editor.isActive('paragraph') && <span className="ml-2 text-primary">✓</span>}
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => editor.chain().focus().setHeading({ level: 1 }).run()}
              className={editor.isActive('heading', { level: 1 }) ? 'bg-accent' : ''}
            >
              <span className="flex items-center justify-between w-full">
                <span>Heading 1</span>
                {editor.isActive('heading', { level: 1 }) && <span className="ml-2 text-primary">✓</span>}
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => editor.chain().focus().setHeading({ level: 2 }).run()}
              className={editor.isActive('heading', { level: 2 }) ? 'bg-accent' : ''}
            >
              <span className="flex items-center justify-between w-full">
                <span>Heading 2</span>
                {editor.isActive('heading', { level: 2 }) && <span className="ml-2 text-primary">✓</span>}
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => editor.chain().focus().setHeading({ level: 3 }).run()}
              className={editor.isActive('heading', { level: 3 }) ? 'bg-accent' : ''}
            >
              <span className="flex items-center justify-between w-full">
                <span>Heading 3</span>
                {editor.isActive('heading', { level: 3 }) && <span className="ml-2 text-primary">✓</span>}
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={editor.isActive('bulletList') ? 'bg-accent' : ''}
            >
              <span className="flex items-center justify-between w-full">
                <span>Bullet List</span>
                {editor.isActive('bulletList') && <span className="ml-2 text-primary">✓</span>}
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={editor.isActive('orderedList') ? 'bg-accent' : ''}
            >
              <span className="flex items-center justify-between w-full">
                <span>Numbered List</span>
                {editor.isActive('orderedList') && <span className="ml-2 text-primary">✓</span>}
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => editor.chain().focus().toggleTaskList().run()}
              className={editor.isActive('taskList') ? 'bg-accent' : ''}
            >
              <span className="flex items-center justify-between w-full">
                <span>Task List</span>
                {editor.isActive('taskList') && <span className="ml-2 text-primary">✓</span>}
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={editor.isActive('blockquote') ? 'bg-accent' : ''}
            >
              <span className="flex items-center justify-between w-full">
                <span>Blockquote</span>
                {editor.isActive('blockquote') && <span className="ml-2 text-primary">✓</span>}
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              className={editor.isActive('codeBlock') ? 'bg-accent' : ''}
            >
              <span className="flex items-center justify-between w-full">
                <span>Code Block</span>
                {editor.isActive('codeBlock') && <span className="ml-2 text-primary">✓</span>}
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              // Insert table using HTML content
              const tableHTML = '<table><thead><tr><th></th><th></th><th></th></tr></thead><tbody><tr><td></td><td></td><td></td></tr><tr><td></td><td></td><td></td></tr></tbody></table>'
              editor.chain().focus().insertContent(tableHTML).run()
            }}>
              Table
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().setCallout({ type: 'info', title: 'Info' }).run()}>
              <IconInfoCircle size={16} className="mr-2" />
              Callout Block
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().setCollapsible({ title: 'Click to expand', open: false }).run()}>
              <IconChevronDown size={16} className="mr-2" />
              Collapsible Section
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Table Controls */}
        {editor.isActive('table') && (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <IconTable size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => editor.chain().focus().addRowBefore().run()}>
                  <IconRowInsertTop size={16} className="mr-2" />
                  Add Row Above
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => editor.chain().focus().addRowAfter().run()}>
                  <IconRowInsertBottom size={16} className="mr-2" />
                  Add Row Below
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => editor.chain().focus().deleteRow().run()}>
                  <IconTrash size={16} className="mr-2" />
                  Delete Row
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => editor.chain().focus().addColumnBefore().run()}>
                  <IconColumnInsertLeft size={16} className="mr-2" />
                  Add Column Left
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => editor.chain().focus().addColumnAfter().run()}>
                  <IconColumnInsertRight size={16} className="mr-2" />
                  Add Column Right
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => editor.chain().focus().deleteColumn().run()}>
                  <IconTrash size={16} className="mr-2" />
                  Delete Column
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => editor.chain().focus().deleteTable().run()}>
                  <IconTrash size={16} className="mr-2" />
                  Delete Table
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeaderRow().run()}>
                  Toggle Header Row
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeaderColumn().run()}>
                  Toggle Header Column
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => editor.chain().focus().mergeCells().run()}>
                  <IconMerge size={16} className="mr-2" />
                  Merge Cells
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => editor.chain().focus().splitCell().run()}>
                  Split Cell
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}

        {/* Code */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant={editor.isActive('code') ? 'default' : 'outline'}
              size="sm"
              onClick={() => editor.chain().focus().toggleCode().run()}
              title="Inline Code (Ctrl+E)"
            >
              <IconCode size={16} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Inline Code (Ctrl+E)</TooltipContent>
        </Tooltip>

        {/* Alignment (for text) */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant={editor.isActive({ textAlign: 'left' }) || (!editor.isActive({ textAlign: 'center' }) && !editor.isActive({ textAlign: 'right' })) ? 'default' : 'outline'}
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
            >
              <IconAlignLeft size={16} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Align Left</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant={editor.isActive({ textAlign: 'center' }) ? 'default' : 'outline'}
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
            >
              <IconAlignCenter size={16} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Align Center</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant={editor.isActive({ textAlign: 'right' }) ? 'default' : 'outline'}
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
            >
              <IconAlignRight size={16} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Align Right</TooltipContent>
        </Tooltip>

        {/* Emoji Picker */}
        <div className="relative" ref={emojiPickerRef}>
          <Button
            type="button"
            variant={showEmojiPicker ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            title="Insert Emoji"
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
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant={editor.isActive('link') ? 'default' : 'outline'}
                  size="sm"
                  onClick={toggleLinkInput}
                >
                  <IconLink size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Insert Link (Ctrl+K)</TooltipContent>
            </Tooltip>
          <Button
            type="button"
            variant={showLinkSettings ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowLinkSettings(!showLinkSettings)}
            className="ml-1"
            title="Link Settings"
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
        <div className="relative flex gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current.click()}
            disabled={isUploading}
            title="Upload image(s)"
          >
            <IconPhoto size={16} />
            {isUploading && (
              <span className="ml-1 text-xs">{uploadProgress}%</span>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowMediaLibrary(true)}
            title="Media Library"
          >
            <IconPhoto size={16} />
          </Button>
          {isUploading && (
            <div className="absolute top-full left-0 right-0 mt-1 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={isUploading}
          multiple
        />
        <MediaLibrary
          open={showMediaLibrary}
          onOpenChange={setShowMediaLibrary}
          onSelectImage={handleMediaLibrarySelect}
        />
        <Button
          type="button"
          variant={showYoutubeInput || editor.isActive('youtube') ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowYoutubeInput(!showYoutubeInput)}
          title="Insert YouTube Video"
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
            {fontFamilyOptions.map((option) => {
              const isActive = currentFontFamily === option.label || (option.value && currentFontFamily === option.value)
              return (
                <DropdownMenuItem
                  key={option.label}
                  onClick={() => {
                    if (option.value) {
                      editor.chain().focus().setFontFamily(option.value).run()
                      setCurrentFontFamily(option.value)
                    } else {
                      unsetFontFamily()
                    }
                  }}
                  className={isActive ? 'bg-accent' : ''}
                >
                  <span className="flex items-center justify-between w-full">
                    <span>{option.label}</span>
                    {isActive && (
                      <span className="ml-2 text-primary">✓</span>
                    )}
                  </span>
                </DropdownMenuItem>
              )
            })}
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
            {fontSizeOptions.map((option) => {
              const isActive = currentFontSize === option.label || (option.value && currentFontSize === option.value)
              return (
                <DropdownMenuItem
                  key={option.label}
                  onClick={() => {
                    if (option.value) {
                      editor.chain().focus().setFontSize(option.value).run()
                      setCurrentFontSize(option.value)
                    } else {
                      unsetFontSize()
                    }
                  }}
                  className={isActive ? 'bg-accent' : ''}
                >
                  <span className="flex items-center justify-between w-full">
                    <span>{option.label}</span>
                    {isActive && (
                      <span className="ml-2 text-primary">✓</span>
                    )}
                  </span>
                </DropdownMenuItem>
              )
            })}
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
            <DropdownMenuItem 
              onClick={unsetFontWeight}
              className={currentFontWeight === '400' || currentFontWeight === 'Default' ? 'bg-accent' : ''}
            >
              <span className="flex items-center justify-between w-full">
                <span>Default</span>
                {(currentFontWeight === '400' || currentFontWeight === 'Default') && <span className="ml-2 text-primary">✓</span>}
              </span>
            </DropdownMenuItem>
            {fontWeightOptions.map((option) => {
              const isActive = currentFontWeight === option.value
              return (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => {
                    editor.chain().focus().setFontWeight(option.value).run()
                    setCurrentFontWeight(option.value)
                  }}
                  className={isActive ? 'bg-accent' : ''}
                >
                  <span className="flex items-center justify-between w-full">
                    <span>{option.label} ({option.value})</span>
                    {isActive && <span className="ml-2 text-primary">✓</span>}
                  </span>
                </DropdownMenuItem>
              )
            })}
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
          title="Undo (Ctrl+Z)"
        >
          <IconArrowBackUp size={16} />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
          title="Redo (Ctrl+Y)"
        >
          <IconArrowForwardUp size={16} />
        </Button>

        {/* Search & Replace */}
        <Button
          type="button"
          variant={showSearchReplace ? 'default' : 'outline'}
          size="sm"
          onClick={() => onShowSearchReplace && onShowSearchReplace(true)}
          title="Find & Replace (Ctrl+F)"
        >
          <IconSearch size={16} />
        </Button>

        {/* Table of Contents */}
        <Button
          type="button"
          variant={showTableOfContents ? 'default' : 'outline'}
          size="sm"
          onClick={() => onShowTableOfContents && onShowTableOfContents(!showTableOfContents)}
          title="Table of Contents"
        >
          <IconList size={16} />
        </Button>

        {/* Keyboard Shortcuts */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onShowShortcuts(true)}
          title="Keyboard Shortcuts (Ctrl+/)"
        >
          <IconCode size={16} /> ?
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
    </TooltipProvider>
  )
}

// Rich Text Editor Component
export default function RichTextEditor({ content, onChange }) {
  const [isBubbleMenuVisible, setIsBubbleMenuVisible] = useState(false)
  const [bubbleMenuPosition, setBubbleMenuPosition] = useState({ top: 0, left: 0 })
  const [isSaved, setIsSaved] = useState(true)
  const [lastSaved, setLastSaved] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [focusMode, setFocusMode] = useState(false)
  const bubbleMenuRef = useRef(null)
  const editorRef = useRef(null)
  const editorContainerRef = useRef(null)
  const autoSaveTimeoutRef = useRef(null)
  const AUTO_SAVE_KEY = 'blog-editor-autosave'
  const AUTO_SAVE_DELAY = 2000 // 2 seconds

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // Disable default code block, use custom one with syntax highlighting
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
      CodeBlockWithHighlight,
      CalloutBlock,
      CollapsibleBlock,
      Table,
      TableRow,
      TableHeader,
      TableCell,
    ],
    content,
    editorProps: {
      handlePaste: (view, event, slice) => {
        // Handle paste as plain text when Ctrl+Shift+V is pressed
        // (This is already handled in keyboard shortcuts, but we can add more logic here)
        return false // Let TipTap handle it normally
      },
      transformPastedHTML: (html) => {
        // Clean up HTML from Word/Google Docs
        let cleaned = html
        
        // Remove Word-specific classes and styles
        cleaned = cleaned.replace(/class="Mso[A-Za-z0-9]+"/g, '')
        cleaned = cleaned.replace(/style="[^"]*mso-[^"]*"/gi, '')
        
        // Remove Google Docs specific classes
        cleaned = cleaned.replace(/class="[^"]*kix-[^"]*"/g, '')
        
        // Clean up font-family declarations that might break styling
        cleaned = cleaned.replace(/font-family:\s*[^;]+;?/gi, '')
        
        // Remove empty spans
        cleaned = cleaned.replace(/<span[^>]*>\s*<\/span>/gi, '')
        
        // Convert <b> and <strong> to proper formatting
        cleaned = cleaned.replace(/<b\b[^>]*>/gi, '<strong>')
        cleaned = cleaned.replace(/<\/b>/gi, '</strong>')
        
        // Convert <i> and <em> to proper formatting
        cleaned = cleaned.replace(/<i\b[^>]*>/gi, '<em>')
        cleaned = cleaned.replace(/<\/i>/gi, '</em>')
        
        return cleaned
      },
    },
    onUpdate: ({ editor }) => {
      // Preserve whitespace by converting line breaks to paragraphs
      const html = editor.getHTML();
      onChange(html);
      
      // Auto-save to localStorage
      setIsSaved(false)
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
      autoSaveTimeoutRef.current = setTimeout(() => {
        try {
          localStorage.setItem(AUTO_SAVE_KEY, html)
          setLastSaved(new Date())
          setIsSaved(true)
        } catch (error) {
          console.error('Failed to auto-save:', error)
        }
      }, AUTO_SAVE_DELAY)
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

  // Update editor content when content prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || '', false)
    }
  }, [content, editor])

  // Keyboard shortcuts handler
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [showSearchReplace, setShowSearchReplace] = useState(false)
  const [showTableOfContents, setShowTableOfContents] = useState(false)
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  
  useEffect(() => {
    if (!editor) return

    const handleKeyDown = (event) => {
      const { ctrlKey, metaKey, shiftKey, altKey, key } = event
      const modKey = ctrlKey || metaKey // Support both Ctrl and Cmd

      // Don't handle shortcuts if user is typing in an input
      if (
        event.target.tagName === 'INPUT' ||
        event.target.tagName === 'TEXTAREA' ||
        event.target.isContentEditable
      ) {
        // Allow shortcuts in editor content
        if (!event.target.closest('.ProseMirror')) {
          return
        }
      }

      // Ctrl+/ or Cmd+/ - Show shortcuts
      if (modKey && key === '/') {
        event.preventDefault()
        setShowShortcuts(true)
        return
      }

      // Only handle shortcuts when editor is focused
      if (!editor.isFocused) return

      // Text Formatting
      if (modKey && key === 'b') {
        event.preventDefault()
        editor.chain().focus().toggleBold().run()
        return
      }
      if (modKey && key === 'i') {
        event.preventDefault()
        editor.chain().focus().toggleItalic().run()
        return
      }
      if (modKey && key === 'u') {
        event.preventDefault()
        editor.chain().focus().toggleUnderline().run()
        return
      }
      if (modKey && shiftKey && key === 'S') {
        event.preventDefault()
        editor.chain().focus().toggleStrike().run()
        return
      }
      if (modKey && shiftKey && key === 'H') {
        event.preventDefault()
        editor.chain().focus().toggleHighlight().run()
        return
      }

      // Headings
      if (modKey && altKey && key === '1') {
        event.preventDefault()
        editor.chain().focus().setHeading({ level: 1 }).run()
        return
      }
      if (modKey && altKey && key === '2') {
        event.preventDefault()
        editor.chain().focus().setHeading({ level: 2 }).run()
        return
      }
      if (modKey && altKey && key === '3') {
        event.preventDefault()
        editor.chain().focus().setHeading({ level: 3 }).run()
        return
      }
      if (modKey && altKey && key === '0') {
        event.preventDefault()
        editor.chain().focus().setParagraph().run()
        return
      }

      // Links & Media
      if (modKey && key === 'k') {
        event.preventDefault()
        // Trigger link input - this would need to be handled by MenuBar
        // For now, we'll just focus the editor
        editor.chain().focus().run()
        return
      }
      if (modKey && shiftKey && key === 'I') {
        event.preventDefault()
        // Trigger image upload
        const fileInput = document.querySelector('input[type="file"][accept="image/*"]')
        if (fileInput) fileInput.click()
        return
      }

      // Lists
      if (modKey && shiftKey && key === '7') {
        event.preventDefault()
        editor.chain().focus().toggleBulletList().run()
        return
      }
      if (modKey && shiftKey && key === '8') {
        event.preventDefault()
        editor.chain().focus().toggleOrderedList().run()
        return
      }
      if (modKey && shiftKey && key === '9') {
        event.preventDefault()
        editor.chain().focus().toggleTaskList().run()
        return
      }

      // Code
      if (modKey && key === 'e') {
        event.preventDefault()
        editor.chain().focus().toggleCode().run()
        return
      }
      if (modKey && altKey && key === 'C') {
        event.preventDefault()
        editor.chain().focus().toggleCodeBlock().run()
        return
      }

      // History
      if (modKey && key === 'z' && !shiftKey) {
        event.preventDefault()
        editor.chain().focus().undo().run()
        return
      }
      if ((modKey && key === 'y') || (modKey && shiftKey && key === 'Z')) {
        event.preventDefault()
        editor.chain().focus().redo().run()
        return
      }

      // Paste as plain text
      if (modKey && shiftKey && key === 'V') {
        event.preventDefault()
        navigator.clipboard.readText().then((text) => {
          editor.chain().focus().insertContent(text).run()
        })
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [editor])

  return (
    <div className="border rounded-lg relative flex" ref={editorContainerRef}>
      <div className="flex-1">
        <MenuBar 
          editor={editor} 
          onShowShortcuts={setShowShortcuts} 
          onShowSearchReplace={setShowSearchReplace} 
          onShowTableOfContents={setShowTableOfContents}
          showTableOfContents={showTableOfContents}
          showSearchReplace={showSearchReplace}
        />
        <KeyboardShortcuts open={showShortcuts} onOpenChange={setShowShortcuts} />
        <SearchReplace editor={editor} open={showSearchReplace} onOpenChange={setShowSearchReplace} />
        <CommandPalette editor={editor} open={showCommandPalette} onOpenChange={setShowCommandPalette} />
        <FloatingToolbar editor={editor} />
      {isDragging && (
        <div className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <p className="text-lg font-semibold">Drop images here to upload</p>
          </div>
        </div>
      )}
      <div className="relative">
        <EditorContent
          editor={editor}
          className="prose prose-lg max-w-[800px] mx-auto px-4 md:px-8 py-6 md:py-8 min-h-[400px] focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 transition-all duration-200
            [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[400px] [&_.ProseMirror]:leading-[1.7] [&_.ProseMirror]:tracking-[0.01em] [&_.ProseMirror]:text-base
            [&_.ProseMirror]:scroll-smooth
            [&_.ProseMirror_p.is-editor-empty:first-child]:before:content-[attr(data-placeholder)] [&_.ProseMirror_p.is-editor-empty:first-child]:before:float-left [&_.ProseMirror_p.is-editor-empty:first-child]:before:text-gray-400 [&_.ProseMirror_p.is-editor-empty:first-child]:before:pointer-events-none [&_.ProseMirror_p.is-editor-empty:first-child]:before:h-0 [&_.ProseMirror_p.is-editor-empty:first-child]:before:italic
            [&_.ProseMirror_::selection]:bg-blue-500 [&_.ProseMirror_::selection]:text-white
            [&_.ProseMirror_p]:mt-4 [&_.ProseMirror_p]:mb-4 [&_.ProseMirror_p]:leading-[1.7]
            [&_.ProseMirror_p:first-child]:mt-0
            [&_.ProseMirror_p:last-child]:mb-0
            [&_.ProseMirror_h1]:text-4xl [&_.ProseMirror_h1]:font-bold [&_.ProseMirror_h1]:leading-tight [&_.ProseMirror_h1]:mt-6 [&_.ProseMirror_h1]:mb-3
            [&_.ProseMirror_h2]:text-3xl [&_.ProseMirror_h2]:font-semibold [&_.ProseMirror_h2]:leading-snug [&_.ProseMirror_h2]:mt-5 [&_.ProseMirror_h2]:mb-2.5
            [&_.ProseMirror_h3]:text-2xl [&_.ProseMirror_h3]:font-semibold [&_.ProseMirror_h3]:leading-normal [&_.ProseMirror_h3]:mt-4 [&_.ProseMirror_h3]:mb-2
            [&_.ProseMirror_ul]:mt-4 [&_.ProseMirror_ul]:mb-4 [&_.ProseMirror_ul]:pl-6
            [&_.ProseMirror_ol]:mt-4 [&_.ProseMirror_ol]:mb-4 [&_.ProseMirror_ol]:pl-6
            [&_.ProseMirror_li]:mt-2 [&_.ProseMirror_li]:mb-2 [&_.ProseMirror_li]:leading-[1.7]
            [&_.ProseMirror_blockquote]:border-l-4 [&_.ProseMirror_blockquote]:border-gray-200 [&_.ProseMirror_blockquote]:pl-4 [&_.ProseMirror_blockquote]:my-6 [&_.ProseMirror_blockquote]:italic [&_.ProseMirror_blockquote]:text-gray-600
            [&_.ProseMirror_code]:bg-gray-100 [&_.ProseMirror_code]:px-1.5 [&_.ProseMirror_code]:py-0.5 [&_.ProseMirror_code]:rounded [&_.ProseMirror_code]:text-sm [&_.ProseMirror_code]:font-mono
            [&_.ProseMirror_pre]:bg-gray-800 [&_.ProseMirror_pre]:text-gray-50 [&_.ProseMirror_pre]:p-4 [&_.ProseMirror_pre]:rounded-lg [&_.ProseMirror_pre]:overflow-x-auto [&_.ProseMirror_pre]:my-6
            [&_.ProseMirror_pre_code]:bg-transparent [&_.ProseMirror_pre_code]:p-0 [&_.ProseMirror_pre_code]:text-inherit
            [&_.ProseMirror_img]:max-w-full [&_.ProseMirror_img]:h-auto [&_.ProseMirror_img]:rounded-lg [&_.ProseMirror_img]:my-6
            [&_.ProseMirror_table]:border-collapse [&_.ProseMirror_table]:my-6 [&_.ProseMirror_table]:w-full
            [&_.ProseMirror_table_td]:border [&_.ProseMirror_table_td]:border-gray-200 [&_.ProseMirror_table_td]:px-3 [&_.ProseMirror_table_td]:py-2
            [&_.ProseMirror_table_th]:border [&_.ProseMirror_table_th]:border-gray-200 [&_.ProseMirror_table_th]:px-3 [&_.ProseMirror_table_th]:py-2 [&_.ProseMirror_table_th]:bg-gray-50 [&_.ProseMirror_table_th]:font-semibold
            md:[&_.ProseMirror]:min-h-[400px]
            max-md:[&]:px-4 max-md:[&]:py-6
            max-md:[&_.ProseMirror]:text-base max-md:[&_.ProseMirror]:min-h-[300px]
            max-md:[&_.ProseMirror_h1]:text-3xl
            max-md:[&_.ProseMirror_h2]:text-2xl
            max-md:[&_.ProseMirror_h3]:text-xl"
          style={{ whiteSpace: 'pre-wrap' }}
        />
      </div>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-t px-2 md:px-4 py-2 bg-gray-50 gap-2">
        <ContentStatistics editor={editor} />
        <div className="flex items-center gap-2 text-xs text-muted-foreground" role="status" aria-live="polite">
          {isSaved ? (
            <>
              <span className="w-2 h-2 bg-green-500 rounded-full" aria-hidden="true"></span>
              <span>
                {lastSaved
                  ? `Saved ${lastSaved.toLocaleTimeString()}`
                  : 'All changes saved'}
              </span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" aria-hidden="true"></span>
              <span>Saving...</span>
            </>
          )}
        </div>
      </div>
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
      <TableOfContents editor={editor} open={showTableOfContents} onOpenChange={setShowTableOfContents} />
    </div>
  )
}