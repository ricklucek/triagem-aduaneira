"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type ToastType = "success" | "error" | "info";

type ToastItem = {
  id: number;
  message: string;
  type: ToastType;
};

type Listener = (toast: Omit<ToastItem, "id">) => void;

const listeners = new Set<Listener>();

function emitToast(toast: Omit<ToastItem, "id">) {
  listeners.forEach((listener) => listener(toast));
}

export const toast = {
  success: (message: string) => emitToast({ message, type: "success" }),
  error: (message: string) => emitToast({ message, type: "error" }),
  info: (message: string) => emitToast({ message, type: "info" }),
};

const ToastContext = createContext(toast);

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    const listener: Listener = (next) => {
      const id = Date.now() + Math.floor(Math.random() * 1000);
      setItems((prev) => [...prev, { id, ...next }]);
      window.setTimeout(() => {
        setItems((prev) => prev.filter((item) => item.id !== id));
      }, 3500);
    };

    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const removeItem = useCallback((id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const value = useMemo(() => toast, []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[200] flex max-w-sm flex-col gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            className={`pointer-events-auto rounded-lg border px-4 py-3 text-sm shadow-lg ${
              item.type === "success"
                ? "border-emerald-700 bg-emerald-950 text-emerald-50"
                : item.type === "error"
                  ? "border-red-700 bg-red-950 text-red-50"
                  : "border-blue-700 bg-blue-950 text-blue-50"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <p>{item.message}</p>
              <button
                className="pointer-events-auto text-xs opacity-80 hover:opacity-100"
                onClick={() => removeItem(item.id)}
              >
                Fechar
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
