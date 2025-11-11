"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ResourceUpload from "./resource-upload"
import ResourceList from "./resource-list"
import { IconUpload, IconFolder } from "@tabler/icons-react"

export default function SessionResources({ sessionId, userRole }) {
  const [refreshKey, setRefreshKey] = useState(0)
  
  // Check if user can manage (upload/delete) resources
  const canManage = userRole === 'teacher' || userRole === 'super_admin'

  const handleUploadComplete = () => {
    // Trigger refresh of resource list
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div className="space-y-6">
      {canManage ? (
        <Tabs defaultValue="view" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="view" className="flex items-center gap-2">
              <IconFolder className="h-4 w-4" />
              View Resources
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <IconUpload className="h-4 w-4" />
              Upload Resources
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="view" className="mt-6">
            <ResourceList 
              key={refreshKey}
              sessionId={sessionId} 
              canManage={canManage}
            />
          </TabsContent>
          
          <TabsContent value="upload" className="mt-6">
            <ResourceUpload 
              sessionId={sessionId}
              onUploadComplete={handleUploadComplete}
            />
          </TabsContent>
        </Tabs>
      ) : (
        <ResourceList 
          key={refreshKey}
          sessionId={sessionId} 
          canManage={false}
        />
      )}
    </div>
  )
}

