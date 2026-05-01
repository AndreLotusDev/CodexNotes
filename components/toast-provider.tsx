"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

type ToastTone = "success" | "error";

type Toast = {
  id: number;
  message: string;
  tone: ToastTone;
};

type ToastContextValue = {
  showToast: (message: string, tone?: ToastTone) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function RouteToastListener({ onToast }: { onToast: ToastContextValue["showToast"] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastHandled = useRef<string | null>(null);

  useEffect(() => {
    const toast = searchParams.get("toast");
    if (!toast) {
      lastHandled.current = null;
      return;
    }

    if (toast === lastHandled.current) {
      return;
    }

    if (toast === "created") {
      onToast("Note created.");
    } else if (toast === "deleted") {
      onToast("Note deleted.");
    } else {
      return;
    }

    lastHandled.current = toast;
    const params = new URLSearchParams(searchParams.toString());
    params.delete("toast");
    const next = params.toString();
    window.history.replaceState(null, "", next ? `${pathname}?${next}` : pathname);
  }, [onToast, pathname, searchParams]);

  return null;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, tone: ToastTone = "success") => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((current) => [...current, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 2800);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      <RouteToastListener onToast={showToast} />
      {children}
      <div
        aria-atomic="true"
        aria-live="polite"
        className="pointer-events-none fixed right-4 top-4 z-50 flex w-full max-w-sm flex-col gap-3"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.tone === "error" ? "alert" : "status"}
            className={
              toast.tone === "error"
                ? "rounded-2xl border border-[rgba(184,77,101,0.25)] bg-white px-4 py-3 text-sm text-[var(--danger)] shadow-[var(--shadow)]"
                : "rounded-2xl border border-[rgba(47,158,149,0.22)] bg-white px-4 py-3 text-sm text-[var(--acc-3)] shadow-[var(--shadow)]"
            }
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used inside ToastProvider.");
  }

  return context;
}
