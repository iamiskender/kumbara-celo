export default function PiggyIllustration() {
  return (
    <svg width="260" height="220" viewBox="0 0 260 220" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* govde */}
      <ellipse cx="130" cy="130" rx="95" ry="68" fill="#FBCC5C" />
      <ellipse cx="130" cy="130" rx="95" ry="68" fill="url(#shade)" />
      {/* kulaklar */}
      <path d="M70 75 Q60 50 85 55 Q90 70 78 85 Z" fill="#E8A33D" />
      <path d="M190 75 Q200 50 175 55 Q170 70 182 85 Z" fill="#E8A33D" />
      {/* burun */}
      <ellipse cx="215" cy="135" rx="22" ry="18" fill="#E8A33D" />
      <ellipse cx="208" cy="135" rx="3.5" ry="5" fill="#2B2118" />
      <ellipse cx="222" cy="135" rx="3.5" ry="5" fill="#2B2118" />
      {/* gozler */}
      <circle cx="150" cy="110" r="4.5" fill="#2B2118" />
      <circle cx="180" cy="108" r="4.5" fill="#2B2118" />
      {/* madeni para yarigi */}
      <rect x="110" y="62" width="46" height="9" rx="4.5" fill="#2B2118" />
      {/* ayaklar */}
      <rect x="80" y="185" width="16" height="22" rx="6" fill="#E8A33D" />
      <rect x="170" y="185" width="16" height="22" rx="6" fill="#E8A33D" />
      <rect x="115" y="190" width="16" height="22" rx="6" fill="#E8A33D" />
      {/* kuyruk */}
      <path d="M30 120 Q10 110 18 95 Q26 105 35 108" stroke="#E8A33D" strokeWidth="6" strokeLinecap="round" fill="none" />
      {/* ucan madeni paralar */}
      <circle cx="125" cy="30" r="11" fill="#C4602E" opacity="0.85" />
      <circle cx="160" cy="18" r="8" fill="#5C7048" opacity="0.85" />
      <circle cx="95" cy="20" r="7" fill="#FBCC5C" stroke="#E8A33D" strokeWidth="2" />
      <defs>
        <linearGradient id="shade" x1="35" y1="62" x2="225" y2="198" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.25" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.06" />
        </linearGradient>
      </defs>
    </svg>
  )
}
