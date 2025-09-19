import React from 'react';
import { useTheme } from '@/store/adapters/themeAdapter';

export default function AnimatedLogo({ size = 128 }: { size?: number }) {
  const { theme } = useTheme();
  const w = size;
  const h = Math.round(size * 0.8);

  const strokeGrad = theme === 'dark' ? 'url(#neonGradLightToBlue)' : 'url(#headphoneGradDarkToBlue)';
  const padGradId = theme === 'dark' ? 'padGradDark' : 'padGradLight';
  const waveGrad = theme === 'dark' ? 'url(#neonGradLightToBlue)' : 'url(#neonGradLightToBlue)';

  const textClasses =
    theme === 'dark'
      ? 'bg-gradient-to-r from-purple-500 to-violet-500 text-transparent bg-clip-text [text-shadow:0_0_2px_rgba(96,165,250,0.5),0_0_4px_rgba(96,165,250,0.3)'
      : 'bg-gradient-to-r from-purple-800 via-blue-600 to-blue-500';

  return (
    <div className="flex items-center space-x-3 ripple-logo">
      <svg
        width={w}
        height={h}
        viewBox="0 0 64 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <defs>
          <linearGradient id="neonGradLightToBlue" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="60%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#60a5fa" />
          </linearGradient>

          <linearGradient id="headphoneGradDarkToBlue" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0b1220" />
            <stop offset="60%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#60a5fa" />
          </linearGradient>

          <linearGradient id="padGradDark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#071024" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>

          <linearGradient id="padGradLight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f1f5f9" />
            <stop offset="100%" stopColor="#e6eefc" />
          </linearGradient>

          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={theme === 'dark' ? 4 : 2} result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g fill="none" stroke={theme === 'dark' ? '#000000' : '#0b1220'} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.08">
          <path d="M8 30v-6a14 14 0 0 1 14-14h4" />
          <path d="M56 30v-6a14 14 0 0 0-14-14h-4" />
        </g>

        <g fill="none" stroke={strokeGrad} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)">
          <path d="M8 30v-6a14 14 0 0 1 14-14h4" className="logo-head-left" />
          <path d="M56 30v-6a14 14 0 0 0-14-14h-4" className="logo-head-right" />
          <rect x="6" y="26" width="8" height="12" rx="2" fill={`url(#${padGradId})`} className="logo-pad-left" />
          <rect x="50" y="26" width="8" height="12" rx="2" fill={`url(#${padGradId})`} className="logo-pad-right" />
        </g>

        <g transform="translate(16,24)" className="logo-waves" stroke={waveGrad} strokeWidth="1.6" strokeLinecap="round" opacity="0.95">
          <path className="wave w1" d="M0 6 C3 3, 6 3, 9 6" />
          <path className="wave w2" d="M12 6 C15 2, 18 2, 21 6" />
          <path className="wave w3" d="M24 6 C27 4, 30 4, 33 6" />
        </g>
      </svg>

      <div className="hidden sm:block">
        <div className={`text-2xl md:text-3xl font-extrabold bg-clip-text text-transparent ${textClasses}`}>Ripple</div>
      </div>
    </div>
  );
}
