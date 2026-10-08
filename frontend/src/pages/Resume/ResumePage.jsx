import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Sparkles } from 'lucide-react'
import ResumeBuilder from '../../components/resume/ResumeBuilder'
import resumeLeafCorner from '../../assets/resume_leaf_corner.png'

const ResumePage = () => {
  const navigate = useNavigate()

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '1.25rem 1.5rem',
        background: '#FBF8F3',
        position: 'relative',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Top back navigation */}
      <div
        style={{
          maxWidth: '1600px',
          margin: '0 auto 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 4px',
        }}
      >
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          style={{
            background: '#FFFFFF',
            border: '1px solid #ECE3D7',
            color: '#4A3E36',
            fontSize: '12.5px',
            fontWeight: 700,
            padding: '7px 16px',
            borderRadius: '999px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 2px 6px rgba(45, 40, 36, 0.04)',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#E97852'
            e.currentTarget.style.color = '#E97852'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#ECE3D7'
            e.currentTarget.style.color = '#4A3E36'
          }}
        >
          <ArrowLeft size={14} />
          <span>Back to Workspace</span>
        </button>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            fontWeight: 700,
            color: '#756E66',
          }}
        >
          <span
            style={{
              background: '#FFF0EB',
              color: '#E97852',
              border: '1px solid #FCD9CD',
              padding: '3px 10px',
              borderRadius: '999px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Sparkles size={11} /> 24 Designer Templates Active
          </span>
          <span style={{ color: '#E97852' }}>You got this! ♡</span>
        </div>
      </div>

      <div style={{ maxWidth: '1600px', margin: '0 auto', position: 'relative' }}>
        <ResumeBuilder navigate={navigate} />
      </div>

      {/* Botanical leaf accent at bottom right */}
      <img
        src={resumeLeafCorner}
        alt=""
        style={{
          position: 'fixed',
          bottom: '10px',
          right: '10px',
          width: '75px',
          opacity: 0.45,
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />
    </div>
  )
}

export default ResumePage
