"use client"

import { useState, useEffect } from 'react'
import { IconBell, IconBellRinging } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export default function NotificationBell({ 
  unreadCount = 0, 
  onClick, 
  isOpen = false,
  className 
}) {
  const [animate, setAnimate] = useState(false)
  const hasUnread = unreadCount > 0

  // Animate bell when new notifications arrive
  useEffect(() => {
    if (hasUnread) {
      setAnimate(true)
      const timer = setTimeout(() => setAnimate(false), 1000)
      return () => clearTimeout(timer)
    }
  }, [unreadCount])

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={onClick}
        className={cn(
          "relative transition-all duration-200 hover:bg-primary/10 group",
          isOpen && "bg-primary/10 text-primary",
          hasUnread && "text-primary",
          animate && "animate-wiggle",
          className
        )}
      >
        {hasUnread ? (
          <IconBellRinging 
            className={cn(
              "h-5 w-5 transition-all duration-200 text-foreground/70 group-hover:text-primary",
              animate && "scale-110"
            )} 
          />
        ) : (
          <IconBell className="h-5 w-5 transition-all duration-200 text-foreground/70 group-hover:text-primary" />
        )}
        
        {/* Unread count badge */}
        {hasUnread && (
          <Badge
            variant="destructive"
            className={cn(
              "absolute -top-1 -right-1 h-5 min-w-[20px] px-1 flex items-center justify-center",
              "text-[10px] font-bold rounded-full border-2 border-background",
              "transition-all duration-200",
              animate && "scale-125"
            )}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
        
        {/* Pulse indicator for new notifications */}
        {hasUnread && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
          </span>
        )}
      </Button>
    </div>
  )
}

