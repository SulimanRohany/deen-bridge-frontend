'use client'

import { useMemo } from 'react'
import { Clock, Globe, AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { convertClassTime, getDayName } from '@/lib/timezone-utils'
import { cn } from '@/lib/utils'

/**
 * TimezoneComparison Component
 * 
 * Displays class time information with timezone comparison
 * Shows original time + converted time in a selected viewing timezone
 * 
 * @param {Object} props
 * @param {string} props.startTime - Start time (HH:MM:SS or HH:MM)
 * @param {string} props.endTime - End time (optional)
 * @param {string} props.sourceTimezone - Original timezone (IANA name)
 * @param {number|number[]} props.daysOfWeek - Day(s) of week (0=Mon, 6=Sun)
 * @param {string} props.viewingTimezone - Timezone to convert to for comparison
 * @param {boolean} props.compact - Compact display mode
 * @param {string} props.className - Additional CSS classes
 */
export function TimezoneComparison({
  startTime,
  endTime,
  sourceTimezone,
  daysOfWeek,
  viewingTimezone,
  compact = false,
  className
}) {
  // Handle single day or array of days
  const days = Array.isArray(daysOfWeek) ? daysOfWeek : [daysOfWeek]
  
  // Convert times for all days
  const conversions = useMemo(() => {
    if (!startTime || !sourceTimezone || !viewingTimezone || days.length === 0) {
      return []
    }
    
    return days.map(day => {
      const convertedStart = convertClassTime(startTime, sourceTimezone, day, {
        targetTimezone: viewingTimezone
      })
      
      const convertedEnd = endTime ? convertClassTime(endTime, sourceTimezone, day, {
        targetTimezone: viewingTimezone
      }) : null
      
      return {
        day,
        originalDay: getDayName(day),
        convertedStart,
        convertedEnd
      }
    })
  }, [startTime, endTime, sourceTimezone, viewingTimezone, days])
  
  if (conversions.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No time information available
      </div>
    )
  }
  
  // Check if viewing timezone is same as source
  const isSameTimezone = sourceTimezone === viewingTimezone
  
  if (compact) {
    return (
      <div className={cn("space-y-2", className)}>
        {conversions.map((conv, idx) => (
          <div key={idx} className="flex items-center gap-2 text-sm">
            <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="font-medium">{conv.convertedStart.localDayName}:</span>
            <span>{conv.convertedStart.localTime}</span>
            {conv.convertedEnd && <span>- {conv.convertedEnd.localTime}</span>}
            {conv.convertedStart.isDifferentDay && (
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
            )}
          </div>
        ))}
      </div>
    )
  }
  
  return (
    <div className={cn("space-y-3", className)}>
      {conversions.map((conv, idx) => (
        <Card key={idx} className="border-2">
          <CardContent className="p-4 space-y-3">
            {/* Original Time */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span className="font-semibold">Original Schedule</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold">
                  {conv.originalDay}
                </span>
                <span className="text-base font-semibold">
                  {startTime}{endTime && ` - ${endTime}`}
                </span>
                <Badge variant="outline" className="font-mono text-xs">
                  {sourceTimezone}
                </Badge>
              </div>
            </div>
            
            {!isSameTimezone && (
              <>
                <div className="h-px bg-border" />
                
                {/* Converted Time */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Globe className="h-3.5 w-3.5" />
                    <span className="font-semibold">In Selected Timezone</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn(
                      "text-base font-bold",
                      conv.convertedStart.isDifferentDay && "text-amber-600"
                    )}>
                      {conv.convertedStart.localDayName}
                    </span>
                    <span className="text-base font-semibold text-primary">
                      {conv.convertedStart.localTime}
                      {conv.convertedEnd && ` - ${conv.convertedEnd.localTime}`}
                    </span>
                    <Badge variant="secondary" className="font-mono text-xs">
                      {viewingTimezone}
                    </Badge>
                    
                    {conv.convertedStart.isDifferentDay && (
                      <Badge variant="destructive" className="text-xs flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Different Day
                      </Badge>
                    )}
                  </div>
                  
                  {conv.convertedStart.timeDifference && (
                    <p className="text-xs text-muted-foreground">
                      {conv.convertedStart.timeDifference}
                    </p>
                  )}
                </div>
              </>
            )}
            
            {isSameTimezone && (
              <p className="text-xs text-muted-foreground italic">
                Same as original timezone
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

/**
 * TimezoneComparisonInline Component
 * 
 * Inline version showing original and converted time side by side
 * Perfect for table rows or compact displays
 */
export function TimezoneComparisonInline({
  startTime,
  endTime,
  sourceTimezone,
  dayOfWeek,
  viewingTimezone,
  className
}) {
  const converted = useMemo(() => {
    if (!startTime || !sourceTimezone || !viewingTimezone || dayOfWeek === undefined) {
      return null
    }
    
    return convertClassTime(startTime, sourceTimezone, dayOfWeek, {
      targetTimezone: viewingTimezone
    })
  }, [startTime, sourceTimezone, viewingTimezone, dayOfWeek])
  
  if (!converted) return null
  
  const isSameTimezone = sourceTimezone === viewingTimezone
  
  return (
    <div className={cn("flex flex-wrap items-center gap-2 text-sm", className)}>
      {/* Original */}
      <div className="flex items-center gap-1.5">
        <span className="font-medium">{getDayName(dayOfWeek)}</span>
        <span className="font-semibold">
          {startTime}{endTime && `-${endTime}`}
        </span>
        <Badge variant="outline" className="text-xs">
          {sourceTimezone}
        </Badge>
      </div>
      
      {!isSameTimezone && (
        <>
          <span className="text-muted-foreground">→</span>
          
          {/* Converted */}
          <div className="flex items-center gap-1.5">
            <span className={cn(
              "font-medium",
              converted.isDifferentDay && "text-amber-600"
            )}>
              {converted.localDayName}
            </span>
            <span className="font-semibold text-primary">
              {converted.localTime}
            </span>
            {converted.isDifferentDay && (
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default TimezoneComparison

