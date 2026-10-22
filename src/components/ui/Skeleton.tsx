import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div
      className={`animate-pulse bg-neutral-800/80 rounded-[4px] ${className}`}
      aria-hidden="true"
    />
  );
};
