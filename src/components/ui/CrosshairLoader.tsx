import React from 'react';

interface CrosshairLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export const CrosshairLoader: React.FC<CrosshairLoaderProps> = ({ size = 'md', label }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-14 h-14',
    lg: 'w-20 h-20',
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 gap-3">
      <div className={`relative ${sizeClasses[size]} animate-spin [animation-duration:3s]`}>
        {/* Outer Crosshair Ring */}
        <div className="absolute inset-0 rounded-full border border-neutral-700 border-t-[#E31B23]" />
        {/* Inner dotted ring */}
        <div className="absolute inset-1.5 rounded-full border border-dashed border-neutral-600/50" />
        {/* Horizontal crosshair tick */}
        <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-neutral-600 -translate-y-1/2" />
        {/* Vertical crosshair tick */}
        <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-neutral-600 -translate-x-1/2" />
        {/* Center red point */}
        <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-[#E31B23] rounded-full -translate-x-1/2 -translate-y-1/2" />
      </div>
      {label && <p className="text-xs tracking-wider uppercase text-neutral-400 font-medium">{label}</p>}
    </div>
  );
};
