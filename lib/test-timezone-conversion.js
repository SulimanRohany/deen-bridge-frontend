/**
 * Manual Test for Timezone Conversion
 * Run this in browser console to test timezone conversions
 */

import { convertClassTime } from './timezone-utils'

export function testTimezoneConversions() {
  console.log('=== TIMEZONE CONVERSION TESTS ===\n')
  
  // Test 1: Kabul to London (should be 4.5 hours ahead in winter)
  console.log('Test 1: Kabul (UTC+4:30) to London (UTC+0:00 winter)')
  console.log('Input: Friday 11:00 AM in Kabul')
  const test1 = convertClassTime('11:00', 'Asia/Kabul', 4, { targetTimezone: 'Europe/London' })
  console.log('Result:', test1)
  console.log('Expected: 6:30 AM or 7:30 AM (depending on BST)')
  console.log('Time difference:', test1.timeDifference)
  console.log('Should be: 4 hours 30 minutes ahead (winter) or 3 hours 30 minutes ahead (summer)\n')
  
  // Test 2: Kabul to New York
  console.log('Test 2: Kabul (UTC+4:30) to New York (UTC-5:00 winter)')
  console.log('Input: Friday 11:00 AM in Kabul')
  const test2 = convertClassTime('11:00', 'Asia/Kabul', 4, { targetTimezone: 'America/New_York' })
  console.log('Result:', test2)
  console.log('Expected: Friday 1:30 AM')
  console.log('Time difference:', test2.timeDifference)
  console.log('Should be: 9 hours 30 minutes ahead\n')
  
  // Test 3: Kabul to Los Angeles
  console.log('Test 3: Kabul (UTC+4:30) to Los Angeles (UTC-8:00)')
  console.log('Input: Friday 11:00 AM in Kabul')
  const test3 = convertClassTime('11:00', 'Asia/Kabul', 4, { targetTimezone: 'America/Los_Angeles' })
  console.log('Result:', test3)
  console.log('Expected: Thursday 10:30 PM (previous day!)')
  console.log('Time difference:', test3.timeDifference)
  console.log('Should be: 12 hours 30 minutes ahead\n')
  
  // Test 4: Kabul to Tokyo
  console.log('Test 4: Kabul (UTC+4:30) to Tokyo (UTC+9:00)')
  console.log('Input: Friday 11:00 AM in Kabul')
  const test4 = convertClassTime('11:00', 'Asia/Kabul', 4, { targetTimezone: 'Asia/Tokyo' })
  console.log('Result:', test4)
  console.log('Expected: Friday 3:30 PM')
  console.log('Time difference:', test4.timeDifference)
  console.log('Should be: 4 hours 30 minutes behind\n')
  
  // Test 5: Kolkata to London (another half-hour timezone)
  console.log('Test 5: Kolkata (UTC+5:30) to London (UTC+0:00)')
  console.log('Input: Monday 10:00 AM in Kolkata')
  const test5 = convertClassTime('10:00', 'Asia/Kolkata', 0, { targetTimezone: 'Europe/London' })
  console.log('Result:', test5)
  console.log('Expected: 4:30 AM or 5:30 AM (depending on BST)')
  console.log('Time difference:', test5.timeDifference)
  console.log('Should be: 5 hours 30 minutes ahead\n')
  
  console.log('=== END OF TESTS ===')
  
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

