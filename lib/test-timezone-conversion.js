/**
 * Manual Test for Timezone Conversion
 * Run this in browser console to test timezone conversions
 */

import { convertClassTime } from './timezone-utils'

export function testTimezoneConversions() {
  
  // Test 1: Kabul to London (should be 4.5 hours ahead in winter)
  const test1 = convertClassTime('11:00', 'Asia/Kabul', 4, { targetTimezone: 'Europe/London' })
  
  // Test 2: Kabul to New York
  const test2 = convertClassTime('11:00', 'Asia/Kabul', 4, { targetTimezone: 'America/New_York' })
  
  // Test 3: Kabul to Los Angeles
  const test3 = convertClassTime('11:00', 'Asia/Kabul', 4, { targetTimezone: 'America/Los_Angeles' })
  
  // Test 4: Kabul to Tokyo
  const test4 = convertClassTime('11:00', 'Asia/Kabul', 4, { targetTimezone: 'Asia/Tokyo' })
  
  // Test 5: Kolkata to London (another half-hour timezone)
  const test5 = convertClassTime('10:00', 'Asia/Kolkata', 0, { targetTimezone: 'Europe/London' })
  
  
  return {
    test1,
    test2,
    test3,
    test4,
    test5
  }
}

// To use: Open browser console and run:
// import { testTimezoneConversions } from '@/lib/test-timezone-conversion'
// testTimezoneConversions()

