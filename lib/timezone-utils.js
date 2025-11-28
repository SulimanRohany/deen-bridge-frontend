/**
 * Timezone Utilities for International Date/Time Display
 * 
 * These utilities handle timezone conversion and formatting for international users.
 * All dates from the API are in ISO 8601 format (UTC), and these functions convert
 * them to the user's local timezone automatically.
 * 
 * Usage:
 * import { formatDate, formatDateWithTooltip, getRelativeTime } from '@/lib/timezone-utils'
 */

/**
 * Format a date string in the user's local timezone with timezone abbreviation
 * 
 * @param {string} dateString - ISO 8601 date string from API (e.g., "2025-11-05T14:30:00Z")
 * @param {Object} options - Formatting options
 * @param {boolean} options.showRelative - Show relative time (e.g., "2 hours ago") for recent dates
 * @param {boolean} options.includeSeconds - Include seconds in the time display
 * @param {boolean} options.shortDate - Use shorter date format (e.g., "11/5/25")
 * @returns {string} Formatted date string in user's local timezone
 * 
 * @example
 * formatDate("2025-11-05T14:30:00Z")
 * // Output: "Nov 5, 2025, 02:30 PM PST" (for Pacific timezone)
 * 
 * @example
 * formatDate("2025-11-05T14:30:00Z", { showRelative: true })
 * // Output: "2 hours ago" (if recent) or "Nov 5, 2025, 02:30 PM PST" (if older)
 */
export function formatDate(dateString, options = {}) {
  if (!dateString) return ''
  
  const { showRelative = false, includeSeconds = false, shortDate = false } = options
  const date = new Date(dateString)
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return 'Invalid date'
  }
  
  const now = new Date()
  
  // Calculate time difference for relative display
  if (showRelative) {
    const relativeTime = getRelativeTime(date, now)
    if (relativeTime) return relativeTime
  }
  
  // Format absolute time with user's local timezone
  const formatOptions = shortDate
    ? {
        year: '2-digit',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      }
    : {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      }
  
  if (includeSeconds) {
    formatOptions.second = '2-digit'
  }
  
  // Use undefined to auto-detect user's locale and timezone
  return date.toLocaleString(undefined, formatOptions)
}

/**
 * Get relative time string (e.g., "2 hours ago", "just now")
 * Returns null if the date is too old (> 7 days) to show relative time
 * 
 * @param {Date} date - The date to compare
 * @param {Date} now - Current date (optional, defaults to new Date())
 * @returns {string|null} Relative time string or null if too old
 * 
 * @example
 * getRelativeTime(new Date(Date.now() - 1000 * 60 * 5))
 * // Output: "5 minutes ago"
 */
export function getRelativeTime(date, now = new Date()) {
  const diffInSeconds = Math.floor((now - date) / 1000)
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  const diffInHours = Math.floor(diffInMinutes / 60)
  const diffInDays = Math.floor(diffInHours / 24)
  
  // Show relative time for recent items only
  if (diffInMinutes < 1) {
    return 'Just now'
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`
  } else if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`
  }
  
  return null // Too old for relative time
}

/**
 * Format date with full details for tooltips
 * Shows complete date, time, and timezone name
 * 
 * @param {string} dateString - ISO 8601 date string from API
 * @returns {string} Full formatted date with timezone
 * 
 * @example
 * formatDateWithTooltip("2025-11-05T14:30:00Z")
 * // Output: "Tuesday, November 5, 2025 at 2:30:00 PM Pacific Standard Time"
 */
export function formatDateWithTooltip(dateString) {
  if (!dateString) return ''
  
  const date = new Date(dateString)
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return 'Invalid date'
  }
  
  return date.toLocaleString(undefined, {
    dateStyle: 'full',
    timeStyle: 'long'
  })
}

/**
 * Format date for date inputs (YYYY-MM-DD format)
 * 
 * @param {string|Date} dateString - Date string or Date object
 * @returns {string} Date in YYYY-MM-DD format
 * 
 * @example
 * formatDateForInput("2025-11-05T14:30:00Z")
 * // Output: "2025-11-05"
 */
export function formatDateForInput(dateString) {
  if (!dateString) return ''
  
  const date = new Date(dateString)
  
  if (isNaN(date.getTime())) {
    return ''
  }
  
  return date.toISOString().split('T')[0]
}

/**
 * Get the user's timezone
 * 
 * @returns {string} The user's timezone (e.g., "America/New_York")
 * 
 * @example
 * getUserTimezone()
 * // Output: "America/Los_Angeles"
 */
export function getUserTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

/**
 * Get the user's timezone abbreviation
 * 
 * @returns {string} The timezone abbreviation (e.g., "PST", "EST")
 * 
 * @example
 * getUserTimezoneAbbr()
 * // Output: "PST"
 */
export function getUserTimezoneAbbr() {
  const date = new Date()
  const timeZoneName = date.toLocaleString('en-US', {
    timeZoneName: 'short'
  }).split(' ').pop()
  
  return timeZoneName
}

/**
 * Format a date range
 * 
 * @param {string} startDate - Start date string
 * @param {string} endDate - End date string
 * @returns {string} Formatted date range
 * 
 * @example
 * formatDateRange("2025-11-05T14:30:00Z", "2025-11-05T16:30:00Z")
 * // Output: "Nov 5, 2025, 2:30 PM - 4:30 PM PST"
 */
export function formatDateRange(startDate, endDate) {
  if (!startDate || !endDate) return ''
  
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return 'Invalid date range'
  }
  
  // If same day, show date once
  if (start.toDateString() === end.toDateString()) {
    const date = start.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
    
    const startTime = start.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit'
    })
    
    const endTime = end.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    })
    
    return `${date}, ${startTime} - ${endTime}`
  }
  
  // Different days
  return `${formatDate(startDate)} - ${formatDate(endDate)}`
}

/**
 * Get time ago in words (similar to getRelativeTime but with more detail)
 * 
 * @param {string} dateString - ISO 8601 date string
 * @returns {string} Time ago in words
 * 
 * @example
 * getTimeAgo("2025-11-05T14:30:00Z")
 * // Output: "2 hours and 15 minutes ago"
 */
export function getTimeAgo(dateString) {
  if (!dateString) return ''
  
  const date = new Date(dateString)
  const now = new Date()
  
  if (isNaN(date.getTime())) {
    return 'Invalid date'
  }
  
  const diffInSeconds = Math.floor((now - date) / 1000)
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  const diffInHours = Math.floor(diffInMinutes / 60)
  const diffInDays = Math.floor(diffInHours / 24)
  const diffInWeeks = Math.floor(diffInDays / 7)
  const diffInMonths = Math.floor(diffInDays / 30)
  const diffInYears = Math.floor(diffInDays / 365)
  
  if (diffInSeconds < 60) {
    return 'Just now'
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`
  } else if (diffInHours < 24) {
    const remainingMinutes = diffInMinutes % 60
    if (remainingMinutes > 0) {
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} and ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''} ago`
    }
    return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`
  } else if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`
  } else if (diffInWeeks < 4) {
    return `${diffInWeeks} week${diffInWeeks !== 1 ? 's' : ''} ago`
  } else if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths !== 1 ? 's' : ''} ago`
  } else {
    return `${diffInYears} year${diffInYears !== 1 ? 's' : ''} ago`
  }
}

/**
 * Check if a date is today
 * 
 * @param {string|Date} dateString - Date to check
 * @returns {boolean} True if the date is today
 */
export function isToday(dateString) {
  const date = new Date(dateString)
  const today = new Date()
  
  return date.toDateString() === today.toDateString()
}

/**
 * Check if a date is within the last N days
 * 
 * @param {string|Date} dateString - Date to check
 * @param {number} days - Number of days to check
 * @returns {boolean} True if the date is within the last N days
 */
export function isWithinLastDays(dateString, days) {
  const date = new Date(dateString)
  const now = new Date()
  const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))
  
  return diffInDays <= days
}

/**
 * Convert a class time from one timezone to another
 * This is crucial for showing correct class times to students/teachers in different timezones
 * 
 * @param {string} time - Time string in HH:MM:SS or HH:MM format (e.g., "11:00:00", "14:30")
 * @param {string} sourceTimezone - IANA timezone name (e.g., "Asia/Kabul", "America/Los_Angeles")
 * @param {number} dayOfWeek - Day of week (0=Monday, 1=Tuesday, ..., 6=Sunday)
 * @param {Object} options - Additional options
 * @param {string} options.targetTimezone - Target timezone (defaults to user's browser timezone)
 * @param {boolean} options.use24Hour - Use 24-hour format (default: false, uses 12-hour with AM/PM)
 * @returns {Object} Converted time information
 * 
 * @example
 * // Teacher in Afghanistan (UTC+4:30) schedules class for Friday 11:00 AM
 * convertClassTime("11:00:00", "Asia/Kabul", 4)
 * // Student in Los Angeles sees:
 * // { localTime: "10:30 PM", localDay: 3, localDayName: "Thursday", 
 * //   isDifferentDay: true, timeDifference: "13 hours 30 minutes earlier" }
 */
export function convertClassTime(time, sourceTimezone, dayOfWeek, options = {}) {
  const { targetTimezone = getUserTimezone(), use24Hour = false } = options
  
  // Validation
  if (!time) {
    return {
      localTime: 'Invalid time',
      localDay: dayOfWeek,
      localDayName: getDayName(dayOfWeek),
      isDifferentDay: false,
      error: 'Time is required'
    }
  }
  
  if (!sourceTimezone) {
    sourceTimezone = 'UTC' // Default to UTC if no timezone specified
  }
  
  try {
    // Parse time (handle both HH:MM:SS and HH:MM formats)
    const timeParts = time.split(':')
    const hours = parseInt(timeParts[0], 10)
    const minutes = parseInt(timeParts[1], 10)
    const seconds = timeParts[2] ? parseInt(timeParts[2], 10) : 0
    
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      throw new Error('Invalid time format')
    }
    
    // Use November 3, 2025 as reference (it's a Monday, no DST in most places)
    const referenceMonday = new Date(2025, 10, 3) // Nov 3, 2025 = Monday
    const referenceDate = new Date(referenceMonday)
    referenceDate.setDate(referenceMonday.getDate() + dayOfWeek)
    
    const year = referenceDate.getFullYear()
    const month = referenceDate.getMonth() // 0-indexed for Date.UTC
    const day = referenceDate.getDate()
    
    // The correct approach: Find UTC timestamp that produces "hours:minutes" in sourceTimezone
    // Method: Use binary search or iterative adjustment to find exact UTC time
    
    // Step 1: Create a UTC date as starting point (midday to avoid DST edge cases)
    let utcDate = new Date(Date.UTC(year, month, day, 12, 0, 0))
    
    // Step 2: Get the offset for source timezone at this date
    let sourceOffsetMs = getTimezoneOffsetAccurate(sourceTimezone, utcDate)
    
    // Step 3: Calculate what UTC time produces "hours:minutes" in source timezone
    // Formula: If we want "H:M" in sourceTimezone (which is offset ahead of UTC),
    // then UTC = (H:M) - offset
    // Example: 22:00 in Kabul (UTC+4:30) means UTC = 22:00 - 4:30 = 17:30
    
    // Create UTC timestamp: start with desired time and subtract offset
    const desiredUtcTime = Date.UTC(year, month, day, hours, minutes, seconds)
    let utcTimestamp = desiredUtcTime - sourceOffsetMs
    utcDate = new Date(utcTimestamp)
    
    // Step 4: Verify and adjust if needed (handles edge cases)
    const sourceFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: sourceTimezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
    
    let verification = sourceFormatter.formatToParts(utcDate)
    let verifyHour = parseInt(verification.find(p => p.type === 'hour')?.value || '0')
    let verifyMinute = parseInt(verification.find(p => p.type === 'minute')?.value || '0')
    
    // If verification doesn't match, adjust (max 5 iterations to avoid infinite loop)
    let iterations = 0
    while ((verifyHour !== hours || verifyMinute !== minutes) && iterations < 5) {
      // Recalculate offset with current UTC date
      sourceOffsetMs = getTimezoneOffsetAccurate(sourceTimezone, utcDate)
      
      // Calculate difference
      const hourDiff = hours - verifyHour
      const minuteDiff = minutes - verifyMinute
      const totalDiffMinutes = hourDiff * 60 + minuteDiff
      
      // Adjust UTC timestamp
      utcTimestamp = utcTimestamp - (totalDiffMinutes * 60000)
      utcDate = new Date(utcTimestamp)
      
      // Verify again
      verification = sourceFormatter.formatToParts(utcDate)
      verifyHour = parseInt(verification.find(p => p.type === 'hour')?.value || '0')
      verifyMinute = parseInt(verification.find(p => p.type === 'minute')?.value || '0')
      
      iterations++
    }
    
    // Step 3: Format in target timezone
    const targetFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: targetTimezone,
      weekday: 'long',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: use24Hour ? '2-digit' : 'numeric',
      minute: '2-digit',
      hour12: !use24Hour
    })
    
    const targetParts = targetFormatter.formatToParts(utcDate)
    const targetWeekday = targetParts.find(p => p.type === 'weekday')?.value || ''
    const targetYear = parseInt(targetParts.find(p => p.type === 'year')?.value || year)
    const targetMonth = parseInt(targetParts.find(p => p.type === 'month')?.value || month)
    const targetDay = parseInt(targetParts.find(p => p.type === 'day')?.value || day)
    const targetHour = targetParts.find(p => p.type === 'hour')?.value || '0'
    const targetMinute = targetParts.find(p => p.type === 'minute')?.value || '00'
    const targetDayPeriod = use24Hour ? '' : (targetParts.find(p => p.type === 'dayPeriod')?.value || '')
    
    // Calculate target day of week
    const targetDateObj = new Date(targetYear, targetMonth - 1, targetDay)
    const targetDayOfWeek = targetDateObj.getDay() === 0 ? 6 : targetDateObj.getDay() - 1
    
    // Format the time
    const localTime = use24Hour 
      ? `${targetHour}:${targetMinute}`
      : `${targetHour}:${targetMinute} ${targetDayPeriod}`
    
    // Check if day changed
    const isDifferentDay = targetDayOfWeek !== dayOfWeek
    
    // Calculate accurate time difference in minutes
    const targetOffsetMs = getTimezoneOffsetAccurate(targetTimezone, utcDate)
    const offsetDiffMinutes = Math.abs(sourceOffsetMs - targetOffsetMs) / 60000
    
    const hoursDiff = Math.floor(offsetDiffMinutes / 60)
    const minutesDiff = Math.round(offsetDiffMinutes % 60)
    
    let timeDifference = ''
    if (sourceOffsetMs !== targetOffsetMs) {
      // If source offset > target offset, source is ahead
      const direction = sourceOffsetMs > targetOffsetMs ? 'ahead' : 'behind'
      if (minutesDiff === 0) {
        timeDifference = `${hoursDiff} hour${hoursDiff !== 1 ? 's' : ''} ${direction}`
      } else {
        timeDifference = `${hoursDiff} hour${hoursDiff !== 1 ? 's' : ''} ${minutesDiff} minute${minutesDiff !== 1 ? 's' : ''} ${direction}`
      }
    }
    
    return {
      localTime,
      localDay: targetDayOfWeek,
      localDayName: targetWeekday,
      isDifferentDay,
      timeDifference,
      sourceTimezone,
      targetTimezone,
      originalTime: time,
      originalDay: dayOfWeek,
      originalDayName: getDayName(dayOfWeek)
    }
    
  } catch (error) {
    return {
      localTime: time,
      localDay: dayOfWeek,
      localDayName: getDayName(dayOfWeek),
      isDifferentDay: false,
      error: error.message
    }
  }
}

/**
 * Get timezone offset in milliseconds for a specific timezone at a specific date
 * More accurate version that handles all edge cases
 * @private
 */
function getTimezoneOffsetAccurate(timezone, date) {
  // Format the date in UTC
  const utcFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
  
  // Format the same date in the target timezone
  const tzFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
  
  const utcParts = utcFormatter.formatToParts(date)
  const tzParts = tzFormatter.formatToParts(date)
  
  const getPartValue = (parts, type) => {
    const part = parts.find(p => p.type === type)
    return part ? parseInt(part.value, 10) : 0
  }
  
  const utcYear = getPartValue(utcParts, 'year')
  const utcMonth = getPartValue(utcParts, 'month') - 1
  const utcDay = getPartValue(utcParts, 'day')
  const utcHour = getPartValue(utcParts, 'hour')
  const utcMinute = getPartValue(utcParts, 'minute')
  const utcSecond = getPartValue(utcParts, 'second')
  
  const tzYear = getPartValue(tzParts, 'year')
  const tzMonth = getPartValue(tzParts, 'month') - 1
  const tzDay = getPartValue(tzParts, 'day')
  const tzHour = getPartValue(tzParts, 'hour')
  const tzMinute = getPartValue(tzParts, 'minute')
  const tzSecond = getPartValue(tzParts, 'second')
  
  const utcTime = Date.UTC(utcYear, utcMonth, utcDay, utcHour, utcMinute, utcSecond)
  const tzTime = Date.UTC(tzYear, tzMonth, tzDay, tzHour, tzMinute, tzSecond)
  
  // The offset is the difference between local time and UTC time
  return tzTime - utcTime
}

/**
 * Get day name from day of week number
 * @param {number} dayOfWeek - 0=Monday, 1=Tuesday, ..., 6=Sunday
 * @returns {string} Day name
 */
export function getDayName(dayOfWeek) {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  return days[dayOfWeek] || 'Unknown'
}

/**
 * Get short day name from day of week number
 * @param {number} dayOfWeek - 0=Monday, 1=Tuesday, ..., 6=Sunday
 * @returns {string} Short day name
 */
export function getShortDayName(dayOfWeek) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  return days[dayOfWeek] || 'Unknown'
}

/**
 * Get a comprehensive list of all IANA timezones grouped by region
 * Used for timezone selectors in admin panels
 * @returns {Array<Object>} Array of timezone groups
 */
export function getAllTimezones() {
  return [
    {
      region: 'Popular',
      timezones: [
        { value: 'UTC', label: 'UTC (Coordinated Universal Time)', offset: '+0:00' },
        { value: 'America/New_York', label: 'New York (EST/EDT)', offset: '-5:00' },
        { value: 'America/Los_Angeles', label: 'Los Angeles (PST/PDT)', offset: '-8:00' },
        { value: 'Europe/London', label: 'London (GMT/BST)', offset: '+0:00' },
        { value: 'Asia/Dubai', label: 'Dubai (GST)', offset: '+4:00' },
        { value: 'Asia/Kabul', label: 'Kabul (AFT)', offset: '+4:30' },
        { value: 'Asia/Kolkata', label: 'Mumbai/Delhi (IST)', offset: '+5:30' },
        { value: 'Asia/Tokyo', label: 'Tokyo (JST)', offset: '+9:00' },
      ]
    },
    {
      region: 'Africa',
      timezones: [
        { value: 'Africa/Cairo', label: 'Cairo (EET)', offset: '+2:00' },
        { value: 'Africa/Johannesburg', label: 'Johannesburg (SAST)', offset: '+2:00' },
        { value: 'Africa/Lagos', label: 'Lagos (WAT)', offset: '+1:00' },
        { value: 'Africa/Nairobi', label: 'Nairobi (EAT)', offset: '+3:00' },
      ]
    },
    {
      region: 'Americas',
      timezones: [
        { value: 'America/Chicago', label: 'Chicago (CST/CDT)', offset: '-6:00' },
        { value: 'America/Denver', label: 'Denver (MST/MDT)', offset: '-7:00' },
        { value: 'America/Toronto', label: 'Toronto (EST/EDT)', offset: '-5:00' },
        { value: 'America/Vancouver', label: 'Vancouver (PST/PDT)', offset: '-8:00' },
        { value: 'America/Mexico_City', label: 'Mexico City (CST/CDT)', offset: '-6:00' },
        { value: 'America/Sao_Paulo', label: 'São Paulo (BRT)', offset: '-3:00' },
        { value: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires (ART)', offset: '-3:00' },
      ]
    },
    {
      region: 'Asia',
      timezones: [
        { value: 'Asia/Karachi', label: 'Karachi (PKT)', offset: '+5:00' },
        { value: 'Asia/Dhaka', label: 'Dhaka (BST)', offset: '+6:00' },
        { value: 'Asia/Bangkok', label: 'Bangkok (ICT)', offset: '+7:00' },
        { value: 'Asia/Singapore', label: 'Singapore (SGT)', offset: '+8:00' },
        { value: 'Asia/Hong_Kong', label: 'Hong Kong (HKT)', offset: '+8:00' },
        { value: 'Asia/Shanghai', label: 'Shanghai (CST)', offset: '+8:00' },
        { value: 'Asia/Seoul', label: 'Seoul (KST)', offset: '+9:00' },
        { value: 'Asia/Jakarta', label: 'Jakarta (WIB)', offset: '+7:00' },
        { value: 'Asia/Riyadh', label: 'Riyadh (AST)', offset: '+3:00' },
        { value: 'Asia/Tehran', label: 'Tehran (IRST)', offset: '+3:30' },
        { value: 'Asia/Jerusalem', label: 'Jerusalem (IST)', offset: '+2:00' },
        { value: 'Asia/Istanbul', label: 'Istanbul (TRT)', offset: '+3:00' },
      ]
    },
    {
      region: 'Europe',
      timezones: [
        { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)', offset: '+1:00' },
        { value: 'Europe/Rome', label: 'Rome (CET/CEST)', offset: '+1:00' },
        { value: 'Europe/Madrid', label: 'Madrid (CET/CEST)', offset: '+1:00' },
        { value: 'Europe/Amsterdam', label: 'Amsterdam (CET/CEST)', offset: '+1:00' },
        { value: 'Europe/Brussels', label: 'Brussels (CET/CEST)', offset: '+1:00' },
        { value: 'Europe/Vienna', label: 'Vienna (CET/CEST)', offset: '+1:00' },
        { value: 'Europe/Athens', label: 'Athens (EET/EEST)', offset: '+2:00' },
        { value: 'Europe/Moscow', label: 'Moscow (MSK)', offset: '+3:00' },
      ]
    },
    {
      region: 'Oceania',
      timezones: [
        { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)', offset: '+10:00' },
        { value: 'Australia/Melbourne', label: 'Melbourne (AEST/AEDT)', offset: '+10:00' },
        { value: 'Australia/Brisbane', label: 'Brisbane (AEST)', offset: '+10:00' },
        { value: 'Australia/Perth', label: 'Perth (AWST)', offset: '+8:00' },
        { value: 'Pacific/Auckland', label: 'Auckland (NZST/NZDT)', offset: '+12:00' },
      ]
    }
  ]
}

/**
 * Get a flat list of all timezones for search/filter
 * @returns {Array<Object>} Flat array of timezones
 */
export function getAllTimezonesFlat() {
  const groups = getAllTimezones()
  return groups.flatMap(group => group.timezones)
}

/**
 * Find timezone by value
 * @param {string} timezoneValue - IANA timezone name
 * @returns {Object|null} Timezone object or null
 */
export function findTimezone(timezoneValue) {
  const allTimezones = getAllTimezonesFlat()
  return allTimezones.find(tz => tz.value === timezoneValue) || null
}

/**
 * Convert multiple class times (for a schedule with multiple days)
 * 
 * @param {string} startTime - Start time (e.g., "11:00:00")
 * @param {string} endTime - End time (e.g., "12:30:00")
 * @param {string} sourceTimezone - Source timezone
 * @param {Array<number>} daysOfWeek - Array of days (e.g., [0, 2, 4] for Mon/Wed/Fri)
 * @param {Object} options - Additional options
 * @returns {Array<Object>} Array of converted times for each day
 * 
 * @example
 * convertClassSchedule("11:00:00", "12:30:00", "Asia/Kabul", [0, 2, 4])
 * // Returns array of 3 objects, one for each day
 */
export function convertClassSchedule(startTime, endTime, sourceTimezone, daysOfWeek = [], options = {}) {
  if (!Array.isArray(daysOfWeek) || daysOfWeek.length === 0) {
    return []
  }
  
  return daysOfWeek.map(day => {
    const convertedStart = convertClassTime(startTime, sourceTimezone, day, options)
    const convertedEnd = convertClassTime(endTime, sourceTimezone, day, options)
    
    return {
      originalDay: day,
      originalDayName: getDayName(day),
      localDay: convertedStart.localDay,
      localDayName: convertedStart.localDayName,
      startTime: convertedStart.localTime,
      endTime: convertedEnd.localTime,
      isDifferentDay: convertedStart.isDifferentDay,
      timeDifference: convertedStart.timeDifference,
      // Handle case where end time might be on different day than start time
      spansTwoDays: convertedEnd.localDay !== convertedStart.localDay
    }
  }).sort((a, b) => a.localDay - b.localDay) // Sort by local day
}

/**
 * Format class schedule for display
 * @param {Object} schedule - Schedule object from convertClassSchedule
 * @returns {string} Formatted string
 * 
 * @example
 * formatClassSchedule(schedule)
 * // "Monday & Wednesday & Friday at 10:30 PM - 12:00 AM"
 */
export function formatClassScheduleDisplay(schedules) {
  if (!Array.isArray(schedules) || schedules.length === 0) {
    return 'No schedule'
  }
  
  // Group by time if same
  const timeGroups = new Map()
  
  schedules.forEach(schedule => {
    const timeKey = `${schedule.startTime}-${schedule.endTime}`
    if (!timeGroups.has(timeKey)) {
      timeGroups.set(timeKey, {
        days: [],
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        isDifferentDay: schedule.isDifferentDay
      })
    }
    timeGroups.get(timeKey).days.push(schedule.localDayName)
  })
  
  const parts = []
  timeGroups.forEach(group => {
    const daysStr = group.days.join(' & ')
    parts.push(`${daysStr} at ${group.startTime} - ${group.endTime}`)
  })
  
  return parts.join('; ')
}

/**
 * Get the next upcoming class session
 * @param {string} startTime - Start time
 * @param {string} sourceTimezone - Source timezone
 * @param {Array<number>} daysOfWeek - Array of days
 * @returns {Object|null} Next session info or null
 */
export function getNextClassSession(startTime, sourceTimezone, daysOfWeek = []) {
  if (!Array.isArray(daysOfWeek) || daysOfWeek.length === 0) {
    return null
  }
  
  const now = new Date()
  const currentDayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1 // Convert to 0=Monday
  const currentTime = now.getHours() * 60 + now.getMinutes()
  
  // Convert all scheduled days to local timezone
  const convertedDays = daysOfWeek.map(day => {
    const converted = convertClassTime(startTime, sourceTimezone, day)
    const [hours, minutes] = converted.localTime.replace(/AM|PM/gi, '').split(':').map(s => parseInt(s.trim()))
    const isPM = /PM/i.test(converted.localTime)
    const hour24 = isPM && hours !== 12 ? hours + 12 : (!isPM && hours === 12 ? 0 : hours)
    const timeInMinutes = hour24 * 60 + minutes
    
    return {
      ...converted,
      timeInMinutes,
      daysUntil: (converted.localDay - currentDayOfWeek + 7) % 7
    }
  })
  
  // Find next session
  let nextSession = null
  let minDaysUntil = Infinity
  
  convertedDays.forEach(day => {
    let daysUntil = day.daysUntil
    
    // If same day, check if time has passed
    if (daysUntil === 0) {
      if (day.timeInMinutes <= currentTime) {
        daysUntil = 7 // Next week
      }
    }
    
    if (daysUntil < minDaysUntil) {
      minDaysUntil = daysUntil
      nextSession = {
        ...day,
        daysUntil
      }
    }
  })
  
  return nextSession
}

// Default export with all functions
const timezoneUtils = {
  formatDate,
  formatDateWithTooltip,
  formatDateForInput,
  getRelativeTime,
  getTimeAgo,
  getUserTimezone,
  getUserTimezoneAbbr,
  formatDateRange,
  isToday,
  isWithinLastDays,
  convertClassTime,
  convertClassSchedule,
  formatClassScheduleDisplay,
  getNextClassSession,
  getDayName,
  getShortDayName,
  getAllTimezones,
  getAllTimezonesFlat,
  findTimezone
}

export default timezoneUtils

