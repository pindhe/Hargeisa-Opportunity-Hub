"use client";

import { Bars, useAnalytics } from "../page";

export default function AnalyticsPage() {
  const analytics = useAnalytics();
  const data = analytics.data;
  return (
    <div>
      <h1 className="font-display text-4xl">Analytics</h1>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-3xl border border-border bg-card p-5"><h2 className="mb-4 font-semibold">Opportunities by month</h2><Bars items={(data?.by_month ?? []).map((item) => ({ label: item.month, value: item.count }))} /></section>
        <section className="rounded-3xl border border-border bg-card p-5"><h2 className="mb-4 font-semibold">User registrations</h2><Bars items={(data?.registrations ?? []).map((item) => ({ label: item.month, value: item.count }))} /></section>
        <section className="rounded-3xl border border-border bg-card p-5"><h2 className="mb-4 font-semibold">Application activity</h2><Bars items={(data?.application_activity ?? []).map((item) => ({ label: item.status, value: item.count }))} /></section>
        <section className="rounded-3xl border border-border bg-card p-5"><h2 className="mb-4 font-semibold">Opportunities by category</h2><Bars items={(data?.by_category ?? []).map((item) => ({ label: item.name, value: item.count }))} /></section>
      </div>
    </div>
  );
}
