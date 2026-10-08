import React, { useState } from 'react'
import {
  Filter,
  RotateCcw,
  Bookmark,
  Plus,
  X,
  Building,
  User,
  ShieldCheck,
  Ban,
  ChevronDown,
  ChevronUp,
  Check,
  Trash2
} from 'lucide-react'

export const SENIORITY_OPTIONS = [
  { value: 'owner', label: 'Owner' },
  { value: 'founder', label: 'Founder / Co-Founder' },
  { value: 'c_suite', label: 'C-Suite (CEO, CTO, CMO)' },
  { value: 'vp', label: 'VP / Vice President' },
  { value: 'director', label: 'Director / Head of' },
  { value: 'manager', label: 'Hiring Manager / Lead' },
  { value: 'senior', label: 'Senior / Staff' },
  { value: 'entry', label: 'Entry-Level / Associate' }
]

export const DEPARTMENT_OPTIONS = [
  { value: 'engineering', label: 'Engineering & Tech' },
  { value: 'human_resources', label: 'HR & Talent Acquisition' },
  { value: 'product', label: 'Product Management' },
  { value: 'design', label: 'UI/UX & Design' },
  { value: 'sales', label: 'Sales & BD' },
  { value: 'marketing', label: 'Marketing & Growth' },
  { value: 'operations', label: 'Operations & PMO' },
  { value: 'finance', label: 'Finance & Legal' }
]

export const HEADCOUNT_OPTIONS = [
  { value: '1-10', label: '1 - 10 (Startup)' },
  { value: '11-50', label: '11 - 50 (Early Stage)' },
  { value: '51-200', label: '51 - 200 (Growth)' },
  { value: '201-500', label: '201 - 500 (Mid-Market)' },
  { value: '501-1000', label: '501 - 1,000 (Scale-up)' },
  { value: '1000+', label: '1,000+ (Enterprise)' }
]

export const FUNDING_STAGE_OPTIONS = [
  { value: 'seed', label: 'Seed / Pre-Seed' },
  { value: 'series_a', label: 'Series A' },
  { value: 'series_b', label: 'Series B' },
  { value: 'series_c_plus', label: 'Series C+' },
  { value: 'public', label: 'Publicly Traded' },
  { value: 'bootstrapped', label: 'Bootstrapped' }
]

export const YEARS_IN_ROLE_OPTIONS = [
  { value: '', label: 'Any tenure' },
  { value: '0-1', label: '< 1 year (New in role)' },
  { value: '1-3', label: '1 to 3 years' },
  { value: '3-5', label: '3 to 5 years' },
  { value: '5+', label: '5+ years (Seasoned)' }
]

export const DEFAULT_FILTERS = {
  titles: ['Founder', 'CEO', 'Head of Talent'],
  seniorities: [],
  departments: [],
  excludedTitleKeywords: [],
  yearsInRole: '',
  personLocations: [],
  companyNames: [],
  companyMode: 'include',
  headcountRanges: [],
  fundingStages: [],
  technologies: [],
  verifiedEmailOnly: true,
  hasLinkedIn: false,
  hasPhone: false,
  excludeExistingContacts: true,
  excludeContactedDays: 30
}

export default function FilterPanel({
  filters,
  onChange,
  onReset,
  activeCount
}) {
  const [openSections, setOpenSections] = useState({
    person: true,
    company: false,
    quality: false,
    exclusions: false,
    saved: false
  })

  // Tag inputs
  const [titleInput, setTitleInput] = useState('')
  const [excludeInput, setExcludeInput] = useState('')
  const [companyInput, setCompanyInput] = useState('')
  const [techInput, setTechInput] = useState('')

  // Local preset state
  const [savedPresets, setSavedPresets] = useState([
    {
      id: 'preset-1',
      name: 'Startup Founders & CEOs',
      filters: {
        ...DEFAULT_FILTERS,
        titles: ['Founder', 'Co-Founder', 'CEO'],
        seniorities: ['founder', 'c_suite'],
        headcountRanges: ['1-10', '11-50', '51-200']
      }
    },
    {
      id: 'preset-2',
      name: 'Tech Recruiters & Talent Leads',
      filters: {
        ...DEFAULT_FILTERS,
        titles: ['Technical Recruiter', 'Head of Talent', 'Talent Acquisition'],
        departments: ['human_resources'],
        verifiedEmailOnly: true
      }
    }
  ])
  const [saveName, setSaveName] = useState('')

  const toggleSection = (s) => setOpenSections(prev => ({ ...prev, [s]: !prev[s] }))

  const addTag = (key, val, clear) => {
    const trimmed = String(val || '').trim()
    if (!trimmed) return
    const list = filters[key] || []
    if (!list.includes(trimmed)) {
      onChange({ ...filters, [key]: [...list, trimmed] })
    }
    clear()
  }

  const removeTag = (key, val) => {
    const list = filters[key] || []
    onChange({ ...filters, [key]: list.filter(item => item !== val) })
  }

  const toggleCheckbox = (key, val) => {
    const list = filters[key] || []
    const next = list.includes(val) ? list.filter(v => v !== val) : [...list, val]
    onChange({ ...filters, [key]: next })
  }

  const handleSavePreset = () => {
    if (!saveName.trim()) return
    const newPreset = {
      id: `preset-${Date.now()}`,
      name: saveName.trim(),
      filters: { ...filters }
    }
    setSavedPresets(prev => [newPreset, ...prev])
    setSaveName('')
  }

  const handleDeletePreset = (id, e) => {
    e.stopPropagation()
    setSavedPresets(prev => prev.filter(p => p.id !== id))
  }

  return (
    <aside style={{
      width: '100%',
      maxWidth: '280px',
      flexShrink: 0,
      background: '#FFFFFF',
      border: '1px solid #ECE3D7',
      borderRadius: '20px',
      padding: '16px',
      color: '#161616',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      boxShadow: '0 2px 10px rgba(45, 40, 36, 0.03)'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #ECE3D7', paddingBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '6px', borderRadius: '10px', color: '#10B981', display: 'flex' }}>
            <Filter size={14} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#161616' }}>Filters</h4>
            <span style={{ fontSize: '9.5px', color: '#756E66', letterSpacing: '0.06em', fontWeight: 600 }}>MULTI-TIER</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {activeCount > 0 && (
            <span style={{ background: '#FFEDE5', color: '#E97852', border: '1px solid #F0DCD3', borderRadius: '999px', padding: '1px 7px', fontSize: '10px', fontWeight: 'bold' }}>
              {activeCount}
            </span>
          )}
          <button
            type="button"
            onClick={onReset}
            style={{ background: 'none', border: 'none', color: '#E97852', fontSize: '11px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
          >
            <RotateCcw size={11} /> Reset
          </button>
        </div>
      </div>

      {/* Group: Saved Presets */}
      <div style={{ background: '#FAF6F0', border: '1px solid #ECE3D7', borderRadius: '12px', overflow: 'hidden' }}>
        <button
          type="button"
          onClick={() => toggleSection('saved')}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', background: 'none', border: 'none', color: '#2D2824', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer' }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Bookmark size={13} color="#E97852" /> Presets ({savedPresets.length})
          </span>
          {openSections.saved ? <ChevronUp size={13} color="#756E66" /> : <ChevronDown size={13} color="#756E66" />}
        </button>

        {openSections.saved && (
          <div style={{ padding: '10px 12px', borderTop: '1px solid #ECE3D7', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {savedPresets.map((preset) => (
              <div
                key={preset.id}
                onClick={() => onChange(preset.filters)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '7px 10px',
                  background: '#FFFFFF',
                  border: '1px solid #ECE3D7',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  transition: 'border-color 0.15s ease'
                }}
              >
                <span style={{ fontWeight: 600, color: '#2D2824' }}>{preset.name}</span>
                <button
                  type="button"
                  onClick={(e) => handleDeletePreset(preset.id, e)}
                  style={{ background: 'none', border: 'none', color: '#9C9286', cursor: 'pointer', padding: 0 }}
                >
                  <Trash2 size={11} />
                </button>
              </div>
            ))}

            <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
              <input
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="Save current filters as..."
                style={{ flex: 1, background: '#FFFFFF', border: '1px solid #ECE3D7', borderRadius: '8px', padding: '6px 8px', fontSize: '11px', color: '#161616', outline: 'none' }}
              />
              <button
                type="button"
                onClick={handleSavePreset}
                style={{ background: '#E97852', color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '6px 10px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Save
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Group: Person & Role */}
      <div style={{ background: '#FAF6F0', border: '1px solid #ECE3D7', borderRadius: '12px', overflow: 'hidden' }}>
        <button
          type="button"
          onClick={() => toggleSection('person')}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'none', border: 'none', color: '#2D2824', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer' }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <User size={13} color="#0284C7" /> Person & Role
          </span>
          {openSections.person ? <ChevronUp size={13} color="#756E66" /> : <ChevronDown size={13} color="#756E66" />}
        </button>

        {openSections.person && (
          <div style={{ padding: '12px', borderTop: '1px solid #ECE3D7', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Job Titles */}
            <div>
              <label style={{ fontSize: '10px', color: '#756E66', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Job Titles</label>
              <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                <input
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag('titles', titleInput, () => setTitleInput('')))}
                  placeholder="e.g. Founder, CEO, VP..."
                  style={{ flex: 1, background: '#FFFFFF', border: '1px solid #ECE3D7', borderRadius: '8px', padding: '6px 10px', fontSize: '11.5px', color: '#161616', outline: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => addTag('titles', titleInput, () => setTitleInput(''))}
                  style={{ background: '#FFEDE5', border: '1px solid #F0DCD3', color: '#E97852', borderRadius: '8px', padding: '0 9px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  <Plus size={13} />
                </button>
              </div>

              {filters.titles.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '6px' }}>
                  {filters.titles.map((t) => (
                    <span key={t} style={{ background: '#FFFFFF', border: '1px solid #ECE3D7', color: '#2D2824', padding: '3px 8px', borderRadius: '999px', fontSize: '10.5px', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      {t} <X size={10} style={{ cursor: 'pointer', color: '#9C9286' }} onClick={() => removeTag('titles', t)} />
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Seniority Level (Matching mock pills) */}
            <div>
              <label style={{ fontSize: '10px', color: '#756E66', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Seniority Level</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '6px' }}>
                {SENIORITY_OPTIONS.map((opt) => {
                  const active = filters.seniorities.includes(opt.value)
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleCheckbox('seniorities', opt.value)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '999px',
                        fontSize: '10.5px',
                        fontWeight: active ? 600 : 500,
                        cursor: 'pointer',
                        background: active ? '#FFEDE5' : '#FFFFFF',
                        border: `1px solid ${active ? '#E97852' : '#ECE3D7'}`,
                        color: active ? '#E97852' : '#5C5248',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all 0.12s ease'
                      }}
                    >
                      {active && <Check size={10} strokeWidth={2.5} />}
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Exclude Keywords */}
            <div>
              <label style={{ fontSize: '10px', color: '#B91C1C', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Ban size={10} /> Exclude Keywords
              </label>
              <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                <input
                  type="text"
                  value={excludeInput}
                  onChange={(e) => setExcludeInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag('excludedTitleKeywords', excludeInput, () => setExcludeInput('')))}
                  placeholder="e.g. Intern, Assistant..."
                  style={{ flex: 1, background: '#FFFFFF', border: '1px solid #ECE3D7', borderRadius: '8px', padding: '6px 10px', fontSize: '11.5px', color: '#161616', outline: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => addTag('excludedTitleKeywords', excludeInput, () => setExcludeInput(''))}
                  style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', borderRadius: '8px', padding: '0 9px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  <Plus size={13} />
                </button>
              </div>

              {filters.excludedTitleKeywords.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '6px' }}>
                  {filters.excludedTitleKeywords.map((kw) => (
                    <span key={kw} style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '3px 8px', borderRadius: '999px', fontSize: '10.5px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      -{kw} <X size={10} style={{ cursor: 'pointer' }} onClick={() => removeTag('excludedTitleKeywords', kw)} />
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Tenure */}
            <div>
              <label style={{ fontSize: '10px', color: '#756E66', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Years in Role</label>
              <select
                value={filters.yearsInRole}
                onChange={(e) => onChange({ ...filters, yearsInRole: e.target.value })}
                style={{ width: '100%', marginTop: '4px', background: '#FFFFFF', border: '1px solid #ECE3D7', borderRadius: '8px', padding: '6px 10px', fontSize: '11.5px', color: '#161616', outline: 'none' }}
              >
                {YEARS_IN_ROLE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Group: Company & Headcount */}
      <div style={{ background: '#FAF6F0', border: '1px solid #ECE3D7', borderRadius: '12px', overflow: 'hidden' }}>
        <button
          type="button"
          onClick={() => toggleSection('company')}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'none', border: 'none', color: '#2D2824', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer' }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Building size={13} color="#10B981" /> Company & Headcount
          </span>
          {openSections.company ? <ChevronUp size={13} color="#756E66" /> : <ChevronDown size={13} color="#756E66" />}
        </button>

        {openSections.company && (
          <div style={{ padding: '12px', borderTop: '1px solid #ECE3D7', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ fontSize: '10px', color: '#756E66', fontWeight: 700, textTransform: 'uppercase' }}>Company / Domain</label>
                <div style={{ display: 'flex', gap: '2px', background: '#FFFFFF', padding: '2px', borderRadius: '6px', border: '1px solid #ECE3D7' }}>
                  <button
                    type="button"
                    onClick={() => onChange({ ...filters, companyMode: 'include' })}
                    style={{ background: filters.companyMode === 'include' ? '#ECFDF5' : 'none', color: filters.companyMode === 'include' ? '#059669' : '#756E66', border: 'none', borderRadius: '4px', fontSize: '9.5px', fontWeight: 'bold', padding: '1px 6px', cursor: 'pointer' }}
                  >
                    Inc
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange({ ...filters, companyMode: 'exclude' })}
                    style={{ background: filters.companyMode === 'exclude' ? '#FEF2F2' : 'none', color: filters.companyMode === 'exclude' ? '#B91C1C' : '#756E66', border: 'none', borderRadius: '4px', fontSize: '9.5px', fontWeight: 'bold', padding: '1px 6px', cursor: 'pointer' }}
                  >
                    Exc
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                <input
                  type="text"
                  value={companyInput}
                  onChange={(e) => setCompanyInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag('companyNames', companyInput, () => setCompanyInput('')))}
                  placeholder="e.g. Google, Stripe..."
                  style={{ flex: 1, background: '#FFFFFF', border: '1px solid #ECE3D7', borderRadius: '8px', padding: '6px 10px', fontSize: '11.5px', color: '#161616', outline: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => addTag('companyNames', companyInput, () => setCompanyInput(''))}
                  style={{ background: '#FFEDE5', border: '1px solid #F0DCD3', color: '#E97852', borderRadius: '8px', padding: '0 9px', cursor: 'pointer' }}
                >
                  <Plus size={13} />
                </button>
              </div>

              {filters.companyNames.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '6px' }}>
                  {filters.companyNames.map((c) => (
                    <span key={c} style={{ background: filters.companyMode === 'exclude' ? '#FEF2F2' : '#ECFDF5', border: `1px solid ${filters.companyMode === 'exclude' ? '#FCA5A5' : '#A7F3D0'}`, color: filters.companyMode === 'exclude' ? '#B91C1C' : '#059669', padding: '3px 8px', borderRadius: '999px', fontSize: '10.5px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      {filters.companyMode === 'exclude' ? `-${c}` : c} <X size={10} style={{ cursor: 'pointer' }} onClick={() => removeTag('companyNames', c)} />
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Headcount */}
            <div>
              <label style={{ fontSize: '10px', color: '#756E66', fontWeight: 700, textTransform: 'uppercase' }}>Employee Headcount</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', marginTop: '4px' }}>
                {HEADCOUNT_OPTIONS.map((opt) => {
                  const active = filters.headcountRanges.includes(opt.value)
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleCheckbox('headcountRanges', opt.value)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '10.5px',
                        cursor: 'pointer',
                        background: active ? '#FFEDE5' : '#FFFFFF',
                        border: `1px solid ${active ? '#E97852' : '#ECE3D7'}`,
                        color: active ? '#E97852' : '#5C5248',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontWeight: active ? 600 : 400
                      }}
                    >
                      {active && <Check size={10} strokeWidth={2.5} />} {opt.value}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Group: Data Quality */}
      <div style={{ background: '#FAF6F0', border: '1px solid #ECE3D7', borderRadius: '12px', overflow: 'hidden' }}>
        <button
          type="button"
          onClick={() => toggleSection('quality')}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'none', border: 'none', color: '#2D2824', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer' }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={13} color="#10B981" /> Data Quality
          </span>
          {openSections.quality ? <ChevronUp size={13} color="#756E66" /> : <ChevronDown size={13} color="#756E66" />}
        </button>

        {openSections.quality && (
          <div style={{ padding: '12px', borderTop: '1px solid #ECE3D7', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px', color: '#2D2824', cursor: 'pointer' }}>
              <span>Verified Email Only</span>
              <input
                type="checkbox"
                checked={filters.verifiedEmailOnly}
                onChange={(e) => onChange({ ...filters, verifiedEmailOnly: e.target.checked })}
                style={{ accentColor: '#E97852', cursor: 'pointer' }}
              />
            </label>

            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px', color: '#2D2824', cursor: 'pointer' }}>
              <span>Has LinkedIn Profile</span>
              <input
                type="checkbox"
                checked={filters.hasLinkedIn}
                onChange={(e) => onChange({ ...filters, hasLinkedIn: e.target.checked })}
                style={{ accentColor: '#E97852', cursor: 'pointer' }}
              />
            </label>
          </div>
        )}
      </div>
    </aside>
  )
}
