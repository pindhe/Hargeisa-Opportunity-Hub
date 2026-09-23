"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { PageResult } from "@/lib/types";
import { statusLabel } from "@/lib/utils";

type Analytics = {
  totals: Record<string, number>;
  by_category: { name: string; count: number }[];
  by_month: { month: string; count: number }[];
  registrations: { month: string; count: number }[];
  application_activity: { status: string; count: number }[];
  popular_categories: { name: string; count: number }[];
};

type Report = {
  id: string;
  reason: string;
  description: string;
  status: string;
  user_name: string;
  opportunity_title: string;
};

export function Bars({ items }: { items: { label: string; value: number }[] }) {
  const max = Math.max(1, ...items.map((item) => item.value));
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label}>
          <div className="mb-1 flex justify-between text-sm">
            <span>{item.label}</span>
            <span>{item.value}</span>
          </div>
          <div className="h-2 rounded-full bg-muted">
            <div className="h-2 rounded-full bg-primary" style={{ width: `${(item.value / max) * 100}%` }} />
          </div>
        </div>
      ))}
      {items.length === 0 && <p className="text-sm text-muted-foreground">No data yet.</p>}
    </div>
  );
}

export function useAnalytics() {
  return useQuery({ queryKey: ["analytics"], queryFn: async () => (await api.get<Analytics>("/api/admin/analytics")).data });
}

const stats = [
  ["users", "People", "/admin/users"],
  ["opportunities", "Listings", "/admin/opportunities"],
  ["active", "Approved", "/admin/opportunities"],
  ["expired", "Expired", "/admin/opportunities"],
  ["applications", "Applications", "/admin/applications"],
  ["organizations", "Organizations", "/admin/organizations"],
] as const;

export default function AdminHome() {
  const queryClient = useQueryClient();
  const analytics = useAnalytics();
  const totals = analytics.data?.totals;
  const pending = useQuery({
    queryKey: ["admin-pending"],
    queryFn: async () => (await api.get<PageResult>("/api/admin/opportunities", { params: { status: "PENDING", page_size: 5 } })).data,
  });
  const reports = useQuery({
    queryKey: ["reports"],
    queryFn: async () => (await api.get<Report[]>("/api/admin/reports")).data,
  });
  const act = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: "approve" | "reject" }) => api.post(`/api/admin/opportunities/${id}/${action}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-pending"] });
      void queryClient.invalidateQueries({ queryKey: ["analytics"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-opps"] });
    },
  });
  const openReports = (reports.data ?? []).filter((item) => item.status === "OPEN");

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium tracking-[0.16em] text-primary uppercase">Admin</p>
          <h1 className="mt-1 font-display text-4xl tracking-tight">Dashboard</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Review what is waiting, then check the catalogue, people, and reports.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/admin/opportunities/create">Add listing</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/analytics">Analytics</Link>
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map(([key, label, href]) => (
          <Link key={key} href={href} className="rounded-[1.4rem] border border-border bg-card p-5 transition hover:border-primary/40">
            <p className="font-display text-3xl">{totals?.[key] ?? "—"}</p>
            <p className="mt-1 text-sm text-muted-foreground">{label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-[1.4rem] border border-border bg-card p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-2xl">Waiting for review</h2>
            <Link href="/admin/opportunities" className="text-sm font-semibold text-primary">All listings</Link>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{pending.data?.total ?? 0} pending</p>
          <div className="mt-4 space-y-3">
            {(pending.data?.items ?? []).map((item) => (
              <article key={item.id} className="rounded-2xl bg-muted px-4 py-3">
                <p className="font-medium">{item.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.organization.name}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => act.mutate({ id: item.id, action: "approve" })} disabled={act.isPending}>Approve</Button>
                  <Button size="sm" variant="outline" onClick={() => act.mutate({ id: item.id, action: "reject" })} disabled={act.isPending}>Reject</Button>
                  <Button size="sm" variant="ghost" asChild>
                    <Link href={`/admin/opportunities/${item.id}/edit`}>Edit</Link>
                  </Button>
                </div>
              </article>
            ))}
            {!pending.isLoading && (pending.data?.items.length ?? 0) === 0 && (
              <p className="text-sm text-muted-foreground">No listings are waiting.</p>
            )}
          </div>
        </section>

        <section className="rounded-[1.4rem] border border-border bg-card p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-2xl">Open reports</h2>
            <Link href="/admin/reports" className="text-sm font-semibold text-primary">Report queue</Link>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{openReports.length} open</p>
          <div className="mt-4 space-y-3">
            {openReports.slice(0, 5).map((report) => (
              <article key={report.id} className="rounded-2xl bg-muted px-4 py-3">
                <p className="font-medium">{report.opportunity_title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{report.user_name} · {report.reason}</p>
                {report.description && <p className="mt-2 text-sm leading-6">{report.description}</p>}
              </article>
            ))}
            {!reports.isLoading && openReports.length === 0 && <p className="text-sm text-muted-foreground">No open reports.</p>}
          </div>
        </section>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="rounded-[1.4rem] border border-border bg-card p-5">
          <h2 className="mb-4 font-display text-2xl">Listings by category</h2>
          <Bars items={(analytics.data?.by_category ?? []).map((item) => ({ label: item.name, value: item.count }))} />
        </section>
        <section className="rounded-[1.4rem] border border-border bg-card p-5">
          <h2 className="mb-4 font-display text-2xl">Most viewed categories</h2>
          <Bars items={(analytics.data?.popular_categories ?? []).map((item) => ({ label: item.name, value: item.count }))} />
        </section>
        <section className="rounded-[1.4rem] border border-border bg-card p-5">
          <h2 className="mb-4 font-display text-2xl">Applications</h2>
          <Bars items={(analytics.data?.application_activity ?? []).map((item) => ({ label: statusLabel(item.status), value: item.count }))} />
        </section>
        <section className="rounded-[1.4rem] border border-border bg-card p-5">
          <h2 className="mb-4 font-display text-2xl">New accounts</h2>
          <Bars items={(analytics.data?.registrations ?? []).map((item) => ({ label: item.month, value: item.count }))} />
        </section>
      </div>
    </div>
  );
}
