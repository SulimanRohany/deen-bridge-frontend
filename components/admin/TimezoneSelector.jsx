'use client'

import { useState, useMemo } from 'react'
import { Globe, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { getAllTimezones, getUserTimezone } from '@/lib/timezone-utils'

/**
 * TimezoneSelector Component
 * 
 * A searchable dropdown for selecting timezones
 * Used in super admin panels for viewing class times in different timezones
 * 
 * @param {Object} props
 * @param {string} props.value - Currently selected timezone (IANA name)
 * @param {Function} props.onValueChange - Callback when timezone changes
 * @param {string} props.placeholder - Placeholder text
 * @param {boolean} props.showUserTimezone - Show "Your Timezone" option
 * @param {string} props.className - Additional CSS classes
 */
export function TimezoneSelector({
  value,
  onValueChange,
  placeholder = "Select timezone...",
  showUserTimezone = true,
  className
}) {
  const timezoneGroups = useMemo(() => getAllTimezones(), [])
  const userTimezone = useMemo(() => getUserTimezone(), [])
  
  // Filter to remove duplicates - if user's timezone is in any group, don't show it again
  const filteredGroups = useMemo(() => {
    if (!showUserTimezone) return timezoneGroups
    
    return timezoneGroups.map(group => ({
      ...group,
      timezones: group.timezones.filter(tz => tz.value !== userTimezone)
    }))
  }, [timezoneGroups, userTimezone, showUserTimezone])
  
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={cn("w-full", className)}>
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <SelectValue placeholder={placeholder} />
        </div>
      </SelectTrigger>
      <SelectContent className="max-h-[400px]">
        {showUserTimezone && (
          <SelectGroup>
            <SelectLabel>Quick Select</SelectLabel>
            <SelectItem value={userTimezone}>
              <div className="flex items-center gap-2">
                <span>Your Timezone</span>
                <Badge variant="secondary" className="text-xs">
                  {userTimezone}
                </Badge>
              </div>
            </SelectItem>
          </SelectGroup>
        )}
        
        {filteredGroups.map((group) => (
          <SelectGroup key={group.region}>
            <SelectLabel>{group.region}</SelectLabel>
            {group.timezones.map((timezone) => (
              <SelectItem key={timezone.value} value={timezone.value}>
                <div className="flex items-center justify-between gap-4 w-full">
                  <span className="truncate">{timezone.label}</span>
                  <Badge variant="outline" className="text-xs font-mono">
                    {timezone.offset}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  )
}

export default TimezoneSelector

