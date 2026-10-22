import React from 'react';

interface TieLineProps {
  height?: number | string;
  className?: string;
}

export const TieLine: React.FC<TieLineProps> = ({ height = 48, className = '' }) => {
  return (
    <div
      className={`relative w-[2px] bg-[#E31B23] mx-auto ${className}`}
      style={{ height }}
      aria-hidden="true"
    >
      {/* Tapered bottom triangular tip */}
      <div className="absolute -bottom-1 -left-[2px] w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[6px] border-t-[#E31B23]" />
    </div>
  );
};
