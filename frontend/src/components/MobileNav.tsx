"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, Briefcase, Home, Compass, UserRound } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";

export function MobileNav() {
  const { user } = useAuth();
  const { t } = useI18n();
  const pathname = usePathname();
  if (!user) return null;

  const items = [
    { href: "/", icon: Home, label: t("home") },
    { href: "/opportunities", icon: Compass, label: "Explore" },
    { href: "/saved", icon: Bookmark, label: t("saved") },
    { href: "/applications", icon: Briefcase, label: t("applications") },
    { href: "/profile", icon: UserRound, label: t("profile") },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <ul className="grid grid-cols-5">
        {items.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex flex-col items-center gap-1 py-2 text-[11px] ${active ? "text-primary" : "text-slate-500"}`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
