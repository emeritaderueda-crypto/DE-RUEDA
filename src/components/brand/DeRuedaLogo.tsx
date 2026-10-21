import React from 'react';

interface DeRuedaLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'horizontal' | 'stacked' | 'icon-only';
  theme?: 'dark' | 'light';
  showSubtitle?: boolean;
}

export const DeRuedaLogo: React.FC<DeRuedaLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'horizontal',
  theme = 'dark',
  showSubtitle = true,
}) => {
  const iconSizes = {
    sm: { width: 32, height: 26 },
    md: { width: 44, height: 36 },
    lg: { width: 58, height: 48 },
    xl: { width: 78, height: 64 },
  };

  const textSizes = {
    sm: { title: 'text-sm', sub: 'text-[9px]' },
    md: { title: 'text-lg', sub: 'text-[11px]' },
    lg: { title: 'text-2xl', sub: 'text-xs' },
    xl: { title: 'text-3xl', sub: 'text-sm' },
  };

  const currentIcon = iconSizes[size];
  const currentText = textSizes[size];

  // SVG Architectural Glossy Green Emblem
  const EmblemSvg = (
    <div className="relative inline-flex items-center justify-center shrink-0">
      <svg
        width={currentIcon.width}
        height={currentIcon.height}
        viewBox="0 0 120 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="filter drop-shadow-[0_4px_12px_rgba(16,185,129,0.35)] transition-transform duration-300 hover:scale-105"
      >
        <defs>
          {/* Glossy Green Top Gradients */}
          <linearGradient id="drGlossyGreenTop" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#bef264" />
            <stop offset="35%" stopColor="#84cc16" />
            <stop offset="70%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#15803d" />
          </linearGradient>

          {/* Deep Architectural Pillar Gradient */}
          <linearGradient id="drGlossyPillar" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#a3e635" />
            <stop offset="30%" stopColor="#10b981" />
            <stop offset="75%" stopColor="#047857" />
            <stop offset="100%" stopColor="#064e3b" />
          </linearGradient>

          {/* Chrome / Specular Highlight */}
          <linearGradient id="drChromeHighlight" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="40%" stopColor="#d9f99d" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          {/* Dark Blue Base Shadow */}
          <linearGradient id="drDeepNavyShadow" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0b132b" />
            <stop offset="100%" stopColor="#1e3a8a" />
          </linearGradient>
        </defs>

        {/* Base Foundation Glow */}
        <ellipse cx="60" cy="94" rx="48" ry="5" fill="#10b981" fillOpacity="0.3" filter="blur(3px)" />

        {/* 3D Vertical Architectural Tower Beams (Angled Ascent) */}
        {/* Beam 1 (Leftmost, Shortest) */}
        <polygon points="12,72 26,48 36,52 22,76" fill="url(#drGlossyPillar)" />
        <polygon points="26,48 30,42 40,46 36,52" fill="#d9f99d" />
        <polygon points="36,52 40,46 26,70 22,76" fill="#047857" />

        {/* Beam 2 (Middle) */}
        <polygon points="28,68 46,32 58,37 40,73" fill="url(#drGlossyPillar)" />
        <polygon points="46,32 52,24 64,29 58,37" fill="#ecfccb" />
        <polygon points="58,37 64,29 46,65 40,73" fill="#065f46" />

        {/* Beam 3 (Tallest Center Spine) */}
        <polygon points="48,64 68,16 82,22 62,70" fill="url(#drGlossyGreenTop)" />
        <polygon points="68,16 74,8 88,14 82,22" fill="#ffffff" fillOpacity="0.95" />
        <polygon points="82,22 88,14 68,62 62,70" fill="#047857" />

        {/* Horizontal Cantilever Truss ("E" / Dynamic Rueda Cross Beams) */}
        {/* Top Horizontal Wing */}
        <path
          d="M 44 34 L 102 34 L 92 48 L 38 48 Z"
          fill="url(#drGlossyGreenTop)"
          stroke="#a3e635"
          strokeWidth="1.2"
        />
        {/* Top Wing Glossy Highlight */}
        <path d="M 46 36 L 98 36 L 92 41 L 42 41 Z" fill="url(#drChromeHighlight)" />

        {/* Middle Horizontal Beam */}
        <path
          d="M 36 54 L 88 54 L 80 64 L 30 64 Z"
          fill="url(#drGlossyPillar)"
          stroke="#4ade80"
          strokeWidth="1"
        />

        {/* Bottom Horizontal Base Ramp */}
        <path
          d="M 18 74 L 112 74 L 98 88 L 8 88 Z"
          fill="url(#drGlossyGreenTop)"
          stroke="#22c55e"
          strokeWidth="1.2"
        />
        {/* Bottom Ramp Highlight Line */}
        <path d="M 22 76 L 108 76 L 98 81 L 14 81 Z" fill="url(#drChromeHighlight)" />

        {/* Subtle Architectural Corner Pins */}
        <circle cx="102" cy="34" r="2" fill="#ffffff" />
        <circle cx="88" cy="54" r="2" fill="#ffffff" />
        <circle cx="112" cy="74" r="2.2" fill="#ffffff" />
      </svg>

      {/* Restrained Pink Glitter Star Accent (PDF instruction: 'with a little pink glitter used sparingly as a decorative accent') */}
      <span
        aria-hidden="true"
        className="absolute -top-1 -right-1 text-[#f472b6] animate-pulse pointer-events-none select-none text-[10px]"
        title="Quality & Precision"
      >
        ✦
      </span>
    </div>
  );

  if (variant === 'icon-only') {
    return <div className={`inline-flex items-center ${className}`}>{EmblemSvg}</div>;
  }

  const isLight = theme === 'light';

  return (
    <div
      className={`inline-flex ${
        variant === 'stacked' ? 'flex-col items-center text-center gap-1.5' : 'flex-row items-center gap-3'
      } ${className}`}
    >
      {EmblemSvg}

      <div className="flex flex-col leading-none">
        <div className="flex items-baseline gap-1 tracking-tight">
          <span className="font-extrabold italic text-[#84cc16] text-opacity-95 font-sans lowercase text-[0.88em]">
            de
          </span>
          <span
            className={`font-black uppercase tracking-wider font-sans ${
              isLight ? 'text-[#0a1128]' : 'text-white'
            } ${currentText.title}`}
          >
            RUEDA
          </span>
          {/* Second subtle pink glitter spark */}
          <span className="text-[#f472b6] text-[9px] font-bold opacity-80 select-none ml-0.5">✦</span>
        </div>

        {showSubtitle && (
          <div
            className={`font-bold tracking-[0.28em] uppercase font-sans mt-0.5 ${
              isLight ? 'text-[#1e3a8a]' : 'text-[#38bdf8]'
            } ${currentText.sub}`}
          >
            CONSTRUCTION
          </div>
        )}
      </div>
    </div>
  );
};
