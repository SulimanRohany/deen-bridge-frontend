'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { IconDeviceMobile, IconDeviceTablet, IconDeviceDesktop, IconPrinter, IconBrandGoogle, IconBrandTwitter, IconBrandFacebook } from '@tabler/icons-react'

/**
 * Preview Panel component with multiple preview modes
 */
export default function PreviewPanel({ content, title, open, onOpenChange }) {
  const [previewMode, setPreviewMode] = useState('desktop') // 'mobile', 'tablet', 'desktop', 'print', 'seo', 'social'

  if (!open) return null

  const previewStyles = {
    mobile: { width: '375px', maxWidth: '100%' },
    tablet: { width: '768px', maxWidth: '100%' },
    desktop: { width: '100%' },
    print: { width: '8.5in', maxWidth: '100%' },
    seo: { width: '100%' },
    social: { width: '100%' },
  }

  const renderPreview = () => {
    switch (previewMode) {
      case 'seo':
        return (
          <div className="space-y-4">
            <div className="border rounded p-4 bg-white">
              <div className="text-sm text-blue-600 mb-1">https://example.com/blog/{title?.toLowerCase().replace(/\s+/g, '-') || 'post'}</div>
              <div className="text-xl text-blue-600 hover:underline mb-1">{title || 'Blog Post Title'}</div>
              <div className="text-sm text-gray-600 line-clamp-2">
                {content ? content.replace(/<[^>]*>/g, '').substring(0, 160) + '...' : 'Blog post description...'}
              </div>
            </div>
            <div className="text-sm text-gray-500">
              <p>This is how your post will appear in Google search results.</p>
            </div>
          </div>
        )
      
      case 'social':
        return (
          <div className="space-y-4">
            {/* Twitter Preview */}
            <div className="border rounded-lg p-4 bg-white">
              <div className="flex items-center gap-2 mb-2">
                <IconBrandTwitter size={20} className="text-blue-400" />
                <span className="font-semibold">Twitter</span>
              </div>
              <div className="border rounded p-3 bg-gray-50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-10 h-10 rounded-full bg-gray-300"></div>
                  <div>
                    <div className="font-semibold">Your Name</div>
                    <div className="text-sm text-gray-500">@username</div>
                  </div>
                </div>
                <div className="text-sm mb-2">
                  {title || 'Blog Post Title'}
                </div>
                {content && (
                  <div className="border rounded overflow-hidden">
                    <div className="h-48 bg-gray-200"></div>
                    <div className="p-3">
                      <div className="font-semibold text-sm mb-1">{title || 'Blog Post Title'}</div>
                      <div className="text-xs text-gray-500 line-clamp-2">
                        {content.replace(/<[^>]*>/g, '').substring(0, 100) + '...'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Facebook Preview */}
            <div className="border rounded-lg p-4 bg-white">
              <div className="flex items-center gap-2 mb-2">
                <IconBrandFacebook size={20} className="text-blue-600" />
                <span className="font-semibold">Facebook</span>
              </div>
              <div className="border rounded p-3 bg-gray-50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-10 h-10 rounded-full bg-gray-300"></div>
                  <div className="font-semibold">Your Name</div>
                </div>
                {content && (
                  <div className="border rounded overflow-hidden mb-2">
                    <div className="h-48 bg-gray-200"></div>
                    <div className="p-3">
                      <div className="font-semibold text-sm mb-1">{title || 'Blog Post Title'}</div>
                      <div className="text-xs text-gray-500 line-clamp-2">
                        {content.replace(/<[^>]*>/g, '').substring(0, 100) + '...'}
                      </div>
                    </div>
                  </div>
                )}
                <div className="text-sm">
                  {content ? content.replace(/<[^>]*>/g, '').substring(0, 200) + '...' : 'Blog post content...'}
                </div>
              </div>
            </div>
          </div>
        )

      case 'print':
        return (
          <div className="bg-white p-8" style={previewStyles.print}>
            <div 
              className="prose max-w-none print:prose-print"
              dangerouslySetInnerHTML={{ __html: content || '' }}
            />
          </div>
        )

      default:
        return (
          <div 
            className="prose max-w-none mx-auto px-4 md:px-8 py-6"
            style={previewStyles[previewMode]}
            dangerouslySetInnerHTML={{ __html: content || '' }}
          />
        )
    }
  }

  return (
    <div className="border-t bg-gray-50">
      <div className="flex items-center justify-between p-2 border-b">
        <Tabs value={previewMode} onValueChange={setPreviewMode} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="desktop" className="flex items-center gap-1">
              <IconDeviceDesktop size={16} />
              <span className="hidden sm:inline">Desktop</span>
            </TabsTrigger>
            <TabsTrigger value="tablet" className="flex items-center gap-1">
              <IconDeviceTablet size={16} />
              <span className="hidden sm:inline">Tablet</span>
            </TabsTrigger>
            <TabsTrigger value="mobile" className="flex items-center gap-1">
              <IconDeviceMobile size={16} />
              <span className="hidden sm:inline">Mobile</span>
            </TabsTrigger>
            <TabsTrigger value="print" className="flex items-center gap-1">
              <IconPrinter size={16} />
              <span className="hidden sm:inline">Print</span>
            </TabsTrigger>
            <TabsTrigger value="seo" className="flex items-center gap-1">
              <IconBrandGoogle size={16} />
              <span className="hidden sm:inline">SEO</span>
            </TabsTrigger>
            <TabsTrigger value="social" className="flex items-center gap-1">
              <IconBrandTwitter size={16} />
              <span className="hidden sm:inline">Social</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
          Close
        </Button>
      </div>
      <div className="overflow-auto p-4" style={{ maxHeight: '600px' }}>
        <div className="flex justify-center">
          {renderPreview()}
        </div>
      </div>
    </div>
  )
}

