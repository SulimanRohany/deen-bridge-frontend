"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { 
  IconDownload, 
  IconFile, 
  IconPhoto,
  IconVideo,
  IconFileText,
  IconTrash,
  IconEdit,
  IconRefresh,
  IconFolderOpen
} from "@tabler/icons-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"

const API_BASE_URL = 'http://127.0.0.1:8000/api'

export default function ResourceList({ sessionId, canManage = false }) {
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [resourceToDelete, setResourceToDelete] = useState(null)

  useEffect(() => {
    if (sessionId) {
      fetchResources()
    }
  }, [sessionId])

  const fetchResources = async () => {
    try {
      setLoading(true)
      const authTokens = localStorage.getItem('authTokens')
      if (!authTokens) {
        throw new Error('Authentication required')
      }
      
      const parsedTokens = JSON.parse(authTokens)
      const token = parsedTokens.access

      const response = await axios.get(
        `${API_BASE_URL}/course/session/resources/?session=${sessionId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      )

      setResources(response.data.results || response.data || [])
    } catch (error) {
      console.error('Error fetching resources:', error)
      toast.error('Failed to load resources')
    } finally {
      setLoading(false)
    }
  }

  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'image':
        return <IconPhoto className="h-6 w-6 text-blue-500" />
      case 'video':
        return <IconVideo className="h-6 w-6 text-purple-500" />
      case 'document':
        return <IconFileText className="h-6 w-6 text-red-500" />
      default:
        return <IconFile className="h-6 w-6 text-gray-500" />
    }
  }

  const getFileTypeBadge = (fileType) => {
    const colors = {
      image: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      video: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      document: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      other: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    }
    return (
      <Badge className={colors[fileType] || colors.other}>
        {fileType.charAt(0).toUpperCase() + fileType.slice(1)}
      </Badge>
    )
  }

  const handleDownload = async (resource) => {
    try {
      toast.info(`Preparing download: ${resource.title}`)
      
      // Fetch the file as a blob to force download
      const authTokens = localStorage.getItem('authTokens')
      if (!authTokens) {
        throw new Error('Authentication required')
      }
      
      const parsedTokens = JSON.parse(authTokens)
      const token = parsedTokens.access

      const response = await axios.get(resource.file_url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        responseType: 'blob', // Important: get response as blob
      })

      // Create blob URL
      const blob = new Blob([response.data], { type: response.headers['content-type'] })
      const blobUrl = window.URL.createObjectURL(blob)

      // Create temporary link and trigger download
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = resource.title + (resource.file_extension || '')
      document.body.appendChild(link)
      link.click()
      
      // Cleanup
      document.body.removeChild(link)
      window.URL.revokeObjectURL(blobUrl)
      
      toast.success(`Downloaded ${resource.title}`)
    } catch (error) {
      console.error('Error downloading file:', error)
      toast.error('Failed to download file')
    }
  }

  const handleDelete = async () => {
    if (!resourceToDelete) return

    try {
      const authTokens = localStorage.getItem('authTokens')
      if (!authTokens) {
        throw new Error('Authentication required')
      }
      
      const parsedTokens = JSON.parse(authTokens)
      const token = parsedTokens.access

      await axios.delete(
        `${API_BASE_URL}/course/session/resources/${resourceToDelete.id}/`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      )

      toast.success('Resource deleted successfully')
      setResources(resources.filter(r => r.id !== resourceToDelete.id))
      setDeleteDialogOpen(false)
      setResourceToDelete(null)
    } catch (error) {
      console.error('Error deleting resource:', error)
      toast.error('Failed to delete resource')
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <IconFolderOpen className="h-5 w-5" />
                Session Resources
              </CardTitle>
              <CardDescription>
                {resources.length} {resources.length === 1 ? 'resource' : 'resources'} available
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={fetchResources}
            >
              <IconRefresh className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {resources.length === 0 ? (
            <div className="text-center py-12">
              <IconFolderOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No resources yet
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {canManage 
                  ? "Upload resources to share with students" 
                  : "Resources will appear here once uploaded by your teacher"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {resources.map((resource) => (
                <Card key={resource.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    {/* File Icon */}
                    <div className="flex-shrink-0">
                      {getFileIcon(resource.file_type)}
                    </div>

                    {/* Resource Info */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium truncate">
                            {resource.title}
                          </h4>
                          {resource.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {resource.description}
                            </p>
                          )}
                        </div>
                        {getFileTypeBadge(resource.file_type)}
                      </div>

                      {/* Meta Information */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <span className="font-medium">Size:</span> {resource.file_size_display}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="font-medium">By:</span> {resource.uploaded_by_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="font-medium">Uploaded:</span> {formatDate(resource.created_at)}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          size="sm"
                          onClick={() => handleDownload(resource)}
                          className="flex items-center gap-1"
                        >
                          <IconDownload className="h-3 w-3" />
                          Download
                        </Button>

                        {canManage && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setResourceToDelete(resource)
                              setDeleteDialogOpen(true)
                            }}
                            className="flex items-center gap-1"
                          >
                            <IconTrash className="h-3 w-3" />
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{resourceToDelete?.title}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setResourceToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

