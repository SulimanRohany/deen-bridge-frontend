"use client"

import { useState } from "react"
import axios from "axios"
import { 
  IconUpload, 
  IconX, 
  IconFile, 
  IconPhoto,
  IconVideo,
  IconFileText
} from "@tabler/icons-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"

const API_BASE_URL = 'http://127.0.0.1:8000/api'

export default function ResourceUpload({ sessionId, onUploadComplete }) {
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({})

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return <IconPhoto className="h-8 w-8 text-blue-500" />
    if (fileType.startsWith('video/')) return <IconVideo className="h-8 w-8 text-purple-500" />
    if (fileType.includes('pdf') || fileType.includes('document')) return <IconFileText className="h-8 w-8 text-red-500" />
    return <IconFile className="h-8 w-8 text-gray-500" />
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files).map((file, index) => ({
      id: Date.now() + index,
      file,
      title: file.name.split('.').slice(0, -1).join('.'),
      description: '',
    }))
    setFiles([...files, ...selectedFiles])
  }

  const removeFile = (id) => {
    setFiles(files.filter(f => f.id !== id))
  }

  const updateFileInfo = (id, field, value) => {
    setFiles(files.map(f => f.id === id ? { ...f, [field]: value } : f))
  }

  const uploadFile = async (fileData) => {
    try {
      const authTokens = localStorage.getItem('authTokens')
      if (!authTokens) {
        throw new Error('Authentication required')
      }
      
      const parsedTokens = JSON.parse(authTokens)
      const token = parsedTokens.access

      const formData = new FormData()
      formData.append('session', sessionId)
      formData.append('title', fileData.title)
      formData.append('description', fileData.description)
      formData.append('file', fileData.file)

      const response = await axios.post(
        `${API_BASE_URL}/course/session/resources/`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            )
            setUploadProgress(prev => ({ ...prev, [fileData.id]: percentCompleted }))
          },
        }
      )

      return response.data
    } catch (error) {
      console.error('Error uploading file:', error)
      throw error
    }
  }

  const handleUploadAll = async () => {
    if (files.length === 0) {
      toast.error('Please select at least one file')
      return
    }

    setUploading(true)
    let successCount = 0
    let errorCount = 0

    for (const fileData of files) {
      try {
        await uploadFile(fileData)
        successCount++
        setFiles(prevFiles => prevFiles.filter(f => f.id !== fileData.id))
      } catch (error) {
        errorCount++
        toast.error(`Failed to upload ${fileData.title}`)
      }
    }

    setUploading(false)
    setUploadProgress({})

    if (successCount > 0) {
      toast.success(`Successfully uploaded ${successCount} file(s)`)
      if (onUploadComplete) {
        onUploadComplete()
      }
    }

    if (errorCount > 0) {
      toast.error(`Failed to upload ${errorCount} file(s)`)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconUpload className="h-5 w-5" />
          Upload Resources
        </CardTitle>
        <CardDescription>
          Upload documents, images, and other materials for this session
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Input */}
        <div className="flex items-center justify-center w-full">
          <label
            htmlFor="file-upload"
            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 border-gray-300 dark:border-gray-600"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <IconUpload className="w-10 h-10 mb-3 text-gray-400" />
              <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                PDF, DOC, Images, Videos (MAX. 50MB)
              </p>
            </div>
            <input
              id="file-upload"
              type="file"
              className="hidden"
              multiple
              onChange={handleFileSelect}
              disabled={uploading}
            />
          </label>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Selected Files ({files.length})</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {files.map((fileData) => (
                <Card key={fileData.id} className="p-4">
                  <div className="space-y-3">
                    {/* File Info Header */}
                    <div className="flex items-start gap-3">
                      {getFileIcon(fileData.file.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{fileData.file.name}</p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(fileData.file.size)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFile(fileData.id)}
                        disabled={uploading}
                      >
                        <IconX className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Title Input */}
                    <div className="space-y-1">
                      <Label htmlFor={`title-${fileData.id}`}>Title</Label>
                      <Input
                        id={`title-${fileData.id}`}
                        value={fileData.title}
                        onChange={(e) => updateFileInfo(fileData.id, 'title', e.target.value)}
                        placeholder="Resource title"
                        disabled={uploading}
                      />
                    </div>

                    {/* Description Input */}
                    <div className="space-y-1">
                      <Label htmlFor={`desc-${fileData.id}`}>Description (Optional)</Label>
                      <Textarea
                        id={`desc-${fileData.id}`}
                        value={fileData.description}
                        onChange={(e) => updateFileInfo(fileData.id, 'description', e.target.value)}
                        placeholder="Add a description"
                        rows={2}
                        disabled={uploading}
                      />
                    </div>

                    {/* Upload Progress */}
                    {uploadProgress[fileData.id] !== undefined && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Uploading...</span>
                          <span>{uploadProgress[fileData.id]}%</span>
                        </div>
                        <Progress value={uploadProgress[fileData.id]} />
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>

            {/* Upload All Button */}
            <Button
              onClick={handleUploadAll}
              disabled={uploading || files.length === 0}
              className="w-full"
            >
              {uploading ? (
                <>Uploading...</>
              ) : (
                <>
                  <IconUpload className="mr-2 h-4 w-4" />
                  Upload All ({files.length})
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

