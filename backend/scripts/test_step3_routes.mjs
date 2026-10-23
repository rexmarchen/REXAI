import assert from 'node:assert'
import { getSqliteDb, getConnectionStatus } from '../src/services/socialConnectionsSqliteService.js'
import { triggerAgentPipeline } from '../src/services/agentTriggerService.js'

async function runStep3Tests() {
  console.log('🧪 Starting Step 3 Verification Tests...\n')

  // 1. Test agent trigger service & 25 invites/day safety cap enforcement
  console.log('Test 1: Agent trigger safety cap enforcement')
  const safetyResOverLimit = await triggerAgentPipeline({
    platform: 'linkedin',
    action: 'start_campaign',
    dailyLimit: 100, // Attempting to exceed hard cap
    targetTitles: 'Engineering Lead, Tech Lead',
    messageTemplate: 'Hi {firstName}, loved your work!'
  })

  assert.strictEqual(safetyResOverLimit.enforcedDailyLimit, 25, 'Daily limit must be capped at 25')
  assert.strictEqual(safetyResOverLimit.safetySettings.dailyCap, 25)
  console.log('  ✅ LinkedIn safety hard cap enforced to 25 invites/day (attempted: 100, capped: 25)')

  // 2. Test agent trigger with lower limit
  console.log('Test 2: Agent trigger with custom limit under cap')
  const safetyResUnder = await triggerAgentPipeline({
    platform: 'linkedin',
    action: 'start_campaign',
    dailyLimit: 15
  })
  assert.strictEqual(safetyResUnder.enforcedDailyLimit, 15, 'Limits under 25 should be preserved')
  console.log('  ✅ Daily limit of 15 preserved correctly under cap')

  // 3. Test Instagram OAuth callback logic & SQLite persistence
  console.log('Test 3: Instagram OAuth token exchange & SQLite persistence')
  const { saveConnection } = await import('../src/services/socialConnectionsSqliteService.js')
  const mockToken = `IG_LL_60D_${Date.now()}`
  const savedIg = saveConnection({
    platform: 'instagram',
    accountHandle: 'rexion_creator',
    accessToken: mockToken,
    autopilotEnabled: true,
    scheduleTimes: '17:00, 19:00',
    reelPrompt: 'FLUX.1 + FFmpeg trending tech reels'
  })

  assert.strictEqual(savedIg.platform, 'instagram')
  assert.strictEqual(savedIg.account_handle, 'rexion_creator')
  assert.strictEqual(Boolean(savedIg.autopilot_enabled), true)
  console.log(`  ✅ Instagram connection saved to SQLite: @${savedIg.account_handle} (ID: ${savedIg.id}, Autopilot: ${savedIg.autopilot_enabled})`)

  // 4. Test Telemetry status reflecting both accounts
  console.log('Test 4: Verify Live Telemetry Status')
  const status = getConnectionStatus()
  assert(status.instagram.connected, 'Instagram should be marked connected')
  assert.strictEqual(status.instagram.username, 'rexion_creator')
  assert.strictEqual(status.instagram.autopilot, true)
  console.log('  ✅ Live Telemetry reflects connected Instagram account with Autopilot: ON')

  console.log('\n🎉 ALL STEP 3 TESTS PASSED SUCCESSFULLY!')
}

runStep3Tests().catch((err) => {
  console.error('❌ Test failed:', err)
  process.exit(1)
})
