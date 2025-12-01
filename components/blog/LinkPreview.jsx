'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { IconExternalLink, IconTrash } from '@tabler/icons-react'

export default function LinkPreview({ url, onRemove, onEdit }) {
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!url || url.startsWith('#')) {
      setPreview(null)
      return
    }

    setLoading(true)
    setError(null)

    // Simple link validation
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`)
      
      // For now, just show basic preview
      // In a full implementation, you'd fetch Open Graph metadata
      setPreview({
        url: urlObj.href,
        domain: urlObj.hostname,
        title: urlObj.hostname,
        description: `Link to ${urlObj.hostname}`,
      })
      setLoading(false)
    } catch (err) {
      setError('Invalid URL')
      setLoading(false)
    }
  }, [url])

  if (!url || url.startsWith('#')) return null

  if (loading) {
    return (
      <div className="p-2 text-xs text-muted-foreground">
        Loading preview...
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-2 text-xs text-red-500">
        {error}
      </div>
    )
  }

  if (!preview) return null

  return (
    <Card className="mt-2 max-w-md">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium truncate">
            {preview.title}
          </CardTitle>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="h-6 px-2"
            >
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="h-6 px-2"
            >
              <IconTrash size={14} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <CardDescription className="text-xs mb-2">
          {preview.description}
        </CardDescription>
        <a
          href={preview.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          {preview.domain}
          <IconExternalLink size={12} />
        </a>
      </CardContent>
    </Card>
  )
}

