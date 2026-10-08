import {
  humanGapMinutes,
  humanSchedule,
  coordinateMultiChannel,
  scheduleFollowUpAfterAcceptance,
  isWeekend
} from './src/utils/jitter.js'

console.log('--- Testing humanGapMinutes (5 to 15 min range) ---')
const gaps = []
for (let i = 0; i < 8; i++) {
  gaps.push(humanGapMinutes(5, 15).toFixed(2))
}
console.log('Sample triangular delays (minutes):', gaps.join(', '))

console.log('\n--- Testing humanSchedule (6 actions across working window, max 2/hr) ---')
const now = new Date('2026-08-24T09:15:00Z') // Monday morning
const schedule = humanSchedule(6, {
  startDate: now,
  startHour: 9,
  endHour: 18,
  maxActionsPerHour: 2,
  minGapMinutes: 20,
  maxGapMinutes: 45
})

schedule.forEach((date, idx) => {
  console.log(`Action ${idx + 1}: ${date.toISOString()} (Hour: ${date.getUTCHours()}:${date.getUTCMinutes()})`)
})

console.log('\n--- Testing Multi-Channel Sequence Coordinator ---')
const linkedinInviteTime = schedule[0]
const emailSendTime = coordinateMultiChannel(linkedinInviteTime, 4, 12)
console.log('LinkedIn scheduled at:', linkedinInviteTime.toISOString())
console.log('Coordinated Email scheduled at (4-12h offset):', emailSendTime.toISOString())

console.log('\n--- Testing Post-Acceptance Follow-up (1-3 days later) ---')
const acceptedTime = new Date('2026-08-25T14:00:00Z')
const followUpTime = scheduleFollowUpAfterAcceptance(acceptedTime)
console.log('Connection accepted at:', acceptedTime.toISOString())
console.log('Follow-up DM scheduled at:', followUpTime.toISOString())
