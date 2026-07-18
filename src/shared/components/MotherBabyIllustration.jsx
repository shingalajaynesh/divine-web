import React from 'react';

export default function MotherBabyIllustration({ style = {}, ...props }) {
  return (
    <svg 
      viewBox="10 10 140 145" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      style={{ width: '100%', height: '100%', objectFit: 'contain', ...style }}
      aria-label="Layered premium vector illustration of a pregnant mother and baby overlapping a mandala halo"
      role="img"
      {...props}
    >
      {/* BACKGROUND LAYER 1: Radial Soft Glow */}
      <circle cx="85" cy="80" r="65" fill="url(#halo-bg-glow)" opacity="0.45" />

      {/* BACKGROUND LAYER 2: Sanskrit-Inspired Mandala Halo */}
      <g opacity="0.4">
        {/* Outer dotted orbit */}
        <circle cx="85" cy="80" r="58" stroke="#F59E0B" strokeWidth="1" strokeDasharray="3 3" />
        {/* Inner circle of light rays */}
        <circle cx="85" cy="80" r="48" stroke="#FFD700" strokeWidth="1.2" />
        {/* Rays from the center */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i * 30 * Math.PI) / 180;
          const x1 = 85 + 48 * Math.cos(angle);
          const y1 = 80 + 48 * Math.sin(angle);
          const x2 = 85 + 54 * Math.cos(angle);
          const y2 = 80 + 54 * Math.sin(angle);
          return (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
          );
        })}
        {/* Sacred geometric ring accents */}
        <circle cx="85" cy="80" r="38" stroke="#FFE4E6" strokeWidth="0.8" />
      </g>

      {/* BACKGROUND LAYER 3: Organic Flowing Waves & Ribbons */}
      <path d="M15 110C50 95 90 120 145 95V145H15V110Z" fill="url(#organic-wave-grad)" opacity="0.3" />
      <path d="M10 125C60 110 95 140 145 125V145H10V125Z" fill="url(#organic-wave-grad2)" opacity="0.2" />

      {/* Decorative Botanical Leaf Accents */}
      <g opacity="0.3">
        <path d="M15 85C20 75 32 72 38 78C40 80 38 88 32 92C26 95 12 92 15 85Z" fill="#287a55" />
        <path d="M135 75C132 65 120 62 115 68C112 70 115 78 120 82C126 85 138 82 135 75Z" fill="#287a55" />
      </g>

      {/* --- CHARACTER LAYER 1: PREGNANT MOTHER --- */}
      {/* Hair shadow */}
      <path d="M98 32C96 16 112 5 125 12C138 18 142 38 138 54C134 70 118 78 108 78C102 78 98 66 98 32Z" fill="#2D1A15" />
      {/* Bun */}
      <circle cx="126" cy="14" r="7" fill="#1C0D0A" />

      {/* Face & Neck */}
      <path d="M106 48C104 51 101 54 98 58C95 62 95 66 97 70C99 72 104 71 107 70L110 78C111 81 114 84 118 82C122 80 124 76 122 72L118 60C116 56 111 51 106 48Z" fill="#FFE3D1" />
      <circle cx="114" cy="50" r="15" fill="#FFE3D1" />

      {/* Eyelash & Smile */}
      <path d="M102 46C104 48 108 48 110 46" stroke="#2D1A15" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M104 47L103 50" stroke="#2D1A15" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M107 47L107 50" stroke="#2D1A15" strokeWidth="1.2" strokeLinecap="round" />
      {/* Smile */}
      <path d="M100 56C102 58 105 58 107 56" stroke="#C25A66" strokeWidth="1.5" strokeLinecap="round" />
      {/* Blush */}
      <circle cx="110" cy="54" r="3.5" fill="#FF8A9A" opacity="0.45" />

      {/* Dress & Bump */}
      <path d="M106 70C94 76 84 91 86 114C88 136 98 154 112 158C126 162 138 148 141 126C144 104 132 86 124 80C118 75 112 72 106 70Z" fill="url(#dress-gradient-rich)" />
      {/* Bump Highlight */}
      <path d="M90 104C87 114 89 126 94 136C100 144 110 146 118 138C106 132 98 120 90 104Z" fill="#FFA4B4" opacity="0.65" />

      {/* --- CHARACTER LAYER 2: CUTE TODDLER --- */}
      {/* Body */}
      <path d="M34 118C26 124 21 134 23 150C25 162 36 168 48 168C60 168 68 156 66 142C64 128 54 120 48 118C42 116 38 116 34 118Z" fill="url(#toddler-tee-grad)" />
      {/* Head */}
      <circle cx="44" cy="98" r="13" fill="#FFE3D1" />
      {/* Hair */}
      <path d="M30 94C32 86 42 80 52 84C58 86 60 92 58 98C54 94 42 91 30 94Z" fill="#5C3A21" />
      {/* Eyes & Smile */}
      <circle cx="38" cy="97" r="1.8" fill="#2D1A15" />
      <circle cx="37.5" cy="96.2" r="0.6" fill="#FFF" />
      <circle cx="46" cy="97" r="1.8" fill="#2D1A15" />
      <circle cx="45.5" cy="96.2" r="0.6" fill="#FFF" />
      <path d="M39 104C41 106 43 106 45 104" stroke="#B03A48" strokeWidth="1.8" strokeLinecap="round" />
      {/* Blush */}
      <circle cx="36" cy="101" r="2.2" fill="#FF8A9A" opacity="0.5" />
      <circle cx="48" cy="101" r="2.2" fill="#FF8A9A" opacity="0.5" />

      {/* Waving Baby Hand (Animated) */}
      <g className="animated-wave-hand">
        <path d="M54 120C60 116 66 108 70 100C71 97 68 94 65 96C61 100 56 110 52 114" stroke="#FFE3D1" strokeWidth="7" strokeLinecap="round" />
        <circle cx="70" cy="96" r="5.5" fill="#FFE3D1" />
        <path d="M68 90V87" stroke="#FFE3D1" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M71.5 89V85" stroke="#FFE3D1" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M75 91V88" stroke="#FFE3D1" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M65 94L62 92" stroke="#FFE3D1" strokeWidth="1.5" strokeLinecap="round" />
      </g>

      {/* BACKGROUND LAYER 4: Floating Hearts & Glow Particles */}
      <g className="animated-heart">
        <path d="M76 56C74 53 70 53 68 55C66 57 66 61 68 63L76 71L84 63C86 61 86 57 84 55C82 53 78 53 76 56Z" fill="#FF4D6A" />
      </g>
      <g className="animated-heart" style={{ animationDelay: '1.2s' }}>
        <path d="M64 42C62.5 40 59.5 40 58 41.5C56.5 43 56.5 46 58 47.5L64 54L70 47.5C71.5 46 71.5 43 70 41.5C68.5 40 65.5 40 64 42Z" fill="#FFA4B4" />
      </g>

      {/* Gradients Definitions */}
      <defs>
        <radialGradient id="halo-bg-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFEDD5" />
          <stop offset="100%" stopColor="#FFF" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="organic-wave-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF1F2" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#FFE4E6" stopOpacity="0.8" />
        </linearGradient>
        <linearGradient id="organic-wave-grad2" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFEDD5" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#FFE4E6" stopOpacity="0.6" />
        </linearGradient>
        <linearGradient id="dress-gradient-rich" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDA4AF" />
          <stop offset="100%" stopColor="#F43F5E" />
        </linearGradient>
        <linearGradient id="toddler-tee-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#BAE6FD" />
          <stop offset="100%" stopColor="#0EA5E9" />
        </linearGradient>
      </defs>
    </svg>
  );
}
