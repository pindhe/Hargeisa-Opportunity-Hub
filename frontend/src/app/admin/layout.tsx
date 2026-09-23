"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Bookmark,
  Briefcase,
  Building2,
  Layers,
  LayoutDashboard,
  LayoutGrid,
  Plus,
  Shield,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { RequireAuth } from "@/components/guard";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const groups: { title: string; items: { href: string; label: string; icon: LucideIcon }[] }[] = [
  {
    title: "Overview",
    items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Catalogue",
    items: [
      { href: "/admin/opportunities", label: "Opportunities", icon: Briefcase },
      { href: "/admin/opportunities/create", label: "Add listing", icon: Plus },
      { href: "/admin/organizations", label: "Organizations", icon: Building2 },
      { href: "/admin/categories", label: "Categories", icon: Layers },
    ],
  },
  {
    title: "People",
    items: [
      { href: "/admin/users", label: "Users", icon: UserRound },
      { href: "/admin/applications", label: "Applications", icon: Bookmark },
      { href: "/admin/reports", label: "Reports", icon: Shield },
      { href: "/admin/notifications", label: "Notifications", icon: Bell },
    ],
  },
  {
    title: "Site",
    items: [
      { href: "/admin/analytics", label: "Analytics", icon: LayoutGrid },
      { href: "/admin/settings", label: "Settings", icon: SlidersHorizontal },
    ],
  },
];

function isActive(href: string, pathname: string) {
  if (href === "/admin") return pathname === "/admin";
  if (href === "/admin/opportunities") return pathname === href || pathname.includes("/edit");
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <RequireAuth admin>
      <div className="min-h-screen bg-background text-foreground md:grid md:grid-cols-[260px_1fr]">
        <aside className="border-b border-border bg-card text-foreground md:sticky md:top-0 md:flex md:h-screen md:flex-col md:border-r md:border-b-0">
          <Link href="/" className="flex items-center justify-between px-5 py-5">
            <span>
              <Logo size="sm" />
              <p className="mt-2 text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">Admin</p>
            </span>
          </Link>
          <nav className="flex gap-4 overflow-x-auto px-3 pb-4 md:block md:flex-1 md:space-y-6 md:overflow-y-auto md:px-3">
            {groups.map((group) => (
              <div key={group.title} className="min-w-max md:min-w-0">
                <p className="hidden px-3 pb-2 text-[11px] font-semibold tracking-[0.16em] text-muted-foreground uppercase md:block">{group.title}</p>
                <div className="flex gap-1 md:block md:space-y-1">
                  {group.items.map((item) => {
                    const active = isActive(item.href, pathname);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "inline-flex items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground",
                          active && "bg-accent font-medium text-primary",
                        )}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">View site</Link>
            <ThemeToggle />
          </div>
        </aside>
        <div className="px-4 py-6 md:px-8">{children}</div>
      </div>
    </RequireAuth>
  );
}
