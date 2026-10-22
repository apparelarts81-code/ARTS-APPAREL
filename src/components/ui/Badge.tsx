import React from 'react';

interface BadgeProps {
  variant?: 'default' | 'sale' | 'new' | 'stock' | 'low_stock' | 'status';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  children,
  className = '',
}) => {
  const base =
    'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold tracking-wide uppercase rounded-[3px] select-none';

  const variants = {
    default: 'bg-neutral-800 text-neutral-300 border border-neutral-700',
    sale: 'bg-[#E31B23] text-white shadow-sm',
    new: 'bg-white text-black font-bold',
    stock: 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60',
    low_stock: 'bg-amber-950/80 text-amber-400 border border-amber-800/60',
    status: 'bg-neutral-900 text-neutral-200 border border-neutral-700',
  };

  return <span className={`${base} ${variants[variant]} ${className}`}>{children}</span>;
};
