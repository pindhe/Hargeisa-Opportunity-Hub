"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Menu, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import { Button } from "./ui";

export function Navbar() {
  const { t, locale, setLocale } = useI18n();
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) return;
    const token = window.localStorage.getItem("hoh-token");
    if (!token) return;
    api<{ unread: number }>("/api/notifications", { token })
      .then((data) => setUnread(data.unread))
      .catch(() => undefined);
  }, [user, pathname]);

  const links = [
    { href: "/", label: t("home") },
    { href: "/opportunities", label: t("opportunities") },
    { href: "/scholarships", label: t("scholarships") },
    { href: "/internships", label: t("internships") },
    { href: "/jobs", label: t("jobs") },
    { href: "/courses", label: t("courses") },
    { href: "/competitions", label: t("competitions") },
    { href: "/about", label: t("about") },
  ];

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/opportunities?q=${encodeURIComponent(q)}`);
    setOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-navy/95 text-white backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <Link href="/" className="shrink-0 font-semibold tracking-tight">
          <span className="block text-sm text-blue-200">{t("short")}</span>
          <span className="hidden text-[15px] sm:block">{t("brand")}</span>
        </Link>
        <nav className="hidden items-center gap-4 text-sm text-blue-100 lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`hover:text-white ${pathname === link.href ? "font-semibold text-white" : ""}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <form onSubmit={submitSearch} className="ml-auto hidden min-w-[240px] flex-1 max-w-sm md:flex">
          <label className="sr-only" htmlFor="global-search">
            {t("search")}
          </label>
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-blue-200" />
            <input
              id="global-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="w-full rounded-xl border border-white/10 bg-white/10 py-2 pl-9 pr-3 text-sm text-white placeholder:text-blue-200 outline-none focus:bg-white/15"
            />
          </div>
        </form>
        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <div className="flex overflow-hidden rounded-lg border border-white/15 text-xs font-semibold">
            <button
              className={`px-2 py-1 ${locale === "so" ? "bg-white text-navy" : "text-blue-100"}`}
              onClick={() => setLocale("so")}
              type="button"
            >
              SO
            </button>
            <button
              className={`px-2 py-1 ${locale === "en" ? "bg-white text-navy" : "text-blue-100"}`}
              onClick={() => setLocale("en")}
              type="button"
            >
              EN
            </button>
          </div>
          {user ? (
            <>
              <Link href="/notifications" className="relative rounded-full p-2 hover:bg-white/10" aria-label={t("notifications")}>
                <Bell className="h-5 w-5" />
                {unread > 0 ? (
                  <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-amber-400" />
                ) : null}
              </Link>
              <Link href="/dashboard" className="hidden text-sm font-semibold sm:inline">
                {t("dashboard")}
              </Link>
              <button type="button" onClick={logout} className="hidden text-sm text-blue-100 sm:inline">
                {t("logout")}
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="hidden text-sm font-semibold sm:inline">
                {t("login")}
              </Link>
              <Link href="/register" className="hidden sm:inline">
                <Button className="bg-white text-navy hover:bg-blue-50">{t("createAccount")}</Button>
              </Link>
            </>
          )}
          <button className="rounded-lg p-2 lg:hidden" onClick={() => setOpen((v) => !v)} aria-label="Menu">
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {open ? (
        <div className="space-y-3 border-t border-white/10 px-4 py-4 lg:hidden">
          <form onSubmit={submitSearch} className="flex gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="w-full rounded-xl bg-white/10 px-3 py-2 text-sm"
            />
          </form>
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="block text-sm" onClick={() => setOpen(false)}>
              {link.label}
            </Link>
          ))}
          {user ? (
            <>
              <Link href="/dashboard" onClick={() => setOpen(false)}>
                {t("dashboard")}
              </Link>
              <button type="button" onClick={logout}>
                {t("logout")}
              </button>
            </>
          ) : (
            <>
              <Link href="/login" onClick={() => setOpen(false)}>
                {t("login")}
              </Link>
              <Link href="/register" onClick={() => setOpen(false)}>
                {t("createAccount")}
              </Link>
            </>
          )}
        </div>
      ) : null}
    </header>
  );
}
