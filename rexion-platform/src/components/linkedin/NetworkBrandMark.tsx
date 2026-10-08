import React from 'react'

interface NetworkBrandMarkProps {
  className?: string
  animate?: boolean
  size?: number
}

export function NetworkBrandMark({ className = 'w-8 h-8', animate = true, size = 32 }: NetworkBrandMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Node connecting paths with stroke drawing animation */}
      <path
        d="M8.5 16L23.5 8.5M8.5 16L23.5 23.5M8.5 16H23.5"
        stroke="#0A66C2"
        strokeWidth="2"
        strokeLinecap="round"
        style={{
          strokeDasharray: animate ? '60' : 'none',
          strokeDashoffset: animate ? '60' : '0',
          animation: animate ? 'networkDraw 650ms cubic-bezier(0.16, 1, 0.3, 1) forwards' : 'none'
        }}
      />
      {/* Connected Nodes */}
      <circle cx="8" cy="16" r="3.5" fill="#0A66C2" />
      <circle cx="8" cy="16" r="1.5" fill="#E2E8F0" />
      
      <circle cx="24" cy="8.5" r="3" fill="#0A66C2" />
      <circle cx="24" cy="8.5" r="1.2" fill="#E2E8F0" />
      
      <circle cx="24" cy="23.5" r="3" fill="#0A66C2" />
      <circle cx="24" cy="23.5" r="1.2" fill="#E2E8F0" />

      <circle cx="16" cy="16" r="2" fill="#38BDF8" />
    </svg>
  )
}
