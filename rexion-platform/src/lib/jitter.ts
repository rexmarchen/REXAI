/**
 * Jitter and Human Pacing Utility for Outreach Actions
 * 
 * Implements triangular distributions and working-hours schedule distribution
 * to avoid detectable robotic intervals.
 */

export interface HumanScheduleOptions {
  startDate?: Date
  startHour?: number        // e.g. 9 for 9:00 AM (local time)
  endHour?: number          // e.g. 18 for 6:00 PM (18:00)
  maxActionsPerHour?: number // default 2 actions per hour max
  skipWeekends?: boolean    // default true
  minGapMinutes?: number    // minimum gap between consecutive actions in minutes
  maxGapMinutes?: number    // maximum gap between consecutive actions in minutes
  timeZone?: string         // e.g. 'UTC' or user's local timezone
}

/**
 * Returns a randomized delay in minutes between min and max,
 * weighted toward the middle of the range using a triangular distribution
 * (average of two independent uniform random numbers).
 *
 * @param min Minimum gap in minutes
 * @param max Maximum gap in minutes
 * @returns Delay in minutes (float)
 */
export function humanGapMinutes(min: number, max: number): number {
  if (min >= max) return min
  // Triangular distribution (sum of 2 uniform randoms / 2)
  const u1 = Math.random()
  const u2 = Math.random()
  const triangular = (u1 + u2) / 2
  return min + triangular * (max - min)
}

/**
 * Checks if a given Date falls on a weekend (Saturday or Sunday).
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay()
  return day === 0 || day === 6 // 0 is Sunday, 6 is Saturday
}

/**
 * Advances a Date to the next working day's start hour if it falls on a weekend
 * or past the working window.
 */
export function advanceToNextWorkingDay(
  current: Date,
  startHour: number,
  skipWeekends: boolean = true
): Date {
  const next = new Date(current.getTime())
  next.setDate(next.getDate() + 1)
  next.setHours(startHour, 0, 0, 0)

  if (skipWeekends) {
    while (isWeekend(next)) {
      next.setDate(next.getDate() + 1)
    }
  }

  return next
}

/**
 * Spreads N actions across a working-hours window (default 9am-6pm),
 * skips weekends, and caps how many actions land in any single hour (default max 2/hour).
 * 
 * - Gaps between actions use triangular-distributed human variability.
 * - Actions that exceed the hourly cap roll forward to the next available hour.
 * - Overflow past the end of the working window rolls to the next working day.
 *
 * @param count Number of actions to schedule
 * @param options Scheduling configuration options
 * @returns Array of Date objects for each scheduled action
 */
export function humanSchedule(count: number, options: HumanScheduleOptions = {}): Date[] {
  if (count <= 0) return []

  const {
    startDate = new Date(),
    startHour = 10,
    endHour = 17,
    maxActionsPerHour = 2,
    skipWeekends = true,
    minGapMinutes = 15,
    maxGapMinutes = 35,
  } = options

  const scheduledDates: Date[] = []

  // Initialize cursor
  let cursor = new Date(startDate.getTime())

  // If start is on weekend and skipWeekends is enabled, advance to next Monday
  if (skipWeekends && isWeekend(cursor)) {
    cursor = advanceToNextWorkingDay(cursor, startHour, skipWeekends)
  }

  // If start time is before startHour, set to startHour
  if (cursor.getHours() < startHour) {
    cursor.setHours(startHour, 0, 0, 0)
  }

  // If start time is at or after endHour, advance to next working day
  if (cursor.getHours() >= endHour) {
    cursor = advanceToNextWorkingDay(cursor, startHour, skipWeekends)
  }

  // Track actions per hour: key is "YYYY-MM-DD-HH"
  const hourlyActionCounts = new Map<string, number>()

  const getHourKey = (date: Date): string => {
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}-${date.getHours()}`
  }

  for (let i = 0; i < count; i++) {
    // Add human randomized gap before next action (for subsequent items)
    if (i > 0) {
      const gapMin = humanGapMinutes(minGapMinutes, maxGapMinutes)
      cursor = new Date(cursor.getTime() + gapMin * 60 * 1000)
    } else {
      // First action: small initial human jitter (2 to 8 mins from now)
      const initialJitter = humanGapMinutes(2, 8)
      cursor = new Date(cursor.getTime() + initialJitter * 60 * 1000)
    }

    // Keep rolling forward until we find a valid slot matching working hours, weekends, and maxActionsPerHour
    while (true) {
      // Check weekends
      if (skipWeekends && isWeekend(cursor)) {
        cursor = advanceToNextWorkingDay(cursor, startHour, skipWeekends)
        continue
      }

      // Check before working window
      if (cursor.getHours() < startHour) {
        cursor.setHours(startHour, Math.floor(Math.random() * 15), 0, 0)
        continue
      }

      // Check after working window
      if (cursor.getHours() >= endHour) {
        cursor = advanceToNextWorkingDay(cursor, startHour, skipWeekends)
        continue
      }

      // Check per-hour cap
      const hourKey = getHourKey(cursor)
      const currentCountInHour = hourlyActionCounts.get(hourKey) || 0

      if (currentCountInHour >= maxActionsPerHour) {
        // Roll forward to next hour with random minute offset (5 to 15 mins)
        cursor.setHours(cursor.getHours() + 1, Math.floor(Math.random() * 15), 0, 0)
        continue
      }

      // Found a valid slot!
      hourlyActionCounts.set(hourKey, currentCountInHour + 1)
      scheduledDates.push(new Date(cursor.getTime()))
      break
    }
  }

  return scheduledDates
}

/**
 * Multi-Channel Sequence Coordinator:
 * Offsets email and LinkedIn actions for the same contact to avoid simultaneous contact signals.
 *
 * @param linkedinScheduledDate The date when LinkedIn invite is scheduled
 * @param minOffsetHours Minimum hours to offset email (default 4 hours)
 * @param maxOffsetHours Maximum hours to offset email (default 24 hours)
 * @returns Scheduled date for the companion email
 */
export function coordinateMultiChannel(
  linkedinScheduledDate: Date,
  minOffsetHours: number = 4,
  maxOffsetHours: number = 24
): Date {
  const offsetHours = humanGapMinutes(minOffsetHours * 60, maxOffsetHours * 60) / 60
  const companionDate = new Date(linkedinScheduledDate.getTime() + offsetHours * 60 * 60 * 1000)

  // Ensure companion action still lands inside working hours (9am - 6pm)
  if (companionDate.getHours() < 9) {
    companionDate.setHours(9, Math.floor(Math.random() * 30), 0, 0)
  } else if (companionDate.getHours() >= 18) {
    // Roll to next working day morning
    return advanceToNextWorkingDay(companionDate, 9, true)
  }

  if (isWeekend(companionDate)) {
    return advanceToNextWorkingDay(companionDate, 9, true)
  }

  return companionDate
}

/**
 * Calculates a follow-up DM send date after a LinkedIn connection is accepted.
 * Schedules 1 to 3 days later with triangular jitter. Never immediately on acceptance.
 *
 * @param acceptedAt Timestamp when connection was accepted
 * @returns Date when follow-up DM should be dispatched
 */
export function scheduleFollowUpAfterAcceptance(acceptedAt: Date = new Date()): Date {
  // 1 to 3 days (1440 to 4320 minutes)
  const delayMinutes = humanGapMinutes(24 * 60, 72 * 60)
  let followUpDate = new Date(acceptedAt.getTime() + delayMinutes * 60 * 1000)

  // Align to working hours
  if (followUpDate.getHours() < 9) {
    followUpDate.setHours(9 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 45), 0, 0)
  } else if (followUpDate.getHours() >= 18) {
    followUpDate = advanceToNextWorkingDay(followUpDate, 10, true)
  }

  if (isWeekend(followUpDate)) {
    followUpDate = advanceToNextWorkingDay(followUpDate, 10, true)
  }

  return followUpDate
}
