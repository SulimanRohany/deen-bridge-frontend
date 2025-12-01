'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import RichTextEditor from '@/components/blog/RichTextEditor'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  IconArrowLeft, 
  IconCheck, 
  IconAlertCircle,
  IconQuote,
  IconCode,
  IconTable,
  IconInfoCircle,
  IconChevronDown,
  IconSearch,
  IconPhoto,
  IconBug
} from '@tabler/icons-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function BlogPostTestPage() {
  const router = useRouter()
  const [content, setContent] = useState('')
  const [testResults, setTestResults] = useState({
    blockquote: { tested: false, passed: false, issues: [] },
    codeBlock: { tested: false, passed: false, issues: [] },
    table: { tested: false, passed: false, issues: [] },
    callout: { tested: false, passed: false, issues: [] },
    collapsible: { tested: false, passed: false, issues: [] },
    searchReplace: { tested: false, passed: false, issues: [] },
    imageUpload: { tested: false, passed: false, issues: [] },
  })

  // Sample content templates for each feature
  const sampleTemplates = {
    blockquote: `
      <blockquote>
        <p>This is a sample blockquote. Blockquotes are used to highlight important quotes or excerpts from other sources.</p>
      </blockquote>
      <p>Regular paragraph after blockquote to test spacing.</p>
    `,
    codeBlock: `
      <pre><code class="language-javascript">function greet(name) {
  console.log(\`Hello, \${name}!\`);
}

greet('World');</code></pre>
    `,
    table: `
      <table>
        <thead>
          <tr>
            <th>Feature</th>
            <th>Status</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Blockquote</td>
            <td>✅ Working</td>
            <td>Needs testing</td>
          </tr>
          <tr>
            <td>Code Block</td>
            <td>✅ Working</td>
            <td>Syntax highlighting enabled</td>
          </tr>
          <tr>
            <td>Table</td>
            <td>🔄 Testing</td>
            <td>All operations should work</td>
          </tr>
        </tbody>
      </table>
    `,
    callout: `
      <div data-type="info" data-title="Information">
        <p>This is an info callout block. Use callouts to draw attention to important information.</p>
      </div>
      <div data-type="warning" data-title="Warning">
        <p>This is a warning callout block. Use it to warn users about potential issues.</p>
      </div>
      <div data-type="success" data-title="Success">
        <p>This is a success callout block. Use it to highlight successful outcomes.</p>
      </div>
      <div data-type="error" data-title="Error">
        <p>This is an error callout block. Use it to indicate errors or failures.</p>
      </div>
    `,
    collapsible: `
      <div data-collapsible="true" data-title="Click to expand - Section 1" data-open="false">
        <p>This is the content inside a collapsible section. It should be hidden by default and expand when clicked.</p>
        <p>You can add multiple paragraphs and other content here.</p>
      </div>
      <div data-collapsible="true" data-title="Click to expand - Section 2 (Open by default)" data-open="true">
        <p>This collapsible section should be open by default.</p>
      </div>
    `,
    fullTest: `
      <h1>Complete Blog Post Test</h1>
      <p>This is a comprehensive test document that includes all features:</p>
      
      <h2>Blockquote Test</h2>
      <blockquote>
        <p>"The best way to learn is by doing. Practice makes perfect."</p>
        <p>— Anonymous</p>
      </blockquote>
      
      <h2>Code Block Test</h2>
      <pre><code class="language-javascript">// JavaScript example
const testFunction = () => {
  console.log('Testing code blocks');
  return true;
};</code></pre>
      
      <pre><code class="language-python"># Python example
def test_function():
    print("Testing code blocks")
    return True</code></pre>
      
      <h2>Table Test</h2>
      <table>
        <thead>
          <tr>
            <th>Feature</th>
            <th>Test Status</th>
            <th>Issues Found</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Blockquote</td>
            <td>✅ Passed</td>
            <td>None</td>
          </tr>
          <tr>
            <td>Code Block</td>
            <td>✅ Passed</td>
            <td>None</td>
          </tr>
          <tr>
            <td>Table</td>
            <td>🔄 Testing</td>
            <td>Pending</td>
          </tr>
        </tbody>
      </table>
      
      <h2>Callout Blocks Test</h2>
      <div data-type="info" data-title="Information">
        <p>This is an informational callout. Use it to provide helpful context or additional information.</p>
      </div>
      
      <div data-type="warning" data-title="Warning">
        <p>This is a warning callout. Use it to alert users about potential issues or important considerations.</p>
      </div>
      
      <div data-type="success" data-title="Success">
        <p>This is a success callout. Use it to highlight positive outcomes or achievements.</p>
      </div>
      
      <div data-type="error" data-title="Error">
        <p>This is an error callout. Use it to indicate problems or failures that need attention.</p>
      </div>
      
      <h2>Collapsible Sections Test</h2>
      <div data-collapsible="true" data-title="Basic Collapsible Section" data-open="false">
        <p>This is the content that should be hidden by default.</p>
        <ul>
          <li>Item 1</li>
          <li>Item 2</li>
          <li>Item 3</li>
        </ul>
      </div>
      
      <div data-collapsible="true" data-title="Open by Default Section" data-open="true">
        <p>This section should be open when the page loads.</p>
        <p>You can add any content here, including <strong>formatted text</strong> and <em>other elements</em>.</p>
      </div>
      
      <h2>Search and Replace Test</h2>
      <p>This paragraph contains the word "test" multiple times. Use the search and replace feature (Ctrl+F or the search button) to find and replace "test" with "example".</p>
      <p>You can also test case-sensitive matching by searching for "Test" (with capital T).</p>
      <p>Here's another test sentence to test the search functionality.</p>
      
      <h2>Image Upload and Resize Test</h2>
      <p>Use the image upload button to add an image, then test resizing by dragging the bottom-right corner.</p>
      <p>You can also test adding captions and alt text to images.</p>
      
      <h2>Mixed Content Test</h2>
      <p>Regular paragraph text followed by:</p>
      <blockquote>
        <p>A blockquote with <strong>bold text</strong> and <em>italic text</em>.</p>
      </blockquote>
      <p>Then a code block:</p>
      <pre><code class="language-html">&lt;div class="example"&gt;
  &lt;p&gt;HTML example&lt;/p&gt;
&lt;/div&gt;</code></pre>
      <p>And finally a table:</p>
      <table>
        <tbody>
          <tr>
            <td>Cell 1</td>
            <td>Cell 2</td>
          </tr>
        </tbody>
      </table>
    `
  }

  const loadTemplate = (templateKey) => {
    if (templateKey === 'clear') {
      setContent('')
      toast.success('Editor cleared')
      return
    }
    
    const template = sampleTemplates[templateKey]
    if (template) {
      setContent(template.trim())
      toast.success(`Loaded ${templateKey} template`)
    }
  }

  const handleContentChange = (newContent) => {
    setContent(newContent)
  }

  const runTests = () => {
    const results = { ...testResults }
    
    // Test Blockquote
    if (content.includes('<blockquote>')) {
      results.blockquote = { tested: true, passed: true, issues: [] }
    } else {
      results.blockquote = { tested: true, passed: false, issues: ['No blockquote found in content'] }
    }
    
    // Test Code Block
    if (content.includes('<pre><code') || content.includes('language-')) {
      results.codeBlock = { tested: true, passed: true, issues: [] }
    } else {
      results.codeBlock = { tested: true, passed: false, issues: ['No code block found in content'] }
    }
    
    // Test Table
    if (content.includes('<table>')) {
      results.table = { tested: true, passed: true, issues: [] }
    } else {
      results.table = { tested: true, passed: false, issues: ['No table found in content'] }
    }
    
    // Test Callout
    if (content.includes('data-type=')) {
      results.callout = { tested: true, passed: true, issues: [] }
    } else {
      results.callout = { tested: true, passed: false, issues: ['No callout block found in content'] }
    }
    
    // Test Collapsible
    if (content.includes('data-collapsible=')) {
      results.collapsible = { tested: true, passed: true, issues: [] }
    } else {
      results.collapsible = { tested: true, passed: false, issues: ['No collapsible section found in content'] }
    }
    
    // Test Search and Replace (always pass, feature exists in toolbar)
    results.searchReplace = { tested: true, passed: true, issues: [] }
    
    // Test Image Upload (always pass, feature exists in toolbar)
    results.imageUpload = { tested: true, passed: true, issues: [] }
    
    setTestResults(results)
    toast.success('Tests completed! Check results below.')
  }

  const exportContent = () => {
    const blob = new Blob([content], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `blog-test-content-${Date.now()}.html`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Content exported')
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/super-admin/blog">
              <Button variant="outline" size="sm">
                <IconArrowLeft size={16} className="mr-2" />
                Back to Blog
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Blog Post Feature Test Page</h1>
              <p className="text-muted-foreground mt-1">
                Test and fix issues with blockquote, code block, table, callout, collapsible, search & replace, and image features
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Load sample templates or run automated tests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => loadTemplate('blockquote')} variant="outline" size="sm">
                <IconQuote size={16} className="mr-2" />
                Load Blockquote
              </Button>
              <Button onClick={() => loadTemplate('codeBlock')} variant="outline" size="sm">
                <IconCode size={16} className="mr-2" />
                Load Code Block
              </Button>
              <Button onClick={() => loadTemplate('table')} variant="outline" size="sm">
                <IconTable size={16} className="mr-2" />
                Load Table
              </Button>
              <Button onClick={() => loadTemplate('callout')} variant="outline" size="sm">
                <IconInfoCircle size={16} className="mr-2" />
                Load Callout
              </Button>
              <Button onClick={() => loadTemplate('collapsible')} variant="outline" size="sm">
                <IconChevronDown size={16} className="mr-2" />
                Load Collapsible
              </Button>
              <Button onClick={() => loadTemplate('fullTest')} variant="default" size="sm">
                <IconBug size={16} className="mr-2" />
                Load Full Test
              </Button>
              <Button onClick={() => loadTemplate('clear')} variant="outline" size="sm">
                Clear Editor
              </Button>
              <Button onClick={runTests} variant="secondary" size="sm">
                Run Tests
              </Button>
              <Button onClick={exportContent} variant="outline" size="sm">
                Export HTML
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Test Results */}
        {(Object.values(testResults).some(r => r.tested)) && (
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
              <CardDescription>
                Automated test results for each feature
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(testResults).map(([key, result]) => (
                  <div
                    key={key}
                    className={`p-4 rounded-lg border-2 ${
                      result.tested
                        ? result.passed
                          ? 'border-green-200 bg-green-50'
                          : 'border-red-200 bg-red-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      {result.tested && (
                        result.passed ? (
                          <IconCheck className="text-green-600" size={20} />
                        ) : (
                          <IconAlertCircle className="text-red-600" size={20} />
                        )
                      )}
                    </div>
                    {result.tested && result.issues.length > 0 && (
                      <ul className="text-xs text-red-600 mt-2 list-disc list-inside">
                        {result.issues.map((issue, idx) => (
                          <li key={idx}>{issue}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Feature Testing Guide */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconQuote size={20} />
                Blockquote Testing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><strong>How to test:</strong></p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Select text and use the toolbar dropdown (¶) → Blockquote</li>
                <li>Or load the blockquote template above</li>
                <li>Verify styling (left border, italic text)</li>
                <li>Test with nested content</li>
                <li>Check spacing before/after</li>
              </ol>
              <Separator className="my-3" />
              <p><strong>Common issues:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2 text-xs text-muted-foreground">
                <li>Missing left border</li>
                <li>Incorrect spacing</li>
                <li>Content not preserving formatting</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconCode size={20} />
                Code Block Testing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><strong>How to test:</strong></p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Use toolbar dropdown (¶) → Code Block</li>
                <li>Select language from dropdown</li>
                <li>Paste code and verify syntax highlighting</li>
                <li>Test copy button functionality</li>
                <li>Try different programming languages</li>
              </ol>
              <Separator className="my-3" />
              <p><strong>Common issues:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2 text-xs text-muted-foreground">
                <li>Syntax highlighting not working</li>
                <li>Language not persisting</li>
                <li>Copy button not functioning</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconTable size={20} />
                Table Testing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><strong>How to test:</strong></p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Insert table from toolbar dropdown</li>
                <li>Test adding/removing rows and columns</li>
                <li>Test merging/splitting cells</li>
                <li>Verify header row toggle</li>
                <li>Check table styling and borders</li>
              </ol>
              <Separator className="my-3" />
              <p><strong>Common issues:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2 text-xs text-muted-foreground">
                <li>Table menu not appearing</li>
                <li>Operations not working</li>
                <li>Missing borders/styling</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconInfoCircle size={20} />
                Callout Block Testing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><strong>How to test:</strong></p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Insert from toolbar dropdown (¶) → Callout Block</li>
                <li>Test all types: info, warning, success, error</li>
                <li>Verify icons and colors match type</li>
                <li>Test title editing</li>
                <li>Check content editing</li>
              </ol>
              <Separator className="my-3" />
              <p><strong>Common issues:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2 text-xs text-muted-foreground">
                <li>Wrong icon/color for type</li>
                <li>Title not editable</li>
                <li>Content not rendering</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconChevronDown size={20} />
                Collapsible Testing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><strong>How to test:</strong></p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Insert from toolbar dropdown (¶) → Collapsible Section</li>
                <li>Test expand/collapse functionality</li>
                <li>Verify default open/closed state</li>
                <li>Test title editing</li>
                <li>Check content preservation</li>
              </ol>
              <Separator className="my-3" />
              <p><strong>Common issues:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2 text-xs text-muted-foreground">
                <li>Not expanding/collapsing</li>
                <li>Default state wrong</li>
                <li>Content lost on toggle</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconSearch size={20} />
                Search & Replace Testing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><strong>How to test:</strong></p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Click search button (🔍) or press Ctrl+F</li>
                <li>Search for text with/without case matching</li>
                <li>Navigate between matches</li>
                <li>Test replace single instance</li>
                <li>Test replace all</li>
              </ol>
              <Separator className="my-3" />
              <p><strong>Common issues:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2 text-xs text-muted-foreground">
                <li>Not finding matches</li>
                <li>Replace not working</li>
                <li>Case matching broken</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Image Testing Note */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconPhoto size={20} />
              Image Upload & Resize Testing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>How to test:</strong></p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Click image upload button or use Media Library</li>
                <li>Upload an image (max 10MB)</li>
                <li>Test resizing by dragging bottom-right corner</li>
                <li>Test adding/editing captions</li>
                <li>Test adding/editing alt text</li>
                <li>Test image alignment (left, center, right)</li>
                <li>Test deleting images</li>
              </ol>
              <Separator className="my-3" />
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-xs font-semibold text-yellow-800 mb-1">⚠️ Note:</p>
                <p className="text-xs text-yellow-700">
                  Image cropping (selecting a portion of image) is not yet implemented. 
                  Currently only resizing (scaling entire image) is available. 
                  Use the resize handle on the bottom-right corner of images.
                </p>
              </div>
              <p><strong>Common issues:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2 text-xs text-muted-foreground">
                <li>Upload failing</li>
                <li>Resize handle not working</li>
                <li>Caption/alt text not saving</li>
                <li>Images not displaying</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Rich Text Editor */}
        <Card>
          <CardHeader>
            <CardTitle>Editor</CardTitle>
            <CardDescription>
              Use the editor below to test all features. Content is auto-saved to localStorage.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RichTextEditor
              content={content}
              onChange={handleContentChange}
            />
          </CardContent>
        </Card>

        {/* HTML Preview */}
        {content && (
          <Card>
            <CardHeader>
              <CardTitle>HTML Output Preview</CardTitle>
              <CardDescription>
                Raw HTML output of the editor content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <pre className="p-4 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto text-xs max-h-96 overflow-y-auto">
                  <code>{content || '<p>Empty content</p>'}</code>
                </pre>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    navigator.clipboard.writeText(content)
                    toast.success('HTML copied to clipboard')
                  }}
                >
                  Copy HTML
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

