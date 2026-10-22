import React, { createContext, useContext, useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast, removeToast }}>
      {children}
      {/* Toast container */}
      <div
        className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0"
        role="region"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center justify-between p-4 rounded bg-[#161616] text-white border text-sm shadow-xl transition-all duration-300 ${
              t.type === 'error'
                ? 'border-[#E31B23] text-red-100'
                : t.type === 'success'
                ? 'border-[#1F8A4C] text-emerald-100'
                : 'border-neutral-700'
            }`}
          >
            <div className="flex items-center gap-3">
              {t.type === 'error' && (
                <div className="w-2 h-2 rounded-full bg-[#E31B23]" />
              )}
              {t.type === 'success' && (
                <div className="w-2 h-2 rounded-full bg-[#1F8A4C]" />
              )}
              {t.type === 'info' && (
                <div className="w-2 h-2 rounded-full bg-white" />
              )}
              <span>{t.message}</span>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-neutral-400 hover:text-white ml-3 text-xs uppercase"
              aria-label="Dismiss toast"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};
