"use client";

import { Bars, useAnalytics } from "../page";
import { Loading } from "@/components/loading";
import { statusLabel } from "@/lib/utils";

const totals = [
  ["users", "People"],
  ["opportunities", "Listings"],
  ["active", "Approved"],
  ["expired", "Expired"],
  ["applications", "Applications"],
  ["organizations", "Organizations"],
] as const;

export default function AnalyticsPage() {
  const analytics = useAnalytics();
  const data = analytics.data;

  return (
    <div className="mx-auto max-w-6xl">
      <p className="text-sm font-medium tracking-[0.16em] text-primary uppercase">Site</p>
      <h1 className="mt-1 font-display text-4xl tracking-tight">Analytics</h1>
      <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Counts from the live catalogue: listings, accounts, and how applications are moving.</p>

      {analytics.isLoading && <Loading label="Loading analytics" />}

      {data && (
        <>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {totals.map(([key, label]) => (
              <div key={key} className="rounded-[1.4rem] border border-border bg-card p-5">
                <p className="font-display text-3xl">{data.totals[key] ?? 0}</p>
                <p className="mt-1 text-sm text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Panel title="Listings added" copy="New opportunities in the last six months.">
              <Bars items={data.by_month.map((item) => ({ label: item.month, value: item.count }))} />
            </Panel>
            <Panel title="New accounts" copy="People who created a profile in the last six months.">
              <Bars items={data.registrations.map((item) => ({ label: item.month, value: item.count }))} />
            </Panel>
            <Panel title="Applications" copy="Where tracked applications sit right now.">
              <Bars items={data.application_activity.map((item) => ({ label: statusLabel(item.status), value: item.count }))} />
            </Panel>
            <Panel title="Listings by category" copy="How the catalogue is split.">
              <Bars items={data.by_category.map((item) => ({ label: item.name, value: item.count }))} />
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}

function Panel({ title, copy, children }: { title: string; copy: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[1.4rem] border border-border bg-card p-5">
      <h2 className="font-display text-2xl">{title}</h2>
      <p className="mt-1 mb-4 text-sm text-muted-foreground">{copy}</p>
      {children}
    </section>
  );
}
