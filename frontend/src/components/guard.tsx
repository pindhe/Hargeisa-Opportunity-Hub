"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/lib/auth";

export function RequireAuth({ children, admin = false }: { children: React.ReactNode; admin?: boolean }) {
  const { user, ready } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (admin && user.role !== "ADMIN") {
      router.replace("/");
      return;
    }
    if (!admin && user.role !== "ADMIN" && !user.onboarding_complete && pathname !== "/onboarding") {
      router.replace("/onboarding");
    }
  }, [admin, pathname, ready, router, user]);

  if (!ready || !user) {
    return <p className="mx-auto max-w-6xl px-4 py-16 text-sm text-muted-foreground">Loading your account…</p>;
  }
  if (admin && user.role !== "ADMIN") return null;
  return <>{children}</>;
}
