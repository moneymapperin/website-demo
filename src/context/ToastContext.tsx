import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  message: string;
  backgroundColor?: string;
  textColor?: string;
  action?: ToastAction;
  duration?: number;
}

interface ToastContextType {
  showToast: (options: ToastOptions | string) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<ToastOptions | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hideToast = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setToast(null);
  }, []);

  const showToast = useCallback((options: ToastOptions | string) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    const toastOptions: ToastOptions = typeof options === 'string' ? { message: options } : options;
    setToast(toastOptions);

    const duration = toastOptions.duration ?? 4000;
    if (duration > 0) {
      timerRef.current = setTimeout(() => {
        setToast(null);
        timerRef.current = null;
      }, duration);
    }
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          data-testid="toast-container"
          className="fixed bottom-6 right-6 z-50 max-w-md animate-fade-in flex items-center justify-between gap-4 px-5 py-3 rounded-2xl shadow-xl text-white font-medium text-sm"
          style={{
            backgroundColor: toast.backgroundColor || '#8B5CF6',
            color: toast.textColor || '#FFFFFF',
          }}
        >
          <span>{toast.message}</span>
          {toast.action && (
            <button
              type="button"
              data-testid="toast-action-button"
              onClick={() => {
                toast.action?.onClick();
                hideToast();
              }}
              className="ml-2 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 active:bg-white/40 text-white text-xs font-black tracking-wider uppercase transition-colors"
            >
              {toast.action.label}
            </button>
          )}
        </div>
      )}
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
