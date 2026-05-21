import { useEffect } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import type { ToastItem } from "../../contexts/ToastContextBase";
import "./ToastContainer.css";

interface ToastContainerProps {
    toasts: ToastItem[];
    onDismiss: (id: number) => void;
}

const ICONS = {
    success: CheckCircle2,
    error: AlertCircle,
    info: Info,
} as const;

export default function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
    useEffect(() => {
        if (toasts.length === 0) return;

        const timers = toasts.map((toast) =>
            window.setTimeout(() => onDismiss(toast.id), 4500),
        );

        return () => timers.forEach((timer) => window.clearTimeout(timer));
    }, [toasts, onDismiss]);

    if (toasts.length === 0) return null;

    return (
        <div className="toast-viewport" aria-live="polite" aria-relevant="additions">
            {toasts.map((toast) => {
                const Icon = ICONS[toast.type];
                return (
                    <div key={toast.id} className={`toast toast--${toast.type}`} role="status">
                        <Icon size={20} className="toast__icon" aria-hidden />
                        <p className="toast__message">{toast.message}</p>
                        <button
                            type="button"
                            className="toast__close"
                            aria-label="Закрыть"
                            onClick={() => onDismiss(toast.id)}
                        >
                            <X size={16} aria-hidden />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
