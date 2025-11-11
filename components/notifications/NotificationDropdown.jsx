"use client"

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { 
  IconBellOff, 
  IconCheck, 
  IconTrash,
  IconSettings,
  IconLoader2,
  IconPlugConnected,
  IconPlugConnectedX
} from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import NotificationItem from './NotificationItem'
import { Badge } from '@/components/ui/badge'

export default function NotificationDropdown({
  notifications = [],
  loading = false,
  isConnected = false,
  onMarkAsRead,
  onMarkAsUnread,
  onMarkAllAsRead,
  onDelete,
  onDeleteAll,
  onClose,
  triggerRef,
  className
}) {
  const router = useRouter()
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Don't close if clicking on the trigger button (bell icon)
      if (triggerRef?.current && triggerRef.current.contains(event.target)) {
        return
      }
      
      // Close if clicking outside the dropdown
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose?.()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose, triggerRef])

  const handleNotificationClick = (url) => {
    if (url) {
      router.push(url)
      onClose?.()
    }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div
      ref={dropdownRef}
      className={cn(
        "absolute right-0 top-full mt-2 w-96 max-w-[calc(100vw-2rem)]",
        "bg-background border rounded-xl shadow-2xl",
        "animate-in fade-in-0 zoom-in-95 slide-in-from-top-2",
        "z-50",
        className
      )}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold">Notifications</h3>
              {/* Connection status indicator */}
              {isConnected ? (
                <Badge variant="outline" className="h-5 px-1.5 text-[10px] bg-green-500/10 text-green-600 border-green-500/20">
                  <IconPlugConnected className="h-3 w-3 mr-1" />
                  Live
                </Badge>
              ) : (
                <Badge variant="outline" className="h-5 px-1.5 text-[10px] bg-gray-500/10 text-gray-600 border-gray-500/20">
                  <IconPlugConnectedX className="h-3 w-3 mr-1" />
                  Offline
                </Badge>
              )}
            </div>
            {unreadCount > 0 && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          
          {/* Header actions */}
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onMarkAllAsRead}
                className="h-8 px-2 text-xs"
                title="Mark all as read"
              >
                <IconCheck className="h-4 w-4 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Notifications list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : notifications.length > 0 ? (
        <ScrollArea className="h-[400px]">
          <div className="py-2">
            {notifications.map((notification, index) => (
              <div key={notification.id}>
                <NotificationItem
                  notification={notification}
                  onMarkAsRead={onMarkAsRead}
                  onMarkAsUnread={onMarkAsUnread}
                  onDelete={onDelete}
                  onClick={handleNotificationClick}
                />
                {index < notifications.length - 1 && (
                  <Separator className="my-1" />
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <IconBellOff className="h-8 w-8 text-primary/60" />
          </div>
          <h4 className="text-sm font-semibold mb-1">No notifications</h4>
          <p className="text-xs text-muted-foreground text-center">
            You're all caught up! We'll notify you when something new happens.
          </p>
        </div>
      )}

      {/* Footer */}
      {notifications.length > 0 && (
        <>
          <Separator />
          <div className="px-4 py-3 flex items-center justify-between bg-muted/30">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                router.push('/notifications')
                onClose?.()
              }}
              className="h-8 text-xs font-medium"
            >
              <IconSettings className="h-4 w-4 mr-1.5" />
              View all notifications
            </Button>
            
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDeleteAll}
                className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <IconTrash className="h-4 w-4 mr-1.5" />
                Clear all
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

