"use client"

import { useState } from 'react'
import Link from 'next/link'
import { 
  IconBook, 
  IconSchool, 
  IconCalendar, 
  IconInfoCircle, 
  IconCircleCheck,
  IconAlertTriangle,
  IconX,
  IconCheck,
  IconDots
} from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from '@/components/ui/button'

const notificationIcons = {
  info: IconInfoCircle,
  success: IconCircleCheck,
  warning: IconAlertTriangle,
  error: IconAlertTriangle,
  course: IconSchool,
  enrollment: IconSchool,
  session: IconCalendar,
  library: IconBook,
  system: IconInfoCircle,
}

const notificationColors = {
  info: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  success: 'bg-green-500/10 text-green-600 dark:text-green-400',
  warning: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
  error: 'bg-red-500/10 text-red-600 dark:text-red-400',
  course: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  enrollment: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
  session: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  library: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
  system: 'bg-gray-500/10 text-gray-600 dark:text-gray-400',
}

export default function NotificationItem({ 
  notification, 
  onMarkAsRead, 
  onMarkAsUnread,
  onDelete,
  onClick 
}) {
  const [isHovered, setIsHovered] = useState(false)
  const Icon = notificationIcons[notification.type] || IconInfoCircle
  const colorClass = notificationColors[notification.type] || notificationColors.info

  const handleClick = () => {
    // Mark as read when clicked
    if (!notification.is_read && onMarkAsRead) {
      onMarkAsRead(notification.id)
    }
    
    // Navigate if action_url exists
    if (notification.action_url && onClick) {
      onClick(notification.action_url)
    }
  }

  const content = (
    <div
      className={cn(
        "group relative flex gap-3 p-4 rounded-lg transition-all duration-200 cursor-pointer",
        !notification.is_read && "bg-primary/5",
        isHovered && "bg-accent shadow-sm"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Unread indicator */}
      {!notification.is_read && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
      )}

      {/* Icon */}
      <div className={cn(
        "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
        colorClass
      )}>
        <Icon className="w-5 h-5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4 className={cn(
            "text-sm font-semibold line-clamp-1",
            !notification.is_read && "text-foreground",
            notification.is_read && "text-foreground/70"
          )}>
            {notification.title}
          </h4>
          
          {/* Actions menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
              >
                <IconDots className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {!notification.is_read ? (
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation()
                  onMarkAsRead?.(notification.id)
                }}>
                  <IconCheck className="mr-2 h-4 w-4" />
                  Mark as read
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation()
                  onMarkAsUnread?.(notification.id)
                }}>
                  <IconCheck className="mr-2 h-4 w-4" />
                  Mark as unread
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete?.(notification.id)
                }}
                className="text-destructive focus:text-destructive"
              >
                <IconX className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <p className={cn(
          "text-xs mt-1 line-clamp-2",
          notification.is_read ? "text-muted-foreground" : "text-foreground/80"
        )}>
          {notification.body}
        </p>

        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs text-muted-foreground">
            {notification.time_ago}
          </span>
        </div>
      </div>
    </div>
  )

  // If there's an action URL, wrap in Link
  if (notification.action_url && !notification.action_url.startsWith('http')) {
    return (
      <Link href={notification.action_url} className="block">
        {content}
      </Link>
    )
  }

  return content
}

