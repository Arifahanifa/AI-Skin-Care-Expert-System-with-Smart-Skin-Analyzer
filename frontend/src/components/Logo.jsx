import React from 'react';

export default function Logo({ size = 'md', showText = true }) {
  const sizeMap = {
    sm: { box: 28, text: '1rem', sub: '0.625rem' },
    md: { box: 36, text: '1.2rem', sub: '0.7rem' },
    lg: { box: 44, text: '1.45rem', sub: '0.78rem' }
  };
  const current = sizeMap[size] || sizeMap.md;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', userSelect: 'none' }}>
      <svg
        width={current.box}
        height={current.box}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        {/* Soft circle base */}
        <circle cx="20" cy="20" r="19" fill="#E8F5EE" stroke="#C8E3D4" strokeWidth="1.5" />

        {/* Botanical leaf and water droplet motif */}
        <path
          d="M20 7C20 7 11 18.5 11 25C11 30 15 33.5 20 33.5C25 33.5 29 30 29 25C29 18.5 20 7 20 7Z"
          fill="#2D6A4F"
        />
        {/* Inner gentle leaf vein / highlight */}
        <path
          d="M20 13V29M20 20L24 17M20 24L16 21"
          stroke="#FFFFFF"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Subtle peach glow dot */}
        <circle cx="24" cy="14" r="2.5" fill="#FDF2EB" stroke="#D9734E" strokeWidth="1.2" />
      </svg>

      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
          <span style={{ fontWeight: 800, fontSize: current.text, letterSpacing: '-0.02em', color: '#14241B' }}>
            Derma<span style={{ color: '#2D6A4F' }}>Twin</span>
          </span>
          <span style={{ fontSize: current.sub, fontWeight: 600, color: '#536258' }}>
            Skin Care Expert System
          </span>
        </div>
      )}
    </div>
  );
}
