/**
 * Debug utility to test timezone offsets
 * Paste this in browser console to test
 */

// Copy the getTimezoneOffsetAccurate function to test it
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
  
  console.log(`  UTC formatted: ${utcHour}:${utcMinute}:${utcSecond}`)
  console.log(`  TZ formatted: ${tzHour}:${tzMinute}:${tzSecond}`)
  console.log(`  Difference (ms): ${tzTime - utcTime}`)
  console.log(`  Difference (minutes): ${(tzTime - utcTime) / 60000}`)
  
  // The offset is the difference between local time and UTC time
  return tzTime - utcTime
}

// Test function
export function debugTimezoneOffsets() {
  const testDate = new Date('2025-11-07T12:00:00Z') // Nov 7, 2025 noon UTC
  
  console.log('=== TIMEZONE OFFSET DEBUG ===\n')
  console.log('Test date:', testDate.toISOString(), '\n')
  
  console.log('1. Asia/Kabul (should be UTC+4:30 = +270 min):')
  const kabulOffset = getTimezoneOffsetAccurate('Asia/Kabul', testDate)
  console.log(`  Offset: ${kabulOffset / 60000} minutes\n`)
  
  console.log('2. Europe/London (should be UTC+0:00 = 0 min in November):')
  const londonOffset = getTimezoneOffsetAccurate('Europe/London', testDate)
  console.log(`  Offset: ${londonOffset / 60000} minutes\n`)
  
  console.log('3. Difference between Kabul and London:')
  console.log(`  ${(kabulOffset - londonOffset) / 60000} minutes`)
  console.log(`  ${(kabulOffset - londonOffset) / 60000 / 60} hours`)
  console.log(`  Expected: 270 minutes (4.5 hours)\n`)
  
  console.log('4. Asia/Tokyo (should be UTC+9:00 = +540 min):')
  const tokyoOffset = getTimezoneOffsetAccurate('Asia/Tokyo', testDate)
  console.log(`  Offset: ${tokyoOffset / 60000} minutes\n`)
  
  console.log('5. America/Los_Angeles (should be UTC-8:00 = -480 min in November):')
  const laOffset = getTimezoneOffsetAccurate('America/Los_Angeles', testDate)
  console.log(`  Offset: ${laOffset / 60000} minutes\n`)
  
  console.log('=== END DEBUG ===')
}

// Run in browser console:
// debugTimezoneOffsets()

