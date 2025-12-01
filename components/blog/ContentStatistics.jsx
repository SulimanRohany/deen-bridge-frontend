'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Calculate reading time in minutes
 * Average reading speed: 200-250 words per minute
 * Images add ~12 seconds each
 */
const calculateReadingTime = (wordCount, imageCount) => {
  const wordsPerMinute = 225
  const secondsPerImage = 12
  
  // Calculate time from words
  const wordTimeInMinutes = wordCount / wordsPerMinute
  
  // Add time for images (convert seconds to minutes)
  const imageTimeInMinutes = (imageCount * secondsPerImage) / 60
  
  const totalMinutes = wordTimeInMinutes + imageTimeInMinutes
  
  // Round up, but show "Less than 1 min" for very short content
  if (totalMinutes < 0.5) {
    return 0 // Will be displayed as "Less than 1 min"
  }
  
  return Math.ceil(totalMinutes)
}

/**
 * Extract text content from editor HTML, excluding code blocks
 */
const extractTextFromHTML = (html) => {
  if (!html) return ''
  
  // Create a temporary DOM element
  const div = document.createElement('div')
  div.innerHTML = html
  
  // Remove code blocks (they shouldn't be counted in reading time)
  const codeBlocks = div.querySelectorAll('pre, code')
  codeBlocks.forEach(block => {
    block.remove()
  })
  
  // Get text content
  return div.textContent || div.innerText || ''
}

/**
 * Count images in editor content
 */
const countImages = (editor) => {
  if (!editor) return 0
  
  let imageCount = 0
  editor.state.doc.descendants((node) => {
    if (node.type.name === 'image') {
      imageCount++
    }
  })
  
  return imageCount
}

/**
 * Calculate statistics from editor content
 */
export const calculateStatistics = (editor) => {
  if (!editor) {
    return {
      characters: 0,
      words: 0,
      paragraphs: 0,
      sentences: 0,
      readingTime: 0,
    }
  }

  const html = editor.getHTML()
  
  // Extract text excluding code blocks
  const text = extractTextFromHTML(html)
  
  // Character count (excluding HTML tags and code blocks)
  const characters = text.length
  
  // Word count (improved to handle edge cases)
  const trimmedText = text.trim()
  const words = trimmedText 
    ? trimmedText.split(/\s+/).filter(word => word.length > 0).length 
    : 0
  
  // Paragraph count
  const paragraphs = editor.state.doc.content.childCount
  
  // Sentence count (approximate)
  const sentences = text.match(/[.!?]+/g)?.length || 0
  
  // Count images
  const imageCount = countImages(editor)
  
  // Reading time (with images)
  const readingTime = calculateReadingTime(words, imageCount)

  return {
    characters,
    words,
    paragraphs,
    sentences,
    readingTime,
  }
}

export default function ContentStatistics({ editor }) {
  const [stats, setStats] = useState({
    characters: 0,
    words: 0,
    paragraphs: 0,
    sentences: 0,
    readingTime: 0,
  })
  const [isLoading, setIsLoading] = useState(false)
  const debounceTimeoutRef = useRef(null)

  // Debounced update function
  const updateStats = useCallback(() => {
    if (!editor) return
    
    setIsLoading(true)
    
    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }
    
    // Debounce the calculation to prevent excessive recalculations
    debounceTimeoutRef.current = setTimeout(() => {
      setStats(calculateStatistics(editor))
      setIsLoading(false)
    }, 150) // 150ms debounce
  }, [editor])

  useEffect(() => {
    if (!editor) return

    // Update on content changes
    editor.on('update', updateStats)
    editor.on('selectionUpdate', updateStats)
    
    // Initial calculation
    updateStats()

    return () => {
      editor.off('update', updateStats)
      editor.off('selectionUpdate', updateStats)
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [editor, updateStats])

  if (!editor) return null

  return (
    <div className="flex items-center gap-4 text-xs text-muted-foreground px-2 py-1 border-t bg-gray-50">
      <div className="flex items-center gap-1">
        <span className="font-medium">{stats.words}</span>
        <span>words</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="font-medium">{stats.characters.toLocaleString()}</span>
        <span>characters</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="font-medium">{stats.paragraphs}</span>
        <span>paragraphs</span>
      </div>
      <div className="flex items-center gap-1">
        {isLoading ? (
          <span className="text-muted-foreground">Calculating...</span>
        ) : stats.readingTime === 0 ? (
          <>
            <span className="font-medium">Less than 1</span>
            <span>min read</span>
          </>
        ) : (
          <>
            <span className="font-medium">{stats.readingTime}</span>
            <span>min read</span>
          </>
        )}
      </div>
    </div>
  )
}

