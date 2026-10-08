import db from '../../lib/db.js'

let schemaPromise = null

export function ensureAutomationSchema() {
  if (!schemaPromise) {
    schemaPromise = db.query(`
      CREATE TABLE IF NOT EXISTS automation_settings (
        user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        schedule_enabled BOOLEAN NOT NULL DEFAULT false,
        approval_mode TEXT NOT NULL DEFAULT 'draft_approve',
        cron_time TIME,
        cron_timezone TEXT NOT NULL DEFAULT 'UTC',
        full_auto_enabled BOOLEAN NOT NULL DEFAULT false,
        daily_post_limit INTEGER NOT NULL DEFAULT 1,
        github_username TEXT,
        github_token_encrypted TEXT,
        last_run_at TIMESTAMPTZ,
        next_run_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS automation_knowledge_entries (
        id BIGSERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        entry_type TEXT NOT NULL,
        source TEXT,
        source_id TEXT,
        title TEXT,
        content TEXT NOT NULL,
        metadata JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS automation_knowledge_chunks (
        id BIGSERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        knowledge_entry_id BIGINT REFERENCES automation_knowledge_entries(id) ON DELETE CASCADE,
        chunk_index INTEGER NOT NULL DEFAULT 0,
        content TEXT NOT NULL,
        metadata JSONB NOT NULL DEFAULT '{}',
        vector_ref TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS automation_github_repos (
        id BIGSERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        repo_key TEXT NOT NULL,
        name TEXT NOT NULL,
        url TEXT,
        description TEXT,
        language TEXT,
        metadata JSONB NOT NULL DEFAULT '{}',
        last_synced_at TIMESTAMPTZ,
        last_posted_at TIMESTAMPTZ,
        UNIQUE(user_id, repo_key)
      );

      CREATE TABLE IF NOT EXISTS automation_post_drafts (
        id BIGSERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        topic TEXT,
        source_type TEXT,
        source_id TEXT,
        post_text TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'draft',
        error TEXT,
        metadata JSONB NOT NULL DEFAULT '{}',
        generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        approved_at TIMESTAMPTZ,
        published_at TIMESTAMPTZ,
        linkedin_post_id TEXT
      );

      CREATE TABLE IF NOT EXISTS automation_post_history (
        id BIGSERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        draft_id BIGINT REFERENCES automation_post_drafts(id) ON DELETE SET NULL,
        topic TEXT,
        post_text TEXT NOT NULL,
        linkedin_post_id TEXT,
        status TEXT NOT NULL,
        error TEXT,
        metadata JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        published_at TIMESTAMPTZ
      );

      CREATE TABLE IF NOT EXISTS automation_runs (
        id BIGSERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        run_type TEXT NOT NULL,
        status TEXT NOT NULL,
        error TEXT,
        started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        finished_at TIMESTAMPTZ,
        metadata JSONB NOT NULL DEFAULT '{}'
      );

      CREATE INDEX IF NOT EXISTS idx_automation_chunks_user ON automation_knowledge_chunks(user_id);
      CREATE INDEX IF NOT EXISTS idx_automation_entries_user ON automation_knowledge_entries(user_id);
      CREATE INDEX IF NOT EXISTS idx_automation_drafts_user_status ON automation_post_drafts(user_id, status);
      CREATE INDEX IF NOT EXISTS idx_automation_history_user ON automation_post_history(user_id, created_at DESC);
    `)
  }

  return schemaPromise
}
