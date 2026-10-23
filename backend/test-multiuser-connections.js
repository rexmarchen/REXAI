import { DatabaseSync } from 'node:sqlite'
import path from 'path'
import { fileURLToPath } from 'url'
import { getConnectionStatus, saveConnection, getAllConnections } from '../backend/src/services/socialConnectionsSqliteService.js'

const db = new DatabaseSync('backend/data/rexion.sqlite')
db.prepare("UPDATE social_connections SET user_id = '1' WHERE id = 14").run()

console.log('--- Current Connections in SQLite ---')
const rows = db.prepare('SELECT id, user_id, platform, account_handle, autopilot_enabled FROM social_connections').all()
console.log(rows)

console.log('\n--- Status for User 1 (Admin/Apurav) ---')
const statusUser1 = getConnectionStatus({ userId: '1' })
console.log('User 1 LinkedIn Connected:', statusUser1.linkedin.connected, 'Account:', statusUser1.linkedin.accountName)

console.log('\n--- Status for User 2 (New User - Unconnected) ---')
const statusUser2 = getConnectionStatus({ userId: 'user_new_999' })
console.log('User 2 LinkedIn Connected:', statusUser2.linkedin.connected, 'Account:', statusUser2.linkedin.accountName)

console.log('\n--- Connecting User 2 to their own account ---')
saveConnection({
  userId: 'user_new_999',
  platform: 'linkedin',
  accountHandle: 'Jane Doe',
  accessToken: 'AQX_MOCK_USER2_TOKEN',
  targetJobTitles: 'urn:li:person:jane-doe-urn',
  autopilotEnabled: true
})

console.log('\n--- After User 2 Connects ---')
const statusUser1After = getConnectionStatus({ userId: '1' })
const statusUser2After = getConnectionStatus({ userId: 'user_new_999' })

console.log('User 1 Account:', statusUser1After.linkedin.accountName, 'URN:', statusUser1After.linkedin.targetJobTitles)
console.log('User 2 Account:', statusUser2After.linkedin.accountName, 'URN:', statusUser2After.linkedin.targetJobTitles)

// Clean up mock user 2
db.prepare("DELETE FROM social_connections WHERE user_id = 'user_new_999'").run()
console.log('\nCleaned up mock User 2 successfully.')
