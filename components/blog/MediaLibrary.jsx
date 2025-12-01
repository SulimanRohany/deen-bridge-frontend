'use client'

import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { IconPhoto, IconSearch, IconX, IconUpload, IconTrash } from '@tabler/icons-react'
import { uploadImage } from '@/lib/imageUpload'
import { toast } from 'sonner'

const MEDIA_LIBRARY_KEY = 'blog-media-library'

/**
 * MediaLibrary component for browsing and reusing uploaded images
 */
export default function MediaLibrary({ onSelectImage, open, onOpenChange }) {
  const [images, setImages] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef(null)

  // Load images from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(MEDIA_LIBRARY_KEY)
      if (stored) {
        try {
          setImages(JSON.parse(stored))
        } catch (error) {
          console.error('Failed to load media library:', error)
        }
      }
    }
  }, [])

  // Save images to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && images.length > 0) {
      localStorage.setItem(MEDIA_LIBRARY_KEY, JSON.stringify(images))
    }
  }, [images])

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    setIsUploading(true)
    try {
      const uploadPromises = files.map(async (file) => {
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} is not a valid image file`)
          return null
        }

        try {
          const imageUrl = await uploadImage(file)
          const newImage = {
            id: Date.now() + Math.random(),
            url: imageUrl,
            name: file.name,
            size: file.size,
            uploadedAt: new Date().toISOString(),
          }
          return newImage
        } catch (error) {
          toast.error(`Failed to upload ${file.name}`)
          return null
        }
      })

      const uploadedImages = (await Promise.all(uploadPromises)).filter(Boolean)
      if (uploadedImages.length > 0) {
        setImages((prev) => [...uploadedImages, ...prev])
        toast.success(`Uploaded ${uploadedImages.length} image(s)`)
      }
    } catch (error) {
      toast.error('Failed to upload images')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDeleteImage = (imageId) => {
    setImages((prev) => prev.filter((img) => img.id !== imageId))
    toast.success('Image removed from library')
  }

  const handleSelectImage = (imageUrl) => {
    if (onSelectImage) {
      onSelectImage(imageUrl)
    }
    if (onOpenChange) {
      onOpenChange(false)
    }
  }

  const filteredImages = images.filter((img) =>
    img.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Media Library</DialogTitle>
          <DialogDescription>
            Browse and reuse your uploaded images
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search and Upload Bar */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <Input
                placeholder="Search images..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              variant="outline"
            >
              <IconUpload size={16} className="mr-2" />
              Upload
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* Image Grid */}
          <ScrollArea className="h-[400px]">
            {filteredImages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                <IconPhoto size={48} className="text-gray-400 mb-4" />
                <p className="text-gray-500 mb-2">
                  {images.length === 0
                    ? 'No images in library'
                    : 'No images match your search'}
                </p>
                {images.length === 0 && (
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    size="sm"
                    className="mt-2"
                  >
                    Upload your first image
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredImages.map((image) => (
                  <div
                    key={image.id}
                    className="group relative aspect-square border rounded-lg overflow-hidden hover:border-primary transition-colors cursor-pointer"
                    onClick={() => handleSelectImage(image.url)}
                  >
                    <img
                      src={image.url}
                      alt={image.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSelectImage(image.url)
                          }}
                        >
                          Select
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteImage(image.id)
                          }}
                        >
                          <IconTrash size={14} />
                        </Button>
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 truncate">
                      {image.name}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}

