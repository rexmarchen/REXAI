import {
  getSqliteDb,
  ensureSocialConnectionsSchema,
  saveConnection,
  getAllConnections,
  getConnectionById,
  toggleAutopilot,
  updateConnection,
  deleteConnection
} from '../src/services/socialConnectionsSqliteService.js'

async function runMigration() {
  console.log('================================================================')
  console.log('🔄 UPGRADING SQLITE SCHEMA FOR MULTI-USER SOCIAL CONNECTIONS')
  console.log('================================================================\n')

  // Step 1: Ensure table and indexes exist
  const db = getSqliteDb()
  ensureSocialConnectionsSchema(db)
  console.log('✓ Ensured `social_connections` table and indexes exist in backend/data/rexion.sqlite')

  // Verify table in sqlite_master
  const tableInfo = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='social_connections'").get()
  console.log('\n[Schema Definition]:\n' + tableInfo.sql + '\n')

  // Step 2: Test Multi-User Account Connections
  console.log('--- Testing CRUD Operations ---')

  const TEST_USER_1 = 101
  const TEST_USER_2 = 102

  // 1. Save LinkedIn Connection for User 1
  const liConn = saveConnection({
    userId: TEST_USER_1,
    platform: 'linkedin',
    accountHandle: 'anshu-pal-eng',
    accessToken: 'AQEDATestLiCookie_983172',
    autopilotEnabled: false,
    queueCount: 3
  })
  console.log(`✓ [1] Created LinkedIn connection ID ${liConn.id} for user ${liConn.user_id}: @${liConn.account_handle} (autopilot: ${liConn.autopilot_enabled})`)

  // 2. Save Instagram Connection for User 1
  const igConn = saveConnection({
    userId: TEST_USER_1,
    platform: 'instagram',
    accountHandle: 'anshu._io',
    accessToken: 'EAABw_MetaGraphToken_12984',
    telegramChatId: '829471920',
    autopilotEnabled: true,
    queueCount: 7
  })
  console.log(`✓ [2] Created Instagram connection ID ${igConn.id} for user ${igConn.user_id}: @${igConn.account_handle} (tg: ${igConn.telegram_chat_id}, autopilot: ${igConn.autopilot_enabled})`)

  // 3. Save Connection for User 2 (multi-user isolation verification)
  const liConnUser2 = saveConnection({
    userId: TEST_USER_2,
    platform: 'linkedin',
    accountHandle: 'peer-developer-lead',
    accessToken: 'AQEDAUser2Token_4412',
    autopilotEnabled: true,
    queueCount: 12
  })
  console.log(`✓ [3] Created LinkedIn connection ID ${liConnUser2.id} for user ${liConnUser2.user_id}: @${liConnUser2.account_handle}`)

  // 4. Test Fetching by User & Platform
  const user1Conns = getAllConnections({ userId: TEST_USER_1 })
  console.log(`✓ [4] User 1 connections count: ${user1Conns.length} (expected 2)`)
  if (user1Conns.length !== 2) throw new Error('User 1 connections count mismatch')

  const igOnly = getAllConnections({ platform: 'instagram' })
  console.log(`✓ [5] Instagram platform connections count: ${igOnly.length}`)

  // 5. Test Toggle Autopilot
  const toggled = toggleAutopilot(liConn.id)
  console.log(`✓ [6] Toggled User 1 LinkedIn autopilot: ${liConn.autopilot_enabled} -> ${toggled.autopilot_enabled}`)
  if (toggled.autopilot_enabled !== true) throw new Error('Autopilot toggle failed')

  // 6. Test Updating Connection
  const updated = updateConnection(igConn.id, { queue_count: 15, telegram_chat_id: '999999999' })
  console.log(`✓ [7] Updated User 1 Instagram queue_count: ${updated.queue_count}, telegram_chat_id: ${updated.telegram_chat_id}`)
  if (updated.queue_count !== 15 || updated.telegram_chat_id !== '999999999') throw new Error('Update failed')

  // 7. Clean up test records
  deleteConnection(liConn.id)
  deleteConnection(igConn.id)
  deleteConnection(liConnUser2.id)
  console.log('✓ [8] Cleaned up temporary test connections successfully')

  console.log('\n================================================================')
  console.log('🎉 ALL SQLITE MULTI-USER CONNECTION TESTS PASSED SUCCESSFULLY!')
  console.log('================================================================')
}

runMigration().catch((err) => {
  console.error('❌ Migration failed:', err)
  process.exit(1)
})
