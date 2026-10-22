import React from 'react';

interface QuantityStepperProps {
  value: number;
  max: number;
  onChange: (value: number) => void;
  min?: number;
  disabled?: boolean;
}

export const QuantityStepper: React.FC<QuantityStepperProps> = ({
  value,
  max,
  onChange,
  min = 1,
  disabled = false,
}) => {
  return (
    <div className="inline-flex items-center border border-neutral-700 bg-[#161616] rounded-[4px] overflow-hidden select-none">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={disabled || value <= min}
        className="w-8 h-8 flex items-center justify-center text-neutral-300 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        aria-label="Decrease quantity"
      >
        −
      </button>
      <span className="w-10 text-center text-sm font-semibold text-white">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={disabled || value >= max}
        className="w-8 h-8 flex items-center justify-center text-neutral-300 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
};
