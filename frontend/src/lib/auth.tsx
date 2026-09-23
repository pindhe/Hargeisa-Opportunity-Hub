"use client";

import { createContext, useContext, useLayoutEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { api } from "@/lib/api";
import { getToken, setToken } from "@/lib/token";
import type { User } from "@/lib/types";

const USER_KEY = "hoh_user";

function readCachedUser() {
  if (typeof window === "undefined" || !getToken()) return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

function writeCachedUser(user: User | null) {
  if (typeof window === "undefined") return;
  if (user) window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  else window.localStorage.removeItem(USER_KEY);
}

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

  function commitUser(next: User | null) {
    writeCachedUser(next);
    setUserState(next);
  }

  useLayoutEffect(() => {
    if (!getToken()) {
      setReady(true);
      return;
    }
    const cached = readCachedUser();
    if (cached) {
      setUserState(cached);
      setReady(true);
    }
    let active = true;
    api
      .get<User>("/api/auth/me")
      .then((response) => {
        if (active) commitUser(response.data);
      })
      .catch(() => {
        if (active && !cached) commitUser(null);
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
      setUser: commitUser,
      login: async (email, password) => {
        const response = await api.post<{ access_token: string; user: User }>("/api/auth/login", { email, password });
        setToken(response.data.access_token);
        commitUser(response.data.user);
        return response.data.user;
      },
      register: async (payload) => {
        const response = await api.post<{ access_token: string; user: User }>("/api/auth/register", payload);
        setToken(response.data.access_token);
        commitUser(response.data.user);
        return response.data.user;
      },
      logout: () => {
        setToken(null);
        commitUser(null);
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
