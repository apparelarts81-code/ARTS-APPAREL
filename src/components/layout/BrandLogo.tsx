import React from 'react';
import { Link } from 'react-router-dom';

interface BrandLogoProps {
  className?: string;
  showTagline?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ className = '', showTagline = false }) => {
  return (
    <Link to="/" className={`inline-flex items-center gap-3 group select-none ${className}`} aria-label="ARTS APPAREL Home">
      {/* Visual Mark: White shirt collar with red tie and crosshair ring */}
      <div className="relative w-9 h-9 sm:w-10 sm:h-10 bg-black border border-neutral-700/80 rounded flex items-center justify-center shrink-0 group-hover:border-[#E31B23] transition-colors">
        {/* White shirt collar graphic */}
        <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none">
          {/* Collar left */}
          <path d="M12 9 L20 22 L17 9 Z" fill="#FFFFFF" />
          {/* Collar right */}
          <path d="M28 9 L20 22 L23 9 Z" fill="#FFFFFF" />
          {/* Red Tie knot and body */}
          <path d="M18.5 17 L21.5 17 L22.5 21 L17.5 21 Z" fill="#E31B23" />
          <path d="M18 21 L22 21 L22.8 33 L20 37 L17.2 33 Z" fill="#E31B23" />
          {/* Subtle crosshair lines */}
          <circle cx="20" cy="20" r="18" stroke="#333333" strokeWidth="1" strokeDasharray="2 2" />
          <line x1="20" y1="1" x2="20" y2="5" stroke="#E31B23" strokeWidth="1.5" />
          <line x1="20" y1="35" x2="20" y2="39" stroke="#E31B23" strokeWidth="1.5" />
          <line x1="1" y1="20" x2="5" y2="20" stroke="#E31B23" strokeWidth="1.5" />
          <line x1="35" y1="20" x2="39" y2="20" stroke="#E31B23" strokeWidth="1.5" />
        </svg>
      </div>

      {/* Typography */}
      <div className="flex flex-col leading-none">
        <div className="flex items-baseline gap-1.5 font-serif font-black tracking-wider text-xl sm:text-2xl">
          <span className="text-[#E31B23]">A<span className="text-[#E31B23]">RTS</span></span>
          <span className="text-white tracking-[0.2em] text-sm sm:text-base font-sans font-light">APPAREL</span>
        </div>
        {showTagline && (
          <span className="text-[9px] uppercase tracking-[0.25em] text-neutral-400 mt-1 font-sans">
            Sadiqabad • Pakistan
          </span>
        )}
      </div>
    </Link>
  );
};
