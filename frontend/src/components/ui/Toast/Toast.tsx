
export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
    message: string;
    variant?: ToastVariant;
    onClose: () => void;
}

export function Toast({ message, variant = 'info', onClose }: ToastProps) {
    const bgColors = {
        success: 'rgba(16, 185, 129, 0.9)', // Green
        error: 'rgba(239, 68, 68, 0.9)',   // Red
        info: 'rgba(59, 130, 246, 0.9)',    // Blue
        warning: 'rgba(245, 158, 11, 0.9)',  // Amber
    };

    const icons = {
        success: '✓',
        error: '✕',
        info: 'ℹ',
        warning: '⚠',
    };

    return (
        <div
            style={{
                backgroundColor: bgColors[variant],
                color: 'white',
                padding: '12px 16px',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                minWidth: '300px',
                maxWidth: '400px',
                animation: 'slideIn 0.3s ease-out',
                backdropFilter: 'blur(4px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
        >
            <span style={{ fontWeight: 'bold' }}>{icons[variant]}</span>
            <span style={{ flex: 1, fontSize: '14px' }}>{message}</span>
            <button
                onClick={onClose}
                style={{
                    background: 'none',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    opacity: 0.8,
                    fontSize: '18px',
                    padding: '0 4px',
                }}
            >
                ×
            </button>
            <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
        </div>
    );
}
