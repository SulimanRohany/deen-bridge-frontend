// Markdown conversion utilities
import TurndownService from 'turndown'

// Initialize Turndown service with custom rules
const turndownService = new TurndownService({
  headingStyle: 'atx', // Use # for headings
  codeBlockStyle: 'fenced', // Use ``` for code blocks
  bulletListMarker: '-', // Use - for bullet lists
  emDelimiter: '*', // Use * for emphasis
  strongDelimiter: '**', // Use ** for bold
})

// Add custom rules for better conversion
turndownService.addRule('strikethrough', {
  filter: ['del', 's', 'strike'],
  replacement: (content) => `~~${content}~~`,
})

turndownService.addRule('highlight', {
  filter: (node) => {
    return node.nodeName === 'MARK' || 
           (node.nodeName === 'SPAN' && node.classList?.contains('highlight'))
  },
  replacement: (content) => `==${content}==`,
})

/**
 * Convert HTML to Markdown
 * @param {string} html - HTML content
 * @returns {string} - Markdown content
 */
export const htmlToMarkdown = (html) => {
  if (!html) return ''
  try {
    return turndownService.turndown(html)
  } catch (error) {
    console.error('Error converting HTML to Markdown:', error)
    return ''
  }
}

/**
 * Convert Markdown to HTML (basic conversion)
 * Note: For full markdown support, consider using a library like marked or markdown-it
 * @param {string} markdown - Markdown content
 * @returns {string} - HTML content
 */
export const markdownToHtml = (markdown) => {
  if (!markdown) return ''
  
  let html = markdown
  
  // Basic markdown to HTML conversion
  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>')
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>')
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>')
  
  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>')
  
  // Italic
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')
  html = html.replace(/_(.+?)_/g, '<em>$1</em>')
  
  // Strikethrough
  html = html.replace(/~~(.+?)~~/g, '<s>$1</s>')
  
  // Code blocks
  html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
  
  // Inline code
  html = html.replace(/`(.+?)`/g, '<code>$1</code>')
  
  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
  
  // Images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />')
  
  // Horizontal rule
  html = html.replace(/^---$/gim, '<hr />')
  html = html.replace(/^\*\*\*$/gim, '<hr />')
  
  // Lists (basic)
  html = html.replace(/^\- (.+)$/gim, '<li>$1</li>')
  html = html.replace(/^(\d+)\. (.+)$/gim, '<li>$2</li>')
  
  // Line breaks
  html = html.replace(/\n\n/g, '</p><p>')
  html = html.replace(/\n/g, '<br />')
  
  // Wrap in paragraph if not already wrapped
  if (!html.startsWith('<')) {
    html = `<p>${html}</p>`
  }
  
  return html
}

