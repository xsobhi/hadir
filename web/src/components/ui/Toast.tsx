import { CircleAlert, CircleCheck, Info, X } from "lucide-react";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type Tone = "success" | "error" | "info";
type Toast = { id: number; text: string; tone: Tone };
const ToastContext = createContext<(text: string, tone?: Tone) => void>(() => {});
const ICONS = { success: CircleCheck, error: CircleAlert, info: Info };

/** Small confirmations at the bottom of the screen ("Sara was added to Data Structures"); they leave on their own. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const dismiss = useCallback((id: number) => setToasts((all) => all.filter((t) => t.id !== id)), []);
  const show = useCallback((text: string, tone: Tone = "success") => {
    const id = Date.now() + Math.random();
    setToasts((all) => [...all.slice(-2), { id, text, tone }]);
    window.setTimeout(() => dismiss(id), tone === "error" ? 7000 : 4500);
  }, [dismiss]);
  const value = useMemo(() => show, [show]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => {
          const Icon = ICONS[t.tone];
          return (
            <div key={t.id} className={`toast toast-${t.tone}`}>
              <Icon aria-hidden="true" />
              <span>{t.text}</span>
              <button type="button" onClick={() => dismiss(t.id)} aria-label="×"><X aria-hidden="true" /></button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
