import React, { useState, useEffect, useCallback } from 'react'
import { Activity, RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck, Database, Layers } from 'lucide-react'
import styles from './AdminInternshipsPage.module.css'

const AdminInternshipsPage = () => {
  const [telemetry, setTelemetry] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [message, setMessage] = useState(null)

  const fetchHealth = useCallback(async () => {
    setLoading(true)
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')

      const res = await fetch(`${baseUrl}/admin/internships/health`, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`
        }
      })
      if (!res.ok) throw new Error(`Health API returned ${res.status}`)
      const data = await res.json()
      setTelemetry(data)
    } catch (err) {
      console.warn('Admin health fetch failed:', err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchHealth()
  }, [fetchHealth])

  const handleManualRefresh = async () => {
    setRefreshing(true)
    setMessage(null)
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')

      const res = await fetch(`${baseUrl}/admin/internships/refresh`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`
        }
      })
      const data = await res.json()
      if (res.ok) {
        setMessage({ type: 'success', text: `Ingestion completed: ${data.metrics?.inserted || 0} new, ${data.metrics?.fresh48h || 0} fresh (<48h)` })
        await fetchHealth()
      } else {
        setMessage({ type: 'error', text: data.message || 'Ingestion failed' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div>
          <h1>Internship Pipeline Admin</h1>
          <p>Real-time ingestion telemetry, provider status monitors, and manual refresh controls.</p>
        </div>

        <button
          className={styles.refreshButton}
          disabled={refreshing}
          onClick={handleManualRefresh}
        >
          <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
          <span>{refreshing ? 'Ingesting Feeds...' : 'Refresh All Providers'}</span>
        </button>
      </div>

      {message && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '24px',
          background: message.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          color: message.type === 'success' ? '#10b981' : '#ef4444',
          border: `1px solid ${message.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          fontSize: '0.88rem'
        }}>
          {message.text}
        </div>
      )}

      {/* Aggregate Stats */}
      <div className={styles.grid}>
        <div className={styles.statCard}>
          <span>Total Active Internships</span>
          <strong>{telemetry?.database?.totalActiveInternships ?? '—'}</strong>
        </div>
        <div className={styles.statCard}>
          <span>Verified Fresh (&lt;48h)</span>
          <strong>{telemetry?.database?.fresh48hInternships ?? '—'}</strong>
        </div>
        <div className={styles.statCard}>
          <span>Last Ingestion Run</span>
          <strong>{telemetry?.lastIngestion?.durationMs ? `${telemetry.lastIngestion.durationMs}ms` : 'Standby'}</strong>
        </div>
        <div className={styles.statCard}>
          <span>Ingestion Freshness</span>
          <strong>{telemetry?.lastIngestion?.fresh48h ?? 0} &lt;48h Jobs</strong>
        </div>
      </div>

      {/* Provider Status Table */}
      <div className={styles.panel}>
        <h3>Configured Provider Health</h3>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Provider</th>
                <th>Status</th>
                <th>Access Type</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {(telemetry?.providers || [
                { source: 'adzuna', status: 'healthy', message: 'Official REST API Active' },
                { source: 'company_career', status: 'healthy', message: 'Greenhouse & Lever ATS Boards Active' },
                { source: 'linkedin_authorized', status: 'disabled', message: 'Official LinkedIn Partner API required to enable (Zero scraping policy)' }
              ]).map((p) => (
                <tr key={p.source}>
                  <td style={{ fontWeight: 600, color: '#fff' }}>{p.source.toUpperCase()}</td>
                  <td>
                    <span className={
                      p.status === 'healthy' ? styles.statusHealthy : (p.status === 'disabled' ? styles.statusDisabled : styles.statusDegraded)
                    }>
                      {p.status.toUpperCase()}
                    </span>
                  </td>
                  <td>{p.source === 'linkedin_authorized' ? 'OAuth 2.0 (Official Partner)' : 'Official Public API'}</td>
                  <td>{p.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Telemetry Breakdown */}
      {telemetry?.lastIngestion && (
        <div className={styles.panel}>
          <h3>Last Ingestion Metrics Breakdown</h3>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Started At</td><td>{telemetry.lastIngestion.startedAt || 'N/A'}</td></tr>
                <tr><td>Finished At</td><td>{telemetry.lastIngestion.finishedAt || 'N/A'}</td></tr>
                <tr><td>Total Raw Jobs Fetched</td><td>{telemetry.lastIngestion.fetched || 0}</td></tr>
                <tr><td>Confirmed Internships Classified</td><td>{telemetry.lastIngestion.internships || 0}</td></tr>
                <tr><td>Verified Fresh (&lt;48h)</td><td>{telemetry.lastIngestion.fresh48h || 0}</td></tr>
                <tr><td>Deduplicated / Hash Collisions</td><td>{telemetry.lastIngestion.duplicates || 0}</td></tr>
                <tr><td>Newly Inserted Records</td><td>{telemetry.lastIngestion.inserted || 0}</td></tr>
                <tr><td>Existing Records Updated</td><td>{telemetry.lastIngestion.updated || 0}</td></tr>
                <tr><td>Rejected (Non-Internships / Malformed)</td><td>{telemetry.lastIngestion.rejected || 0}</td></tr>
                <tr><td>Pipeline Errors</td><td>{telemetry.lastIngestion.errors || 0}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminInternshipsPage
