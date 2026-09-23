"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";

type Analytics = {
  totals: Record<string, number>;
  by_category: { name: string; count: number }[];
  by_month: { month: string; count: number }[];
  registrations: { month: string; count: number }[];
  application_activity: { status: string; count: number }[];
  popular_categories: { name: string; count: number }[];
};

export function Bars({ items }: { items: { label: string; value: number }[] }) {
  const max = Math.max(1, ...items.map((item) => item.value));
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label}>
          <div className="mb-1 flex justify-between text-sm"><span>{item.label}</span><span>{item.value}</span></div>
          <div className="h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary" style={{ width: `${(item.value / max) * 100}%` }} /></div>
        </div>
      ))}
      {items.length === 0 && <p className="text-sm text-muted-foreground">No data yet.</p>}
    </div>
  );
}

export function useAnalytics() {
  return useQuery({ queryKey: ["analytics"], queryFn: async () => (await api.get<Analytics>("/api/admin/analytics")).data });
}

export default function AdminHome() {
  const analytics = useAnalytics();
  const totals = analytics.data?.totals;
  return (
    <div>
      <h1 className="font-display text-4xl">Dashboard</h1>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[
          ["Total users", totals?.users],
          ["Total opportunities", totals?.opportunities],
          ["Active opportunities", totals?.active],
          ["Expired opportunities", totals?.expired],
          ["Applications", totals?.applications],
          ["Organizations", totals?.organizations],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-3xl border border-border bg-card p-4">
            <p className="text-3xl font-semibold">{value ?? "—"}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Panel title="Opportunities by category"><Bars items={(analytics.data?.by_category ?? []).map((item) => ({ label: item.name, value: item.count }))} /></Panel>
        <Panel title="Most popular categories"><Bars items={(analytics.data?.popular_categories ?? []).map((item) => ({ label: item.name, value: item.count }))} /></Panel>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-3xl border border-border bg-card p-5"><h2 className="mb-4 font-semibold">{title}</h2>{children}</section>;
}
