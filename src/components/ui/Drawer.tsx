import React, { useEffect } from 'react';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  position?: 'right' | 'left' | 'bottom';
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  position = 'right',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const positionClasses = {
    right: 'inset-y-0 right-0 max-w-md w-full',
    left: 'inset-y-0 left-0 max-w-md w-full',
    bottom: 'inset-x-0 bottom-0 max-h-[85vh] w-full rounded-t-[16px]',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className={`fixed ${positionClasses[position]} bg-[#161616] border-l border-neutral-800 shadow-2xl flex flex-col z-10 text-white transition-transform duration-300 ease-out`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 shrink-0">
          {title && <h3 className="font-serif text-lg font-bold tracking-tight">{title}</h3>}
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-2 text-sm rounded focus:outline-none focus:ring-1 focus:ring-[#E31B23]"
            aria-label="Close drawer"
          >
            ✕
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
};
