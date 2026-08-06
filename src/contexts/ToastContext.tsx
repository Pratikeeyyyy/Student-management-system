import React, { createContext, useCallback, useContext } from 'react';
import { toast as sonnerToast } from 'sonner';

type ToastKind = 'success' | 'error' | 'info';

interface ToastContextValue {
  toast: (message: string, kind?: ToastKind) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export const useToast = () => useContext(ToastContext);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const toast = useCallback((message: string, kind: ToastKind = 'info') => {
    if (kind === 'success') sonnerToast.success(message);
    else if (kind === 'error') sonnerToast.error(message);
    else sonnerToast.info(message);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
    </ToastContext.Provider>
  );
};
