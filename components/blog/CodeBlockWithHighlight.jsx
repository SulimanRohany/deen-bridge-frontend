'use client'

import { CodeBlock } from '@tiptap/extension-code-block'
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react'
import { useState, useEffect, useRef } from 'react'
import Prism from 'prismjs'
import 'prismjs/themes/prism.css'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-jsx'
import 'prismjs/components/prism-tsx'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-java'
import 'prismjs/components/prism-c'
import 'prismjs/components/prism-cpp'
import 'prismjs/components/prism-csharp'
import 'prismjs/components/prism-php'
import 'prismjs/components/prism-ruby'
import 'prismjs/components/prism-go'
import 'prismjs/components/prism-rust'
import 'prismjs/components/prism-swift'
import 'prismjs/components/prism-kotlin'
import 'prismjs/components/prism-sql'
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-markdown'
import 'prismjs/components/prism-css'
import 'prismjs/components/prism-scss'
import 'prismjs/components/prism-markup' // HTML, XML, SVG, MathML
import { Button } from '@/components/ui/button'
import { IconCopy, IconCheck } from '@tabler/icons-react'

const languages = [
  { value: '', label: 'Plain Text' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'jsx', label: 'JSX' },
  { value: 'tsx', label: 'TSX' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'c', label: 'C' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'php', label: 'PHP' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'swift', label: 'Swift' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'sql', label: 'SQL' },
  { value: 'json', label: 'JSON' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'css', label: 'CSS' },
  { value: 'scss', label: 'SCSS' },
  { value: 'html', label: 'HTML' }, // Will be mapped to 'markup' for Prism
]

const CodeBlockComponent = ({ node, updateAttributes, extension }) => {
  const [language, setLanguage] = useState(node.attrs.language || '')
  const [copied, setCopied] = useState(false)
  const codeRef = useRef(null)

  useEffect(() => {
    if (codeRef.current && Prism && typeof Prism.highlightElement === 'function') {
      try {
        Prism.highlightElement(codeRef.current)
      } catch (error) {
        console.warn('Prism highlighting failed:', error)
      }
    }
  }, [language, node.content])

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage)
    updateAttributes({ language: newLanguage })
  }

  const handleCopy = async () => {
    const text = node.textContent
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const code = node.textContent
  
  // Map language for Prism.js (some languages use different names)
  const getPrismLanguage = (lang) => {
    if (lang === 'html') return 'markup'
    return lang || 'text'
  }

  return (
    <NodeViewWrapper className="code-block-wrapper relative my-4">
      <div className="flex items-center justify-between bg-gray-100 px-3 py-2 rounded-t-lg border-b">
        <select
          value={language}
          onChange={(e) => handleLanguageChange(e.target.value)}
          className="text-xs bg-white border rounded px-2 py-1"
        >
          {languages.map((lang) => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-7 px-2"
        >
          {copied ? (
            <>
              <IconCheck size={14} className="mr-1" />
              Copied
            </>
          ) : (
            <>
              <IconCopy size={14} className="mr-1" />
              Copy
            </>
          )}
        </Button>
      </div>
      <pre className="m-0 rounded-b-lg">
        <code
          ref={codeRef}
          className={`language-${getPrismLanguage(language)}`}
        >
          {code}
        </code>
      </pre>
    </NodeViewWrapper>
  )
}

export const CodeBlockWithHighlight = CodeBlock.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      language: {
        default: '',
        parseHTML: (element) => {
          const classList = element.classList
          for (const className of classList) {
            if (className.startsWith('language-')) {
              return className.replace('language-', '')
            }
          }
          return ''
        },
        renderHTML: (attributes) => {
          if (!attributes.language) {
            return {}
          }
          return {
            class: `language-${attributes.language}`,
          }
        },
      },
    }
  },
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockComponent)
  },
})

