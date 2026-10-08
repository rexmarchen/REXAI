import fs from 'fs'
import path from 'path'

// Simple script to generate SVG icons and base64 PNGs for the extension
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a66c2"/>
      <stop offset="100%" stop-color="#10b981"/>
    </linearGradient>
  </defs>
  <rect width="128" height="128" rx="28" fill="#0b0f17"/>
  <rect x="4" y="4" width="120" height="120" rx="24" fill="none" stroke="url(#g)" stroke-width="4"/>
  <path d="M36 64 L54 82 L92 44" fill="none" stroke="#10b981" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="64" cy="64" r="54" fill="none" stroke="#0a66c2" stroke-width="4" stroke-dasharray="6 6"/>
</svg>`

fs.writeFileSync(path.resolve('scripts/linkedin-safe-runner/icons/icon.svg'), svgContent)
console.log('Icon SVG created successfully!')
