const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

function processFile(fullPath) {
  try {
    const buf = execSync(`cmd.exe /c type "${fullPath}"`, { maxBuffer: 50 * 1024 * 1024 })
    fs.writeFileSync(fullPath, buf)
    console.log('Fully hydrated & saved locally:', fullPath)
  } catch (err) {
    console.error('Error processing:', fullPath, err.message)
  }
}

function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (!['node_modules', '.next', '.git'].includes(entry.name)) {
        walkDir(fullPath)
      }
    } else {
      processFile(fullPath)
    }
  }
}

walkDir(path.resolve(__dirname, '../src'))
walkDir(path.resolve(__dirname, '../tests'))
walkDir(path.resolve(__dirname, '../worker'))
console.log('Complete file hydration and local rewrite done!')
