import { createContext } from 'preact';
import { useContext, useState, useCallback } from 'preact/hooks';
import { Toast, type ToastVariant } from './Toast';

export interface ToastMessage {
    id: string;
    message: string;
    variant: ToastVariant;
    duration?: number;
}

interface ToastContextType {
    addToast: (message: string, variant?: ToastVariant, duration?: number) => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: preact.ComponentChildren }) {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const addToast = useCallback((message: string, variant: ToastVariant = 'info', duration = 3000) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, variant, duration }]);

        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    }, [removeToast]);

    return (
        <ToastContext.Provider value={{ addToast, removeToast }}>
            {children}
            <div
                style={{
                    position: 'fixed',
                    bottom: '24px',
                    right: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    zIndex: 9999,
                    pointerEvents: 'none', // Allow clicking through the container
                }}
            >
                {toasts.map((toast) => (
                    <div key={toast.id} style={{ pointerEvents: 'auto' }}>
                        <Toast
                            message={toast.message}
                            variant={toast.variant}
                            onClose={() => removeToast(toast.id)}
                        />
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToastContext() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToastContext must be used within a ToastProvider');
    }
    return context;
}
