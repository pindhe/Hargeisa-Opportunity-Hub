"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { RequireAuth } from "@/components/guard";
import { cn } from "@/lib/utils";

const links = [
  ["/admin", "Dashboard"],
  ["/admin/opportunities", "Opportunities"],
  ["/admin/opportunities/create", "Add Opportunity"],
  ["/admin/organizations", "Organizations"],
  ["/admin/categories", "Categories"],
  ["/admin/users", "Users"],
  ["/admin/applications", "Applications"],
  ["/admin/reports", "Reports"],
  ["/admin/notifications", "Notifications"],
  ["/admin/analytics", "Analytics"],
  ["/admin/settings", "Settings"],
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <RequireAuth admin>
      <div className="min-h-screen bg-[#f3f6f4] md:grid md:grid-cols-[240px_1fr]">
        <aside className="border-r border-border bg-ink text-white md:min-h-screen">
          <Link href="/" className="block px-5 py-5 font-display text-2xl">HOH Admin</Link>
          <nav className="flex gap-1 overflow-auto px-3 pb-4 md:block md:space-y-1">
            {links.map(([href, label]) => {
              const active = href === "/admin" ? pathname === href : pathname === href || (href !== "/admin/opportunities" && pathname.startsWith(href));
              const exactOpp = href === "/admin/opportunities" && (pathname === href || pathname.includes("/edit"));
              const isActive = href === "/admin/opportunities" ? exactOpp : active;
              return (
                <Link key={href} href={href} className={cn("block whitespace-nowrap rounded-xl px-3 py-2 text-sm text-white/75 hover:bg-white/10", isActive && "bg-white/10 text-white")}>
                  {label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <div className="px-4 py-6 md:px-8">{children}</div>
      </div>
    </RequireAuth>
  );
}
