import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  disabled,
  children,
  ...props
}) => {
  const baseClasses =
    'relative inline-flex items-center justify-center font-medium transition-all duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 select-none rounded-[6px] focus:outline-none focus:ring-2 focus:ring-[#E31B23] focus:ring-offset-2 focus:ring-offset-black';

  const sizeClasses = {
    sm: 'text-xs px-3.5 py-2 min-h-[36px] gap-1.5',
    md: 'text-sm px-5 py-2.5 min-h-[44px] gap-2',
    lg: 'text-base px-7 py-3.5 min-h-[50px] gap-2.5',
  };

  const variantClasses = {
    primary:
      'bg-[#E31B23] hover:bg-[#A8121A] text-white active:scale-[0.98] shadow-md shadow-red-950/30',
    secondary:
      'bg-[#161616] hover:bg-[#222222] text-white border border-neutral-800 active:scale-[0.98]',
    outline:
      'bg-transparent hover:bg-white/5 text-white border border-neutral-600 hover:border-white active:scale-[0.98]',
    ghost:
      'bg-transparent hover:bg-white/10 text-neutral-300 hover:text-white',
    danger:
      'bg-red-900/80 hover:bg-red-800 text-white border border-red-700',
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4 text-current" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Loading...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};
