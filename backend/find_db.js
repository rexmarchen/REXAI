import fs from 'node:fs'

const content = fs.readFileSync('server.js', 'utf8')
const lines = content.split('\n')

for (let i = 129; i < 199; i++) {
  console.log(`${i + 1}: ${lines[i]}`)
}
