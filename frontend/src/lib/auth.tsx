"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { api } from "@/lib/api";
import { setToken } from "@/lib/token";
import type { User } from "@/lib/types";

type AuthContextValue = {
  user: User | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: { full_name: string; email: string; password: string; role: string }) => Promise<User>;
  logout: () => void;
  setUser: (user: User) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let active = true;
    api
      .get<User>("/api/auth/me")
      .then((response) => {
        if (active) setUserState(response.data);
      })
      .catch(() => {
        if (active) setUserState(null);
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      ready,
      setUser: setUserState,
      login: async (email, password) => {
        const response = await api.post<{ access_token: string; user: User }>("/api/auth/login", { email, password });
        setToken(response.data.access_token);
        setUserState(response.data.user);
        return response.data.user;
      },
      register: async (payload) => {
        const response = await api.post<{ access_token: string; user: User }>("/api/auth/register", payload);
        setToken(response.data.access_token);
        setUserState(response.data.user);
        return response.data.user;
      },
      logout: () => {
        setToken(null);
        setUserState(null);
        router.push("/");
      },
    }),
    [ready, router, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within AuthProvider");
  return value;
}
