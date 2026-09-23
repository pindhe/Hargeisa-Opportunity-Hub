"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Logo } from "@/components/logo";
import { SearchOverlay } from "@/components/search-overlay";
import { ThemeToggle } from "@/components/theme-toggle";
import { Bell, BookOpen, Briefcase, Compass, GraduationCap, Info, Laptop, Layers, LayoutDashboard, LogIn, LogOut, MapPin, Menu, Search, Shield, Sparkles, UserPlus, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Notification } from "@/lib/types";
import { cn } from "@/lib/utils";

const links = [
  { href: "/opportunities", label: "Explore", icon: Compass },
  { href: "/programs", label: "Programs", icon: Layers },
  { href: "/about", label: "About", icon: Info },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const closeSearch = useCallback(() => setSearchOpen(false), []);

  useEffect(() => {
    function openSearch(event: Event) {
      const detail = (event as CustomEvent<string>).detail ?? "";
      setSearchQuery(detail);
      setSearchOpen(true);
    }
    window.addEventListener("hoh-open-search", openSearch);
    return () => window.removeEventListener("hoh-open-search", openSearch);
  }, []);

  if (pathname.startsWith("/admin")) return <>{children}</>;
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar onSearch={() => { setSearchQuery(""); setSearchOpen(true); }} />
      <main className="flex-1">{children}</main>
      <Footer onSearch={() => { setSearchQuery(""); setSearchOpen(true); }} />
      {!pathname.startsWith("/ai-assistant") && (
        <Link
          href="/ai-assistant"
          aria-label="AI Assistant"
          className="fixed right-5 bottom-5 z-50 grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_12px_30px_-12px_rgba(12,107,88,0.8)]"
        >
          <Sparkles className="h-5 w-5" />
        </Link>
      )}
      <SearchOverlay open={searchOpen} initialQuery={searchQuery} onClose={closeSearch} />
    </div>
  );
}

function Navbar({ onSearch }: { onSearch: () => void }) {
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
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4">
        <Link href="/" className="flex items-center" aria-label="HOH home">
          <Logo size="sm" />
        </Link>
        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground",
                pathname.startsWith(link.href) && "bg-accent text-primary",
              )}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <button type="button" onClick={onSearch} className="grid h-10 w-10 place-items-center rounded-full hover:bg-muted" aria-label="Search">
            <Search className="h-4 w-4" />
          </button>
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
                <Link href={user.role === "ADMIN" ? "/admin" : "/dashboard"}>
                  {user.role === "ADMIN" ? <Shield className="h-4 w-4" /> : <LayoutDashboard className="h-4 w-4" />}
                  {user.role === "ADMIN" ? "Admin" : "Dashboard"}
                </Link>
              </Button>
              <button type="button" className="hidden items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground sm:inline-flex" onClick={logout}>
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </>
          ) : (
            <div className="flex items-center gap-1">
              <Link href="/login" aria-label="Log in" className="grid h-10 w-10 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground">
                <LogIn className="h-4 w-4" />
              </Link>
              <Link href="/register" aria-label="Create profile" className="grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground hover:brightness-95">
                <UserPlus className="h-4 w-4" />
              </Link>
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
            <Link key={link.href} href={link.href} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-muted" onClick={() => setOpen(false)}>
              <link.icon className="h-4 w-4 text-primary" />
              {link.label}
            </Link>
          ))}
          {user && (
            <Link href={user.role === "ADMIN" ? "/admin" : "/dashboard"} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-muted" onClick={() => setOpen(false)}>
              {user.role === "ADMIN" ? <Shield className="h-4 w-4 text-primary" /> : <LayoutDashboard className="h-4 w-4 text-primary" />}
              {user.role === "ADMIN" ? "Admin" : "Dashboard"}
            </Link>
          )}
        </div>
      )}
    </header>
  );
}

function Footer({ onSearch }: { onSearch: () => void }) {
  return (
    <footer className="mt-16 border-t border-border bg-card">
      <div className="h-1 bg-gradient-to-r from-primary via-emerald-300 to-primary" />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo size="sm" />
          <p className="mt-4 max-w-xs text-sm leading-6 text-muted-foreground">
            Scholarships, jobs, internships, courses, and competitions for students and graduates in Hargeisa.
          </p>
          <p className="mt-4 inline-flex items-center gap-2 text-sm font-medium">
            <MapPin className="h-4 w-4 text-primary" />
            Hargeisa, Somaliland
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold">Discover</p>
          <div className="mt-4 flex flex-col gap-2">
            <Link href="/opportunities" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
              <Compass className="h-4 w-4" />
              Explore
            </Link>
            <Link href="/programs" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
              <Layers className="h-4 w-4" />
              Programs
            </Link>
            <Link href="/about" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
              <Info className="h-4 w-4" />
              About
            </Link>
            <button type="button" onClick={onSearch} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
              <Search className="h-4 w-4" />
              Search
            </button>
          </div>
        </div>
        <FooterColumn
          title="Find"
          items={[
            { href: "/opportunities?type=SCHOLARSHIP", label: "Scholarships", icon: GraduationCap },
            { href: "/opportunities?type=JOB", label: "Jobs", icon: Briefcase },
            { href: "/opportunities?type=INTERNSHIP", label: "Internships", icon: Laptop },
            { href: "/opportunities?type=COURSE", label: "Courses", icon: BookOpen },
          ]}
        />
        <FooterColumn
          title="Account"
          items={[
            { href: "/register", label: "Create profile", icon: UserPlus },
            { href: "/login", label: "Log in", icon: LogIn },
            { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
          ]}
        />
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Hargeisa Opportunity Hub</p>
          <p>One place for what opens next.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  items,
}: {
  title: string;
  items: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }[];
}) {
  return (
    <div>
      <p className="text-sm font-semibold">{title}</p>
      <div className="mt-4 flex flex-col gap-2">
        {items.map((item) => (
          <Link key={item.href} href={item.href} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export function useGo() {
  const router = useRouter();
  return router;
}
