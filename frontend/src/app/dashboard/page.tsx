"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { RequireAuth } from "@/components/guard";
import { OpportunityCard } from "@/components/opportunity-card";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { APPLICATION_STATUSES, type Application, type Notification, type Opportunity, type PageResult } from "@/lib/types";
import { statusLabel } from "@/lib/utils";

function Dashboard() {
  const { user } = useAuth();
  const recommended = useQuery({
    queryKey: ["recommendations"],
    queryFn: async () => (await api.get<Opportunity[]>("/api/recommendations")).data,
  });
  const closing = useQuery({
    queryKey: ["closing"],
    queryFn: async () => (await api.get<PageResult>("/api/opportunities?deadline=soon&sort=deadline&page_size=4")).data,
  });
  const saved = useQuery({
    queryKey: ["bookmarks"],
    queryFn: async () => (await api.get<Opportunity[]>("/api/bookmarks")).data,
  });
  const applications = useQuery({
    queryKey: ["applications"],
    queryFn: async () => (await api.get<Application[]>("/api/applications")).data,
  });
  const notes = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => (await api.get<Notification[]>("/api/notifications")).data,
  });
  const counts = Object.fromEntries(APPLICATION_STATUSES.map((status) => [status, (applications.data ?? []).filter((item) => item.status === status).length]));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <p className="text-sm text-primary">Your feed</p>
      <h1 className="font-display text-4xl">Welcome back, {user?.full_name.split(" ")[0]}</h1>
      <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {APPLICATION_STATUSES.map((status) => (
          <Link key={status} href="/dashboard/applications" className="rounded-2xl border border-border bg-card p-3">
            <p className="text-2xl font-semibold">{counts[status] ?? 0}</p>
            <p className="text-xs text-muted-foreground">{statusLabel(status)}</p>
          </Link>
        ))}
      </div>
      <Block title="Recommended for you" href="/opportunities?sort=recommended">
        <Grid items={recommended.data ?? []} empty="Complete your profile to see matches." />
        {recommended.data?.[0]?.recommendation_reason && (
          <p className="mt-3 text-sm text-primary">{recommended.data[0].recommendation_reason}</p>
        )}
      </Block>
      <Block title="Closing soon" href="/opportunities?deadline=soon&sort=deadline">
        <Grid items={closing.data?.items ?? []} empty="No upcoming deadlines in the next two weeks." />
      </Block>
      <Block title="Saved opportunities" href="/dashboard/saved">
        <Grid items={(saved.data ?? []).slice(0, 4)} empty="Bookmark an opportunity to keep it here." />
      </Block>
      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-3xl">Notifications</h2>
          <Link href="/notifications" className="text-sm font-semibold text-primary">Open center</Link>
        </div>
        <div className="space-y-2">
          {(notes.data ?? []).slice(0, 4).map((item) => (
            <Link key={item.id} href={item.link || "/notifications"} className="block rounded-2xl border border-border bg-card px-4 py-3">
              <p className="font-medium">{item.title}</p>
              <p className="text-sm text-muted-foreground">{item.message}</p>
            </Link>
          ))}
          {notes.data?.length === 0 && <p className="text-sm text-muted-foreground">No notifications yet.</p>}
        </div>
      </section>
    </div>
  );
}

function Block({ title, href, children }: { title: string; href: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-3xl">{title}</h2>
        <Link href={href} className="text-sm font-semibold text-primary">View all</Link>
      </div>
      {children}
    </section>
  );
}

function Grid({ items, empty }: { items: Opportunity[]; empty: string }) {
  if (items.length === 0) return <p className="rounded-3xl bg-card p-6 text-sm text-muted-foreground">{empty}</p>;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.slice(0, 4).map((item) => <OpportunityCard key={item.id} opportunity={item} />)}
    </div>
  );
}

export default function DashboardPage() {
  return <RequireAuth><Dashboard /></RequireAuth>;
}
