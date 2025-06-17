'use client'

interface JotLogoProps {
  className?: string
  width?: number
  height?: number
}

export default function JotLogo({ className = "", width = 120, height = 60 }: JotLogoProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 400 200"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Notebook icon */}
      <rect
        x="30"
        y="40"
        width="120"
        height="120"
        rx="15"
        ry="15"
        fill="none"
        stroke="#1e3a8a"
        strokeWidth="8"
      />
      
      {/* Spiral binding holes */}
      <circle cx="45" cy="70" r="6" fill="#1e3a8a" />
      <circle cx="45" cy="100" r="6" fill="#1e3a8a" />
      <circle cx="45" cy="130" r="6" fill="#1e3a8a" />
      
      {/* Inner page */}
      <rect
        x="40"
        y="50"
        width="100"
        height="100"
        rx="5"
        ry="5"
        fill="#f8fafc"
        stroke="#e2e8f0"
        strokeWidth="2"
      />
      
      {/* Text lines on page */}
      <line x1="50" y1="70" x2="120" y2="70" stroke="#cbd5e1" strokeWidth="2" />
      <line x1="50" y1="85" x2="110" y2="85" stroke="#cbd5e1" strokeWidth="2" />
      <line x1="50" y1="100" x2="125" y2="100" stroke="#cbd5e1" strokeWidth="2" />
      
      {/* J letter */}
      <path
        d="M 70 60 L 70 120 Q 70 135 55 135 Q 40 135 40 120"
        fill="none"
        stroke="#1e3a8a"
        strokeWidth="6"
        strokeLinecap="round"
      />
      
      {/* Text "Jot" */}
      <text x="180" y="130" fontSize="80" fontWeight="bold" fill="#1e3a8a" fontFamily="system-ui, -apple-system, sans-serif">
        Jot
      </text>
    </svg>
  )
}
