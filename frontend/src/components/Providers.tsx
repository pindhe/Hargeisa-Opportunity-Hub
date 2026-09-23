"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { AuthProvider } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";

type ToastContextValue = { push: (message: string) => void };

const ToastContext = createContext<ToastContextValue>({ push: () => undefined });

export function useToast() {
  return useContext(ToastContext);
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000 } } }),
  );
  const [toasts, setToasts] = useState<{ id: number; message: string }[]>([]);

  const toastValue = useMemo<ToastContextValue>(
    () => ({
      push: (message) => {
        const id = Date.now();
        setToasts((current) => [...current, { id, message }]);
        window.setTimeout(() => setToasts((current) => current.filter((item) => item.id !== id)), 3200);
      },
    }),
    [],
  );

  return (
    <QueryClientProvider client={client}>
      <ThemeProvider>
      <AuthProvider>
        <ToastContext.Provider value={toastValue}>
          {children}
          <div className="fixed bottom-4 right-4 z-[70] flex w-[min(360px,calc(100%-2rem))] flex-col gap-2">
            {toasts.map((toast) => (
              <div key={toast.id} className="rounded-2xl bg-ink px-4 py-3 text-sm text-white shadow-lg">
                {toast.message}
              </div>
            ))}
          </div>
        </ToastContext.Provider>
      </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
