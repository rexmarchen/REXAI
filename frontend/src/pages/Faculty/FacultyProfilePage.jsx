import React, { useState, useEffect } from 'react'
import {
  UserCheck,
  Building,
  GraduationCap,
  Award,
  Save,
  CheckCircle2,
  Lock,
  Plus,
  Trash2,
  ShieldCheck,
  Info
} from 'lucide-react'
import facultyApi from '../../services/facultyApi'

const TITLES = ['Professor', 'Dr.', 'Prof.', 'Mr.', 'Ms.', 'Mrs.', 'Other']
const DESIGNATIONS = [
  'Professor',
  'Associate Professor',
  'Assistant Professor',
  'Lecturer',
  'Faculty Member',
  'Dean / Department Head',
  'Other'
]
const INSTITUTION_TYPES = ['University', 'College', 'School', 'Training Institute', 'Other']
const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Visiting', 'Other']

const FacultyProfilePage = () => {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)

  const [form, setForm] = useState({
    fullName: '',
    avatarUrl: '',
    professionalTitle: 'Professor',
    designation: 'Assistant Professor',
    bio: '',
    contactEmail: '',
    phone: '',
    institutionName: '',
    institutionType: 'College',
    department: '',
    city: '',
    state: '',
    country: 'India',
    website: '',
    employeeId: '',
    employmentType: 'Full-time',
    qualifications: [],
    teachingSubjects: '',
    yearsOfExperience: 0,
    coursesTaught: '',
    certifications: '',
    researchInterests: '',
    achievements: ''
  })

  useEffect(() => {
    facultyApi.getProfile()
      .then(res => {
        const p = res.profile
        if (p) {
          setProfile(p)
          setForm({
            fullName: p.fullName || '',
            avatarUrl: p.avatarUrl || '',
            professionalTitle: p.professionalTitle || 'Professor',
            designation: p.designation || 'Assistant Professor',
            bio: p.bio || '',
            contactEmail: p.contactEmail || '',
            phone: p.phone || '',
            institutionName: p.institutionName || '',
            institutionType: p.institutionType || 'College',
            department: p.department || '',
            city: p.city || '',
            state: p.state || '',
            country: p.country || 'India',
            website: p.website || '',
            employeeId: p.employeeId || '',
            employmentType: p.employmentType || 'Full-time',
            qualifications: Array.isArray(p.qualifications) && p.qualifications.length ? p.qualifications : [{ degree: '', specialization: '', institution: '', graduationYear: '' }],
            teachingSubjects: Array.isArray(p.teachingSubjects) ? p.teachingSubjects.join(', ') : '',
            yearsOfExperience: p.yearsOfExperience || 0,
            coursesTaught: Array.isArray(p.coursesTaught) ? p.coursesTaught.join(', ') : '',
            certifications: Array.isArray(p.certifications) ? p.certifications.join(', ') : '',
            researchInterests: Array.isArray(p.researchInterests) ? p.researchInterests.join(', ') : '',
            achievements: Array.isArray(p.achievements) ? p.achievements.join(', ') : ''
          })
        }
      })
      .catch(err => {
        setErrorMsg(err.response?.data?.message || err.message)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleQualChange = (index, field, value) => {
    const updated = [...form.qualifications]
    updated[index] = { ...updated[index], [field]: value }
    setForm(prev => ({ ...prev, qualifications: updated }))
  }

  const addQualification = () => {
    setForm(prev => ({
      ...prev,
      qualifications: [...prev.qualifications, { degree: '', specialization: '', institution: '', graduationYear: '' }]
    }))
  }

  const removeQualification = (index) => {
    setForm(prev => ({
      ...prev,
      qualifications: prev.qualifications.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSuccessMsg(null)
    setErrorMsg(null)

    try {
      const payload = {
        ...form,
        yearsOfExperience: Number(form.yearsOfExperience) || 0,
        qualifications: form.qualifications.filter(q => q.degree && q.institution).map(q => ({
          degree: q.degree.trim(),
          specialization: (q.specialization || '').trim(),
          institution: q.institution.trim(),
          graduationYear: q.graduationYear ? Number(q.graduationYear) : undefined
        })),
        teachingSubjects: form.teachingSubjects.split(',').map(s => s.trim()).filter(Boolean),
        coursesTaught: form.coursesTaught.split(',').map(s => s.trim()).filter(Boolean),
        certifications: form.certifications.split(',').map(s => s.trim()).filter(Boolean),
        researchInterests: form.researchInterests.split(',').map(s => s.trim()).filter(Boolean),
        achievements: form.achievements.split(',').map(s => s.trim()).filter(Boolean)
      }

      const res = await facultyApi.updateProfile(payload)
      setProfile(res.profile)
      setSuccessMsg('Faculty profile updated successfully! Profile completion: ' + (res.profileCompletion || 0) + '%')
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center', color: '#8C7B6D' }}>
        <GraduationCap size={32} style={{ animation: 'bounce 1s infinite', color: '#2563EB', marginBottom: 12 }} />
        <div style={{ fontWeight: 600 }}>Loading Faculty Profile...</div>
      </div>
    )
  }

  const completion = profile?.profileCompletion || 0

  return (
    <div style={{ maxWidth: 920, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* ── HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#231C16', margin: 0 }}>
            Faculty & Educator Profile
          </h2>
          <p style={{ color: '#8C7B6D', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            Manage your personal, institutional, and academic credentials shown on your quizzes.
          </p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving}
          style={{
            background: '#2563EB',
            color: '#FFFFFF',
            border: 'none',
            padding: '10px 24px',
            borderRadius: 999,
            fontWeight: 700,
            fontSize: '0.86rem',
            cursor: saving ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: '0 4px 14px rgba(37,99,235,0.25)'
          }}
        >
          <Save size={15} /> {saving ? 'Saving Changes...' : 'Save Profile Changes'}
        </button>
      </div>

      {successMsg && (
        <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', padding: '12px 18px', borderRadius: 12, fontWeight: 600, fontSize: '0.86rem' }}>
          ✓ {successMsg}
        </div>
      )}

      {errorMsg && (
        <div style={{ background: '#FCEFEB', border: '1px solid #F5C6CB', color: '#721C24', padding: '12px 18px', borderRadius: 12, fontWeight: 600, fontSize: '0.86rem' }}>
          ⚠️ {errorMsg}
        </div>
      )}

      {/* ── PROFILE COMPLETION GAUGE ── */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 18,
        border: '1px solid #ECE4D8',
        padding: '18px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div style={{ flex: '1 1 300px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#231C16' }}>
              Academic Profile Completion Meter
            </span>
            <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#2563EB' }}>
              {completion}%
            </span>
          </div>
          <div style={{ background: '#ECE4D8', height: 8, borderRadius: 999, overflow: 'hidden' }}>
            <div style={{
              width: `${completion}%`,
              height: '100%',
              background: completion >= 80 ? '#10B981' : (completion >= 50 ? '#2563EB' : '#F59E0B'),
              transition: 'width 0.4s ease'
            }} />
          </div>
        </div>
        <div style={{ fontSize: '0.78rem', color: '#8C7B6D', maxWidth: 380, lineHeight: 1.4 }}>
          Complete institutional details and academic qualifications to maximize credibility for students taking your quizzes.
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* SECTION A: Personal & Professional Details */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 18,
          border: '1px solid #ECE4D8',
          padding: 28,
          display: 'flex',
          flexDirection: 'column',
          gap: 18
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #ECE4D8', paddingBottom: 12 }}>
            <UserCheck size={20} color="#2563EB" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#231C16', margin: 0 }}>
              A. Personal & Professional Details
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#231C16', marginBottom: 6 }}>
                Full Name *
              </label>
              <input
                type="text"
                name="fullName"
                required
                value={form.fullName}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #ECE4D8', background: '#F8F4EE', fontSize: '0.88rem', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#231C16', marginBottom: 6 }}>
                Professional Title
              </label>
              <select
                name="professionalTitle"
                value={form.professionalTitle}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #ECE4D8', background: '#F8F4EE', fontSize: '0.88rem', boxSizing: 'border-box' }}
              >
                {TITLES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#231C16', marginBottom: 6 }}>
                Academic Designation *
              </label>
              <select
                name="designation"
                value={form.designation}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #ECE4D8', background: '#F8F4EE', fontSize: '0.88rem', boxSizing: 'border-box' }}
              >
                {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#231C16', marginBottom: 6 }}>
                Professional Contact Email *
              </label>
              <input
                type="email"
                name="contactEmail"
                required
                value={form.contactEmail}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #ECE4D8', background: '#F8F4EE', fontSize: '0.88rem', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#231C16', marginBottom: 6 }}>
                Phone Number (Optional)
              </label>
              <input
                type="text"
                name="phone"
                placeholder="+91 98765 43210"
                value={form.phone}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #ECE4D8', background: '#F8F4EE', fontSize: '0.88rem', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#231C16', marginBottom: 6 }}>
                Profile Photo URL
              </label>
              <input
                type="url"
                name="avatarUrl"
                placeholder="https://..."
                value={form.avatarUrl}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #ECE4D8', background: '#F8F4EE', fontSize: '0.88rem', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#231C16', marginBottom: 6 }}>
              Professional Biography
            </label>
            <textarea
              name="bio"
              rows={3}
              placeholder="Summary of your teaching career, research background, and educational focus..."
              value={form.bio}
              onChange={handleInputChange}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ECE4D8', background: '#F8F4EE', fontSize: '0.88rem', boxSizing: 'border-box', fontFamily: 'inherit' }}
            />
          </div>
        </div>

        {/* SECTION B: Institution Information */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 18,
          border: '1px solid #ECE4D8',
          padding: 28,
          display: 'flex',
          flexDirection: 'column',
          gap: 18
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #ECE4D8', paddingBottom: 12 }}>
            <Building size={20} color="#2563EB" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#231C16', margin: 0 }}>
              B. Institution Information
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#231C16', marginBottom: 6 }}>
                Institution Name * (Any University or College)
              </label>
              <input
                type="text"
                name="institutionName"
                required
                placeholder="e.g. Indian Institute of Technology / Oxford"
                value={form.institutionName}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #ECE4D8', background: '#F8F4EE', fontSize: '0.88rem', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#231C16', marginBottom: 6 }}>
                Institution Type
              </label>
              <select
                name="institutionType"
                value={form.institutionType}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #ECE4D8', background: '#F8F4EE', fontSize: '0.88rem', boxSizing: 'border-box' }}
              >
                {INSTITUTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#231C16', marginBottom: 6 }}>
                Department *
              </label>
              <input
                type="text"
                name="department"
                required
                placeholder="e.g. Department of Computer Science & Engineering"
                value={form.department}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #ECE4D8', background: '#F8F4EE', fontSize: '0.88rem', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#231C16', marginBottom: 6 }}>
                Employment Type
              </label>
              <select
                name="employmentType"
                value={form.employmentType}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #ECE4D8', background: '#F8F4EE', fontSize: '0.88rem', boxSizing: 'border-box' }}
              >
                {EMPLOYMENT_TYPES.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#231C16', marginBottom: 6 }}>
                City
              </label>
              <input
                type="text"
                name="city"
                value={form.city}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #ECE4D8', background: '#F8F4EE', fontSize: '0.88rem', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#231C16', marginBottom: 6 }}>
                Country
              </label>
              <input
                type="text"
                name="country"
                value={form.country}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #ECE4D8', background: '#F8F4EE', fontSize: '0.88rem', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#231C16', marginBottom: 6 }}>
                Official Institution Website
              </label>
              <input
                type="url"
                name="website"
                placeholder="https://..."
                value={form.website}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #ECE4D8', background: '#F8F4EE', fontSize: '0.88rem', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', fontWeight: 700, color: '#231C16', marginBottom: 6 }}>
                Faculty / Employee ID <Lock size={12} color="#D96B43" title="Private field" />
              </label>
              <input
                type="text"
                name="employeeId"
                placeholder="e.g. FAC-2024-8849"
                value={form.employeeId}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #ECE4D8', background: '#F8F4EE', fontSize: '0.88rem', boxSizing: 'border-box' }}
              />
              <span style={{ fontSize: '0.72rem', color: '#8C7B6D' }}>
                Strictly private — never exposed on public profile cards.
              </span>
            </div>
          </div>
        </div>

        {/* SECTION C: Academic Qualifications & Teaching Subjects */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 18,
          border: '1px solid #ECE4D8',
          padding: 28,
          display: 'flex',
          flexDirection: 'column',
          gap: 18
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #ECE4D8', paddingBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <GraduationCap size={20} color="#2563EB" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#231C16', margin: 0 }}>
                C. Academic Qualifications & Expertise
              </h3>
            </div>
            <button
              type="button"
              onClick={addQualification}
              style={{
                background: '#EEF4FD',
                color: '#1D4ED8',
                border: 'none',
                padding: '6px 14px',
                borderRadius: 999,
                fontWeight: 700,
                fontSize: '0.78rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <Plus size={13} /> Add Qualification
            </button>
          </div>

          {/* Qualification records */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {form.qualifications.map((q, idx) => (
              <div key={idx} style={{
                background: '#F8F4EE',
                borderRadius: 12,
                border: '1px solid #ECE4D8',
                padding: 14,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr)) auto',
                gap: 10,
                alignItems: 'center'
              }}>
                <input
                  type="text"
                  placeholder="Degree (e.g. Ph.D., M.Tech)"
                  value={q.degree}
                  onChange={(e) => handleQualChange(idx, 'degree', e.target.value)}
                  style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #ECE4D8', background: '#FFFFFF', fontSize: '0.82rem' }}
                />
                <input
                  type="text"
                  placeholder="Specialization (e.g. AI / Compilers)"
                  value={q.specialization}
                  onChange={(e) => handleQualChange(idx, 'specialization', e.target.value)}
                  style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #ECE4D8', background: '#FFFFFF', fontSize: '0.82rem' }}
                />
                <input
                  type="text"
                  placeholder="University / Institution"
                  value={q.institution}
                  onChange={(e) => handleQualChange(idx, 'institution', e.target.value)}
                  style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #ECE4D8', background: '#FFFFFF', fontSize: '0.82rem' }}
                />
                <input
                  type="number"
                  placeholder="Graduation Year"
                  value={q.graduationYear || ''}
                  onChange={(e) => handleQualChange(idx, 'graduationYear', e.target.value)}
                  style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #ECE4D8', background: '#FFFFFF', fontSize: '0.82rem' }}
                />
                <button
                  type="button"
                  onClick={() => removeQualification(idx)}
                  style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 6 }}
                  title="Remove Qualification"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#231C16', marginBottom: 6 }}>
                Teaching Subjects / Areas of Expertise (Comma-separated) *
              </label>
              <input
                type="text"
                name="teachingSubjects"
                placeholder="e.g. Data Structures, Operating Systems, Machine Learning"
                value={form.teachingSubjects}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #ECE4D8', background: '#F8F4EE', fontSize: '0.88rem', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#231C16', marginBottom: 6 }}>
                Years of Teaching Experience
              </label>
              <input
                type="number"
                name="yearsOfExperience"
                min="0"
                max="60"
                value={form.yearsOfExperience}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #ECE4D8', background: '#F8F4EE', fontSize: '0.88rem', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#231C16', marginBottom: 6 }}>
                Courses / Student Levels Taught
              </label>
              <input
                type="text"
                name="coursesTaught"
                placeholder="e.g. B.Tech CS, MCA, Postgraduate Advanced Algorithms"
                value={form.coursesTaught}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #ECE4D8', background: '#F8F4EE', fontSize: '0.88rem', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#231C16', marginBottom: 6 }}>
                Research Interests & Certifications
              </label>
              <input
                type="text"
                name="researchInterests"
                placeholder="e.g. Deep Learning, Distributed Systems, ACM Senior Member"
                value={form.researchInterests}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #ECE4D8', background: '#F8F4EE', fontSize: '0.88rem', boxSizing: 'border-box' }}
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button
            type="submit"
            disabled={saving}
            style={{
              background: '#2563EB',
              color: '#FFFFFF',
              border: 'none',
              padding: '12px 28px',
              borderRadius: 999,
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: saving ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 16px rgba(37,99,235,0.25)'
            }}
          >
            <Save size={16} /> {saving ? 'Saving...' : 'Save Academic Profile'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default FacultyProfilePage
