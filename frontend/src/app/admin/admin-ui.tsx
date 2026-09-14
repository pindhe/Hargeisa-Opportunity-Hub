"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Opportunity, User } from "@/lib/types";
import { Button, Input } from "@/components/ui";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/opportunities", label: "Opportunities" },
  { href: "/admin/pending", label: "Pending approvals" },
  { href: "/admin/organizations", label: "Organizations" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/applications", label: "Applications" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/analytics", label: "Analytics" },
];

function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[220px_1fr]">
      <aside className="h-fit rounded-2xl bg-white p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Admin</p>
        <nav className="space-y-1 text-sm">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className={`block rounded-xl px-3 py-2 ${pathname === item.href ? "bg-blue-50 font-semibold text-primary" : "text-slate-600 hover:bg-slate-50"}`}>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div>{children}</div>
    </div>
  );
}

export function useAdminGuard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && user?.role !== "admin") router.push("/login");
  }, [loading, user, router]);
  return { user, token: typeof window !== "undefined" ? window.localStorage.getItem("hoh-token") : null };
}

export default function AdminHomePage() {
  const { user } = useAdminGuard();
  const [data, setData] = useState<{
    totals: Record<string, number>;
    byCategory: { category: string; count: number }[];
    opportunitiesByMonth: { month: string; count: number }[];
    usersByMonth: { month: string; count: number }[];
  } | null>(null);

  useEffect(() => {
    const token = window.localStorage.getItem("hoh-token");
    if (!token) return;
    api<typeof data>("/api/admin/analytics", { token }).then(setData);
  }, [user]);

  if (!user) return null;

  return (
    <AdminShell>
      <h1 className="text-3xl font-semibold text-navy">Admin dashboard</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {data
          ? Object.entries(data.totals).map(([k, v]) => (
              <div key={k} className="rounded-2xl bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">{k.replace(/[A-Z]/g, (m) => ` ${m}`)}</p>
                <p className="mt-2 text-2xl font-semibold text-navy">{v}</p>
              </div>
            ))
          : null}
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <ChartCard title="Opportunities by category" data={data?.byCategory ?? []} x="category" />
        <ChartCard title="Opportunities by month" data={data?.opportunitiesByMonth ?? []} x="month" />
        <ChartCard title="User growth" data={data?.usersByMonth ?? []} x="month" />
      </div>
    </AdminShell>
  );
}

function ChartCard({ title, data, x }: { title: string; data: Record<string, string | number>[]; x: string }) {
  return (
    <div className="rounded-2xl bg-white p-4">
      <h2 className="font-semibold text-navy">{title}</h2>
      <div className="mt-4 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey={x} tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#123e7a" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function AdminListPage({
  title,
  path,
  children,
}: {
  title: string;
  path: string;
  children?: React.ReactNode;
}) {
  const { user } = useAdminGuard();
  const [items, setItems] = useState<unknown[]>([]);
  useEffect(() => {
    const token = window.localStorage.getItem("hoh-token");
    if (!token) return;
    api<{ items: unknown[] }>(path, { token }).then((d) => setItems(d.items ?? []));
  }, [path, user]);
  return (
    <AdminShell>
      <h1 className="text-3xl font-semibold text-navy">{title}</h1>
      {children}
      <div className="mt-6 space-y-3">
        {items.map((item, idx) => (
          <pre key={idx} className="overflow-auto rounded-2xl bg-white p-4 text-xs">
            {JSON.stringify(item, null, 2)}
          </pre>
        ))}
      </div>
    </AdminShell>
  );
}

export function OpportunityAdmin({ status }: { status?: string }) {
  const { user } = useAdminGuard();
  const [items, setItems] = useState<Opportunity[]>([]);
  const token = typeof window !== "undefined" ? window.localStorage.getItem("hoh-token") : null;
  const qs = status ? `?status=${status}` : "";

  const load = () => {
    if (!token) return;
    api<{ items: Opportunity[] }>(`/api/admin/opportunities${qs}`, { token }).then((d) => setItems(d.items));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, status]);

  async function patch(id: number, body: Record<string, unknown>) {
    if (!token) return;
    await api(`/api/admin/opportunities/${id}`, { method: "PATCH", token, body: JSON.stringify(body) });
    load();
  }

  return (
    <AdminShell>
      <h1 className="text-3xl font-semibold text-navy">{status === "pending" ? "Pending approvals" : "Opportunities"}</h1>
      <div className="mt-6 space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-2xl bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-navy">{item.title}</p>
                <p className="text-sm text-slate-500">{item.status} · {item.organization.name} {item.isSample ? "· sample" : ""}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => patch(item.id, { status: "published", verified: true })}>Approve</Button>
                <Button variant="secondary" onClick={() => patch(item.id, { status: "rejected" })}>Reject</Button>
                <Button variant="secondary" onClick={() => patch(item.id, { featured: !item.featured })}>{item.featured ? "Unfeature" : "Feature"}</Button>
                <Button variant="secondary" onClick={() => patch(item.id, { status: "archived" })}>Archive</Button>
                <Button variant="danger" onClick={() => token && api(`/api/admin/opportunities/${item.id}`, { method: "DELETE", token }).then(load)}>Delete</Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}

export function UsersAdmin() {
  const { user } = useAdminGuard();
  const [items, setItems] = useState<User[]>([]);
  const [q, setQ] = useState("");
  const token = typeof window !== "undefined" ? window.localStorage.getItem("hoh-token") : null;
  useEffect(() => {
    if (!token) return;
    api<{ items: User[] }>(`/api/admin/users?q=${encodeURIComponent(q)}`, { token }).then((d) => setItems(d.items));
  }, [q, user, token]);
  return (
    <AdminShell>
      <h1 className="text-3xl font-semibold text-navy">Users</h1>
      <Input className="mt-4 max-w-sm" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search users" />
      <div className="mt-6 space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-2xl bg-white p-4">
            <p className="font-semibold">{item.name}</p>
            <p className="text-sm text-slate-500">{item.email} · {item.role}</p>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}

export function OrgsAdmin() {
  const { user } = useAdminGuard();
  const [items, setItems] = useState<{ id: number; name: string; status: string; verified: boolean }[]>([]);
  const token = typeof window !== "undefined" ? window.localStorage.getItem("hoh-token") : null;
  const load = () => {
    if (!token) return;
    api<{ items: typeof items }>("/api/admin/organizations", { token }).then((d) => setItems(d.items));
  };
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);
  return (
    <AdminShell>
      <h1 className="text-3xl font-semibold text-navy">Organizations</h1>
      <div className="mt-6 space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between rounded-2xl bg-white p-4">
            <div>
              <p className="font-semibold">{item.name}</p>
              <p className="text-sm text-slate-500">{item.status} {item.verified ? "✓" : ""}</p>
            </div>
            <Button variant="secondary" onClick={() => token && api(`/api/admin/organizations/${item.id}`, { method: "PATCH", token, body: JSON.stringify({ status: "approved", verified: true }) }).then(load)}>Approve</Button>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}

export function ReportsAdmin() {
  return <AdminListPage title="Reports" path="/api/admin/reports" />;
}

export function AnalyticsAdmin() {
  return <AdminHomePage />;
}
