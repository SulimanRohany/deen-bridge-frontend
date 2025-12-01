'use client'

import { useEffect, useRef, useState } from 'react'
// Icons are rendered as SVG strings for better compatibility in static HTML

/**
 * BlogContentRenderer - Renders blog content with interactive collapsible blocks and callouts
 * Enhances static HTML by making collapsible blocks interactive
 */
export default function BlogContentRenderer({ html, className = '' }) {
  const contentRef = useRef(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient || !contentRef.current || !html) return

    // Find all collapsible blocks
    const collapsibles = contentRef.current.querySelectorAll('[data-collapsible="true"]')
    
    collapsibles.forEach((element) => {
      // Skip if already enhanced
      if (element.dataset.enhanced === 'true') return
      
      const title = element.getAttribute('data-title') || 'Click to expand'
      const isOpen = element.getAttribute('data-open') === 'true'
      
      // Get existing content
      const existingContent = element.innerHTML
      
      // Create enhanced structure
      const wrapper = document.createElement('div')
      wrapper.className = 'my-4 border rounded-lg bg-gray-50'
      wrapper.dataset.enhanced = 'true'
      
      // Create button
      const button = document.createElement('button')
      button.className = 'w-full flex items-center gap-2 p-3 text-left font-semibold hover:bg-gray-100 transition-colors'
      button.type = 'button'
      button.setAttribute('aria-expanded', isOpen.toString())
      
      // Create icon container
      const iconContainer = document.createElement('span')
      iconContainer.className = 'collapsible-icon'
      
      // Create title span
      const titleSpan = document.createElement('span')
      titleSpan.textContent = title
      
      button.appendChild(iconContainer)
      button.appendChild(titleSpan)
      
      // Create content container
      const contentContainer = document.createElement('div')
      contentContainer.className = `p-4 border-t prose prose-sm max-w-none ${!isOpen ? 'hidden' : ''}`
      contentContainer.innerHTML = existingContent
      
      // Add click handler
      let open = isOpen
      const updateIcon = () => {
        iconContainer.innerHTML = open
          ? '<svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>'
          : '<svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>'
        contentContainer.className = `p-4 border-t prose prose-sm max-w-none ${!open ? 'hidden' : ''}`
        button.setAttribute('aria-expanded', open.toString())
      }
      
      button.addEventListener('click', () => {
        open = !open
        updateIcon()
      })
      
      updateIcon() // Initial icon
      
      wrapper.appendChild(button)
      wrapper.appendChild(contentContainer)
      
      // Replace original element
      element.parentNode?.replaceChild(wrapper, element)
    })

    // Enhance callout blocks
    const callouts = contentRef.current.querySelectorAll('[data-type]')
    callouts.forEach((element) => {
      // Skip if already enhanced or if it's a collapsible
      if (element.dataset.enhanced === 'true' || element.hasAttribute('data-collapsible')) return
      
      const type = element.getAttribute('data-type')
      if (!type) return
      
      const title = element.getAttribute('data-title') || ''
      const existingContent = element.innerHTML
      
      const colors = {
        info: 'bg-blue-50 border-blue-200 text-blue-900',
        warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
        success: 'bg-green-50 border-green-200 text-green-900',
        error: 'bg-red-50 border-red-200 text-red-900',
      }

      const icons = {
        info: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
        warning: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>',
        success: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>',
        error: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>',
      }

      const wrapper = document.createElement('div')
      wrapper.className = `my-4 border-l-4 rounded-r-lg p-4 ${colors[type] || colors.info}`
      wrapper.dataset.enhanced = 'true'
      
      const inner = document.createElement('div')
      inner.className = 'flex items-start gap-3'
      
      const iconDiv = document.createElement('div')
      iconDiv.className = 'mt-0.5 flex-shrink-0'
      iconDiv.innerHTML = icons[type] || icons.info
      
      const contentWrapper = document.createElement('div')
      contentWrapper.className = 'flex-1 min-w-0'
      
      if (title) {
        const titleDiv = document.createElement('div')
        titleDiv.className = 'font-semibold mb-2'
        titleDiv.textContent = title
        contentWrapper.appendChild(titleDiv)
      }
      
      const contentDiv = document.createElement('div')
      contentDiv.className = 'prose prose-sm max-w-none'
      contentDiv.innerHTML = existingContent
      contentWrapper.appendChild(contentDiv)
      
      inner.appendChild(iconDiv)
      inner.appendChild(contentWrapper)
      wrapper.appendChild(inner)
      
      element.parentNode?.replaceChild(wrapper, element)
    })
  }, [html, isClient])

  if (!html) return null

  return (
    <div
      ref={contentRef}
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
