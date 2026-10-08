import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const extensions = ['.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js']

export async function resolve(specifier, context, defaultResolve) {
  if (specifier.startsWith('@/')) {
    const relativePath = specifier.slice(2)
    const basePath = path.resolve(process.cwd(), 'src', relativePath)

    let resolvedPath = basePath
    if (!path.extname(basePath) && !fs.existsSync(basePath)) {
      for (const ext of extensions) {
        if (fs.existsSync(basePath + ext)) {
          resolvedPath = basePath + ext
          break
        }
      }
    }

    return {
      shortCircuit: true,
      url: pathToFileURL(resolvedPath).href
    }
  }
  return defaultResolve(specifier, context, defaultResolve)
}
