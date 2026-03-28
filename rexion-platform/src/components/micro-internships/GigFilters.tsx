'use client'

import type { GigLocation } from '@/types'
import styles from '@/styles/micro.module.css'

export interface GigFilterState {
  domain: string
  duration: string
  location: GigLocation | 'all'
  status: 'all' | 'open' | 'closing'
  payMin: number
  payMax: number
}

export function GigFilters({
  filters,
  onChange,
}: {
  filters: GigFilterState
  onChange: (next: GigFilterState) => void
}) {
  return (
    <aside className={styles.sidebar}>
      <div>
        <div className={styles.strong}>Filters</div>
        <div className={styles.muted}>Narrow the marketplace to the gigs you can realistically close this week.</div>
      </div>

      <div className={styles.field}>
        <label>Domain</label>
        <select value={filters.domain} onChange={(event) => onChange({ ...filters, domain: event.target.value })}>
          <option value="all">All domains</option>
          <option value="Frontend">Frontend</option>
          <option value="Backend">Backend</option>
          <option value="Design">Design</option>
          <option value="Marketing">Marketing</option>
          <option value="Data">Data</option>
          <option value="Mobile">Mobile</option>
        </select>
      </div>

      <div className={styles.field}>
        <label>Duration</label>
        <select value={filters.duration} onChange={(event) => onChange({ ...filters, duration: event.target.value })}>
          <option value="all">Any duration</option>
          <option value="7">7 days</option>
          <option value="10">10 days</option>
          <option value="14">14 days</option>
        </select>
      </div>

      <div className={styles.field}>
        <label>Location</label>
        <select
          value={filters.location}
          onChange={(event) => onChange({ ...filters, location: event.target.value as GigLocation | 'all' })}
        >
          <option value="all">All locations</option>
          <option value="remote">Remote</option>
          <option value="hybrid">Hybrid</option>
          <option value="onsite">On-site</option>
        </select>
      </div>

      <div className={styles.field}>
        <label>Status</label>
        <select
          value={filters.status}
          onChange={(event) =>
            onChange({ ...filters, status: event.target.value as GigFilterState['status'] })
          }
        >
          <option value="all">All</option>
          <option value="open">Open</option>
          <option value="closing">Closing soon</option>
        </select>
      </div>

      <div className={styles.field}>
        <label>Minimum pay</label>
        <input
          type="number"
          value={filters.payMin}
          min={8000}
          max={25000}
          step={1000}
          onChange={(event) => onChange({ ...filters, payMin: Number(event.target.value) })}
        />
      </div>

      <div className={styles.field}>
        <label>Maximum pay</label>
        <input
          type="number"
          value={filters.payMax}
          min={8000}
          max={25000}
          step={1000}
          onChange={(event) => onChange({ ...filters, payMax: Number(event.target.value) })}
        />
      </div>
    </aside>
  )
}
