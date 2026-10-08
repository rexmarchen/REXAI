import db from '../../lib/db.js'
import { GITHUB_TOKEN } from '../../config/env.js'
import { addKnowledgeEntry } from './knowledgeService.js'
import { cleanMarkdown } from './text.js'
import { ensureAutomationSchema } from './schema.js'

async function fetchJson(url, token = GITHUB_TOKEN) {
  const headers = {
    'User-Agent': 'rexion-linkedin-automation',
    Accept: 'application/vnd.github.v3+json'
  }
  if (token) headers.Authorization = `token ${token}`

  const response = await fetch(url, { headers })
  if (!response.ok) {
    throw new Error(`GitHub API error (${response.status}): ${await response.text()}`)
  }
  return response.json()
}

async function fetchRaw(url, token = GITHUB_TOKEN) {
  const headers = {
    'User-Agent': 'rexion-linkedin-automation',
    Accept: 'application/vnd.github.v3.raw'
  }
  if (token) headers.Authorization = `token ${token}`

  const response = await fetch(url, { headers })
  if (!response.ok) return ''
  return response.text()
}

export async function syncGitHubForUser(userId, username) {
  await ensureAutomationSchema()
  const safeUsername = String(username || '').trim()
  if (!safeUsername) {
    throw new Error('Add a GitHub username before syncing repositories.')
  }

  const repos = await fetchJson(`https://api.github.com/users/${encodeURIComponent(safeUsername)}/repos?sort=updated&per_page=100`)
  const syncedRepos = []

  for (const repo of repos) {
    if (repo.fork) continue

    const repoKey = `${safeUsername}/${repo.name}`
    let readmeText = ''
    try {
      readmeText = cleanMarkdown(await fetchRaw(`https://api.github.com/repos/${repoKey}/readme`)).slice(0, 1800)
    } catch {}

    let fileStructure = []
    try {
      const contents = await fetchJson(`https://api.github.com/repos/${repoKey}/contents`)
      if (Array.isArray(contents)) {
        fileStructure = contents.map((item) => item.name).slice(0, 20)
      }
    } catch {}

    const content = [
      `GitHub Project: ${repo.name}`,
      repo.language ? `Primary language: ${repo.language}` : '',
      repo.description ? `Overview: ${repo.description}` : '',
      repo.topics?.length ? `Topics: ${repo.topics.join(', ')}` : '',
      fileStructure.length ? `Key files/modules: ${fileStructure.join(', ')}` : '',
      readmeText ? `README:\n${readmeText}` : '',
      `Repository URL: ${repo.html_url}`
    ].filter(Boolean).join('\n')

    await db.query(
      `INSERT INTO automation_github_repos (user_id, repo_key, name, url, description, language, metadata, last_synced_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, now())
       ON CONFLICT (user_id, repo_key) DO UPDATE SET
         name = EXCLUDED.name,
         url = EXCLUDED.url,
         description = EXCLUDED.description,
         language = EXCLUDED.language,
         metadata = EXCLUDED.metadata,
         last_synced_at = now()`,
      [
        userId,
        repoKey,
        repo.name,
        repo.html_url,
        repo.description || '',
        repo.language || '',
        { topics: repo.topics || [], updatedAt: repo.updated_at },
      ]
    )

    await addKnowledgeEntry(userId, {
      entryType: 'github_repo',
      source: 'github',
      sourceId: repoKey,
      title: repo.name,
      content,
      metadata: {
        repoKey,
        repoName: repo.name,
        repoUrl: repo.html_url,
        language: repo.language,
        topics: repo.topics || [],
        updatedAt: repo.updated_at
      }
    })

    syncedRepos.push(repo.name)
  }

  return { syncedCount: syncedRepos.length, syncedRepos }
}

export async function getUserRepos(userId, limit = 12) {
  await ensureAutomationSchema()
  const result = await db.query(
    `SELECT id, repo_key, name, url, description, language, metadata, last_synced_at, last_posted_at
     FROM automation_github_repos
     WHERE user_id = $1
     ORDER BY last_synced_at DESC NULLS LAST, id DESC
     LIMIT $2`,
    [userId, limit]
  )
  return result.rows
}
