/**
 * Jitter & Human Pacing Utility (Node.js Backend ES Module)
 * 
 * Implements triangular distribution variability and working-hours schedule
 * distribution to mimic real human usage and avoid robotic signatures.
 */

/**
 * Returns a randomized delay in minutes between min and max,
 * weighted toward the center using a triangular distribution.
 */
export function humanGapMinutes(min, max) {
  if (min >= max) return min
  const u1 = Math.random()
  const u2 = Math.random()
  const triangular = (u1 + u2) / 2
  return min + triangular * (max - min)
}

/**
 * Checks if a date falls on a weekend (Saturday / Sunday).
 */
export function isWeekend(date) {
  const day = date.getDay()
  return day === 0 || day === 6
}

/**
 * Advances a date to the next working day's start hour.
 */
export function advanceToNextWorkingDay(current, startHour = 9, skipWeekends = true) {
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
 * Spreads N actions across a working-hours window (9am - 6pm),
 * skips weekends, and caps actions per hour (default max 2/hour).
 *
 * @param {number} count Number of actions to schedule
 * @param {object} options Scheduling parameters
 * @returns {Date[]} Array of scheduled Date objects
 */
export function humanSchedule(count, options = {}) {
  if (count <= 0) return []

  const {
    startDate = new Date(),
    startHour = 9,
    endHour = 18,
    maxActionsPerHour = 2,
    skipWeekends = true,
    minGapMinutes = 18,
    maxGapMinutes = 52,
  } = options

  const scheduledDates = []
  let cursor = new Date(startDate.getTime())

  if (skipWeekends && isWeekend(cursor)) {
    cursor = advanceToNextWorkingDay(cursor, startHour, skipWeekends)
  }

  if (cursor.getHours() < startHour) {
    cursor.setHours(startHour, 0, 0, 0)
  }

  if (cursor.getHours() >= endHour) {
    cursor = advanceToNextWorkingDay(cursor, startHour, skipWeekends)
  }

  const hourlyActionCounts = new Map()
  const getHourKey = (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}-${d.getHours()}`

  for (let i = 0; i < count; i++) {
    if (i > 0) {
      const gapMin = humanGapMinutes(minGapMinutes, maxGapMinutes)
      cursor = new Date(cursor.getTime() + gapMin * 60 * 1000)
    } else {
      const initialJitter = humanGapMinutes(2, 8)
      cursor = new Date(cursor.getTime() + initialJitter * 60 * 1000)
    }

    while (true) {
      if (skipWeekends && isWeekend(cursor)) {
        cursor = advanceToNextWorkingDay(cursor, startHour, skipWeekends)
        continue
      }

      if (cursor.getHours() < startHour) {
        cursor.setHours(startHour, Math.floor(Math.random() * 15), 0, 0)
        continue
      }

      if (cursor.getHours() >= endHour) {
        cursor = advanceToNextWorkingDay(cursor, startHour, skipWeekends)
        continue
      }

      const hourKey = getHourKey(cursor)
      const currentCount = hourlyActionCounts.get(hourKey) || 0

      if (currentCount >= maxActionsPerHour) {
        cursor.setHours(cursor.getHours() + 1, Math.floor(Math.random() * 15), 0, 0)
        continue
      }

      hourlyActionCounts.set(hourKey, currentCount + 1)
      scheduledDates.push(new Date(cursor.getTime()))
      break
    }
  }

  return scheduledDates
}

/**
 * Offsets companion email relative to LinkedIn connection request.
 */
export function coordinateMultiChannel(linkedinDate, minOffsetHours = 4, maxOffsetHours = 24) {
  const offsetHours = humanGapMinutes(minOffsetHours * 60, maxOffsetHours * 60) / 60
  const companionDate = new Date(linkedinDate.getTime() + offsetHours * 60 * 60 * 1000)

  if (companionDate.getHours() < 9) {
    companionDate.setHours(9, Math.floor(Math.random() * 30), 0, 0)
  } else if (companionDate.getHours() >= 18) {
    return advanceToNextWorkingDay(companionDate, 9, true)
  }

  if (isWeekend(companionDate)) {
    return advanceToNextWorkingDay(companionDate, 9, true)
  }

  return companionDate
}

/**
 * Calculates a follow-up DM send date 1-3 days after acceptance.
 */
export function scheduleFollowUpAfterAcceptance(acceptedAt = new Date()) {
  const delayMinutes = humanGapMinutes(24 * 60, 72 * 60)
  let followUpDate = new Date(acceptedAt.getTime() + delayMinutes * 60 * 1000)

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
