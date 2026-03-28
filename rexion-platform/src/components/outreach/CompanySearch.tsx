'use client'

import { motion } from 'framer-motion'
import { Building2, ExternalLink, Search } from 'lucide-react'
import { useState } from 'react'
import { useCompanySearch } from '@/hooks/useOutreach'
import { mockCompanies } from '@/lib/mock-data'
import type { CompanyProfile } from '@/types'
import styles from '@/styles/outreach.module.css'

export function CompanySearch({
  selectedCompany,
  onSelect,
}: {
  selectedCompany?: CompanyProfile | null
  onSelect: (company: CompanyProfile) => void
}) {
  const [query, setQuery] = useState(selectedCompany?.name || '')
  const { data, isLoading, isError } = useCompanySearch(query)
  const companies = query.trim().length > 1 ? data || [] : mockCompanies

  return (
    <section className={styles.surface}>
      <div>
        <h2 className={styles.strong}>Search any company</h2>
        <p className={styles.copy}>
          Clearbit and Apollo-backed company lookups fall back to curated results locally, so the flow still works while API keys are missing.
        </p>
      </div>

      <div className={styles.searchRow}>
        <div className={styles.searchInputWrap}>
          <Search size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search company name (e.g. Google, Razorpay, Zepto...)"
          />
        </div>
      </div>

      {isLoading ? (
        <div className={styles.resultGrid}>
          <div className={styles.skeleton} />
          <div className={styles.skeleton} />
          <div className={styles.skeleton} />
        </div>
      ) : null}

      {!isLoading && isError ? (
        <div className={styles.emptyState}>Company lookup is unavailable right now. Try one of the recommended companies below.</div>
      ) : null}

      {!isLoading ? (
        <div className={styles.resultGrid}>
          {companies.map((company, index) => (
            <motion.article
              key={`${company.domain}-${index}`}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.2 }}
              className={styles.resultCard}
            >
              <div className={styles.resultCardHeader}>
                <div className={styles.metaRow}>
                  <span className={styles.logoBadge}>{company.logo || <Building2 size={18} />}</span>
                  <div>
                    <div className={styles.strong}>{company.name}</div>
                    <div className={styles.metaText}>
                      {[company.industry, company.size, company.location].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                </div>
                <span className={styles.confidenceChip}>{company.hiringStatus || 'Unknown'}</span>
              </div>

              <div className={styles.linkRow}>
                <a href={`https://${company.domain}`} target="_blank" rel="noreferrer">
                  Website <ExternalLink size={14} />
                </a>
                {company.linkedinUrl ? (
                  <a href={company.linkedinUrl} target="_blank" rel="noreferrer">
                    LinkedIn <ExternalLink size={14} />
                  </a>
                ) : null}
              </div>

              <div className={styles.actionRow}>
                <button className={styles.button} onClick={() => onSelect(company)}>
                  Select This Company
                </button>
              </div>
            </motion.article>
          ))}
        </div>
      ) : null}
    </section>
  )
}
