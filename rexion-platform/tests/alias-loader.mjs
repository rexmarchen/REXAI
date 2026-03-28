import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

function resolveAlias(specifier) {
  const basePath = path.resolve(process.cwd(), 'src', specifier.slice(2))
  const candidates = [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    path.join(basePath, 'index.ts'),
    path.join(basePath, 'index.tsx'),
  ]

  return candidates.find((candidate) => fs.existsSync(candidate))
}

export async function resolve(specifier, context, defaultResolve) {
  if (specifier.startsWith('@/')) {
    const target = resolveAlias(specifier)
    if (target) {
      return defaultResolve(pathToFileURL(target).href, context, defaultResolve)
    }
  }

  return defaultResolve(specifier, context, defaultResolve)
}
