import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="flex flex-col gap-1.5 w-full text-left">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium uppercase tracking-wider text-neutral-300">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={`h-12 px-4 rounded-[6px] bg-[#161616] text-white border text-sm placeholder:text-neutral-500 transition-colors duration-150 focus:outline-none focus:border-[#E31B23] focus:ring-1 focus:ring-[#E31B23] disabled:opacity-50 ${
            error ? 'border-[#E31B23]' : 'border-neutral-800 hover:border-neutral-700'
          } ${className}`}
          {...props}
        />
        {error && <span className="text-xs text-[#E31B23]">{error}</span>}
        {helperText && !error && <span className="text-xs text-neutral-500">{helperText}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
