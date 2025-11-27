// components/blog/ImageUpload.jsx
'use client'
import { useRef, useState } from 'react'
import { IconUpload, IconX, IconPhoto } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'

export default function ImageUpload({ value, onChange }) {
  const [preview, setPreview] = useState(null)
  const fileInputRef = useRef(null)

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Increased limit to 10MB to match backend settings
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB')
      return
    }

    if (!file.type.match('image.*')) {
      alert('Please select an image file')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target.result)
      onChange(file)
    }
    reader.readAsDataURL(file)
  }

  const removeImage = () => {
    setPreview(null)
    onChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
        id="featured-image-upload"
      />
      
      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-48 object-cover rounded-lg"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={removeImage}
          >
            <IconX size={16} />
          </Button>
        </div>
      ) : (
        <label
          htmlFor="featured-image-upload"
          className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <IconPhoto className="w-10 h-10 mb-3 text-gray-400" />
            <p className="mb-2 text-sm text-gray-500">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500">
              PNG, JPG, WEBP up to 10MB
            </p>
          </div>
        </label>
      )}
    </div>
  )
}