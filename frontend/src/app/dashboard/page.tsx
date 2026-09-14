"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import type { ApplicationItem, Opportunity } from "@/lib/types";
import { OpportunityCard, OpportunitySkeleton } from "@/components/OpportunityCard";
import { EmptyState } from "@/components/ui";

export default function DashboardPage() {
  const { user, loading, token } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const [saved, setSaved] = useState<Opportunity[]>([]);
  const [apps, setApps] = useState<ApplicationItem[]>([]);
  const [recs, setRecs] = useState<Opportunity[]>([]);
  const [upcoming, setUpcoming] = useState<Opportunity[]>([]);
  const [latest, setLatest] = useState<Opportunity[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      api<{ items: { opportunity: Opportunity }[] }>("/api/saved", { token }),
      api<{ items: ApplicationItem[] }>("/api/applications", { token }),
      api<{ items: Opportunity[] }>("/api/ai/recommendations", { token }).catch(() => ({ items: [] as Opportunity[] })),
      api<{ items: Opportunity[] }>("/api/opportunities/upcoming"),
      api<{ items: Opportunity[] }>("/api/opportunities/latest"),
    ]).then(([s, a, r, u, l]) => {
      setSaved(s.items.map((i) => i.opportunity));
      setApps(a.items);
      setRecs(r.items);
      setUpcoming(u.items);
      setLatest(l.items);
      setReady(true);
    });
  }, [token]);

  if (!user) return null;

  const week = upcoming.filter((o) => {
    const days = (new Date(o.deadline).getTime() - Date.now()) / 86400000;
    return days >= 0 && days <= 7;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-3xl font-semibold text-navy">
        {t("welcome")}, {user.name.split(" ")[0]}
      </h1>
      <p className="mt-2 text-slate-600">Your personalized opportunity workspace.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Saved", saved.length],
          ["Applied", apps.filter((a) => a.status === "applied").length],
          ["Upcoming deadlines", week.length],
          ["Recommended", recs.length],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-2xl bg-white p-5">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-semibold text-navy">{value}</p>
          </div>
        ))}
      </div>

      <DashSection title={t("recommended")} empty={t("emptyRecs")} href="/profile">
        {!ready ? <Skeletons /> : recs.length ? recs.slice(0, 4).map((o) => <OpportunityCard key={o.id} opportunity={o} />) : <EmptyState title={t("emptyRecs")} action={<Link href="/profile" className="font-semibold text-primary">Complete profile</Link>} />}
      </DashSection>
      <DashSection title="Deadlines this week" empty="No deadlines this week." href="/opportunities?deadline=this_week">
        {week.slice(0, 4).map((o) => <OpportunityCard key={o.id} opportunity={o} />)}
      </DashSection>
      <DashSection title={t("saved")} empty={t("emptySaved")} href="/saved">
        {saved.slice(0, 4).map((o) => <OpportunityCard key={o.id} opportunity={o} />)}
      </DashSection>
      <DashSection title="My applications" empty={t("emptyApplications")} href="/applications">
        {apps.slice(0, 4).map((a) => (
          <div key={a.id} className="rounded-2xl bg-white p-5">
            <p className="font-semibold text-navy">{a.opportunity.title}</p>
            <p className="mt-1 text-sm capitalize text-slate-500">{a.status}</p>
          </div>
        ))}
      </DashSection>
      <DashSection title="Recently added" href="/opportunities">
        {latest.slice(0, 4).map((o) => <OpportunityCard key={o.id} opportunity={o} />)}
      </DashSection>
    </div>
  );
}

function DashSection({ title, children, href }: { title: string; empty?: string; href: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-navy">{title}</h2>
        <Link href={href} className="text-sm font-semibold text-accent">View all</Link>
      </div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">{children}</div>
    </section>
  );
}

function Skeletons() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <OpportunitySkeleton key={i} />
      ))}
    </>
  );
}
