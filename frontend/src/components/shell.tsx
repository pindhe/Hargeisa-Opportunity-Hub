"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ThemeToggle } from "@/components/theme-toggle";
import { Bell, Menu, Search, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Notification } from "@/lib/types";
import { cn } from "@/lib/utils";

const links = [
  { href: "/opportunities", label: "Explore" },
  { href: "/categories", label: "Categories" },
  { href: "/organizations", label: "Organizations" },
  { href: "/ai-assistant", label: "AI Assistant" },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return <>{children}</>;
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

function Navbar() {
  const pathname = usePathname();
  const { user, ready, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [bell, setBell] = useState(false);
  const queryClient = useQueryClient();
  const unread = useQuery({
    queryKey: ["unread"],
    queryFn: async () => (await api.get<{ count: number }>("/api/notifications/unread-count")).data.count,
    enabled: Boolean(user),
  });
  const notes = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => (await api.get<Notification[]>("/api/notifications")).data,
    enabled: Boolean(user) && bell,
  });

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/90 text-foreground backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-display text-lg tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">H</span>
          HOH
        </Link>
        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground",
                pathname.startsWith(link.href) && "bg-muted text-foreground",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/search" className="grid h-10 w-10 place-items-center rounded-full hover:bg-muted" aria-label="Search">
            <Search className="h-4 w-4" />
          </Link>
          <ThemeToggle />
          {user && (
            <div className="relative">
              <button
                type="button"
                className="relative grid h-10 w-10 place-items-center rounded-full hover:bg-muted"
                aria-label="Notifications"
                onClick={() => setBell((value) => !value)}
              >
                <Bell className="h-4 w-4" />
                {(unread.data ?? 0) > 0 && (
                  <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-amber-400 px-1 text-[10px] font-bold text-ink">
                    {unread.data}
                  </span>
                )}
              </button>
              {bell && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-border bg-card p-2 text-foreground shadow-2xl">
                  <div className="flex items-center justify-between px-2 py-1">
                    <p className="text-sm font-semibold">Notifications</p>
                    <Link href="/notifications" className="text-xs text-primary" onClick={() => setBell(false)}>
                      View all
                    </Link>
                  </div>
                  <div className="max-h-80 overflow-auto">
                    {(notes.data ?? []).slice(0, 5).map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={cn("block w-full rounded-xl px-2 py-2 text-left hover:bg-muted", !item.is_read && "bg-accent/60")}
                        onClick={async () => {
                          await api.post(`/api/notifications/${item.id}/read`);
                          void queryClient.invalidateQueries({ queryKey: ["unread"] });
                          setBell(false);
                          if (item.link) window.location.href = item.link;
                        }}
                      >
                        <p className="text-sm font-medium">{item.title}</p>
                        <p className="line-clamp-2 text-xs text-muted-foreground">{item.message}</p>
                      </button>
                    ))}
                    {notes.data?.length === 0 && <p className="px-2 py-4 text-sm text-muted-foreground">You are all caught up.</p>}
                  </div>
                </div>
              )}
            </div>
          )}
          {ready && user ? (
            <>
              <Button asChild size="sm" variant="secondary" className="hidden sm:inline-flex">
                <Link href={user.role === "ADMIN" ? "/admin" : "/dashboard"}>{user.role === "ADMIN" ? "Admin" : "Dashboard"}</Link>
              </Button>
              <button type="button" className="hidden text-sm text-muted-foreground hover:text-foreground sm:inline" onClick={logout}>
                Log out
              </button>
            </>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
                Log in
              </Link>
              <Button asChild size="sm">
                <Link href="/register">Create profile</Link>
              </Button>
            </div>
          )}
          <button type="button" className="grid h-10 w-10 place-items-center rounded-full hover:bg-muted md:hidden" onClick={() => setOpen((value) => !value)} aria-label="Menu">
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="space-y-1 border-t border-border px-4 py-3 md:hidden">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="block rounded-xl px-3 py-2 text-sm hover:bg-muted" onClick={() => setOpen(false)}>
              {link.label}
            </Link>
          ))}
          {user ? (
            <Link href={user.role === "ADMIN" ? "/admin" : "/dashboard"} className="block rounded-xl px-3 py-2 text-sm hover:bg-muted" onClick={() => setOpen(false)}>
              {user.role === "ADMIN" ? "Admin" : "Dashboard"}
            </Link>
          ) : (
            <Link href="/login" className="block rounded-xl px-3 py-2 text-sm hover:bg-muted" onClick={() => setOpen(false)}>
              Log in
            </Link>
          )}
        </div>
      )}
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-card">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="font-display text-xl">HOH</p>
          <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
            Hargeisa Opportunity Hub brings scholarships, jobs, internships, courses, and competitions into one searchable place.
          </p>
        </div>
        <div className="text-sm">
          <p className="font-semibold">Discover</p>
          <div className="mt-2 flex flex-col gap-1 text-muted-foreground">
            <Link href="/opportunities">Opportunities</Link>
            <Link href="/categories">Categories</Link>
            <Link href="/organizations">Organizations</Link>
          </div>
        </div>
        <div className="text-sm">
          <p className="font-semibold">Account</p>
          <div className="mt-2 flex flex-col gap-1 text-muted-foreground">
            <Link href="/register">Create profile</Link>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/ai-assistant">AI Assistant</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function useGo() {
  const router = useRouter();
  return router;
}
