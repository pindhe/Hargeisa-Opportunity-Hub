"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import type { Opportunity } from "@/lib/types";
import { OpportunityCard, OpportunitySkeleton } from "@/components/OpportunityCard";
import { Button } from "@/components/ui";
import { useRouter } from "next/navigation";

type Stats = {
  opportunities: number;
  scholarships: number;
  internships: number;
  organizations: number;
  byCategory: { id: string; label: string; emoji: string; count: number }[];
};

const testimonials = [
  {
    name: "Amina Hassan",
    role: "Software Engineering student",
    quote: "I used to miss deadlines in WhatsApp groups. HOH keeps scholarships and internships in one place.",
  },
  {
    name: "Khadar Mohamed",
    role: "Recent graduate",
    quote: "The application tracker helped me stay organised while applying for graduate jobs in Hargeisa.",
  },
  {
    name: "Hodan Yusuf",
    role: "Training participant",
    quote: "I found a free digital marketing course I would have never seen on Facebook.",
  },
];

export default function HomePage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [featured, setFeatured] = useState<Opportunity[]>([]);
  const [latest, setLatest] = useState<Opportunity[]>([]);
  const [upcoming, setUpcoming] = useState<Opportunity[]>([]);
  const [recommended, setRecommended] = useState<Opportunity[]>([]);
  const [orgs, setOrgs] = useState<{ id: number; name: string; slug: string; verified: boolean; isSample: boolean }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = typeof window !== "undefined" ? window.localStorage.getItem("hoh-token") : null;
    Promise.all([
      api<Stats>("/api/stats"),
      api<{ items: Opportunity[] }>("/api/opportunities/featured"),
      api<{ items: Opportunity[] }>("/api/opportunities/latest"),
      api<{ items: Opportunity[] }>("/api/opportunities/upcoming"),
      api<{ items: { id: number; name: string; slug: string; verified: boolean; isSample: boolean }[] }>("/api/organizations"),
      token ? api<{ items: Opportunity[] }>("/api/ai/recommendations", { token }).catch(() => ({ items: [] })) : Promise.resolve({ items: [] }),
    ])
      .then(([s, f, l, u, o, r]) => {
        setStats(s);
        setFeatured(f.items);
        setLatest(l.items);
        setUpcoming(u.items);
        setOrgs(o.items.filter((org) => org.verified).slice(0, 6));
        setRecommended(r.items);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <section className="hero-grid text-white">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-200">{t("tagline")}</p>
            <h1 className="mt-4 max-w-xl text-4xl font-semibold leading-tight md:text-6xl">{t("heroTitle")}</h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-blue-100 md:text-lg">{t("heroBody")}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/opportunities">
                <Button className="bg-white text-navy hover:bg-blue-50">{t("explore")}</Button>
              </Link>
              <Link href={user ? "/profile" : "/register"}>
                <Button variant="secondary" className="border-white/20 bg-white/10 text-white hover:bg-white/20">
                  {t("createProfile")}
                </Button>
              </Link>
            </div>
            <form
              className="mt-8 flex max-w-xl overflow-hidden rounded-2xl bg-white p-1.5 text-navy shadow-xl"
              onSubmit={(e) => {
                e.preventDefault();
                router.push(`/opportunities?q=${encodeURIComponent(q)}`);
              }}
            >
              <Search className="ml-3 mt-3 h-5 w-5 text-slate-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="flex-1 px-3 py-3 text-sm outline-none"
              />
              <Button type="submit">{t("search")}</Button>
            </form>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur">
            <p className="text-sm text-blue-100">Trusted starting point for Hargeisa students</p>
            <div className="mt-6 grid grid-cols-2 gap-4">
              {[
                [stats?.opportunities ?? "—", "Opportunities"],
                [stats?.scholarships ?? "—", "Scholarships"],
                [stats?.internships ?? "—", "Internships"],
                [stats?.organizations ?? "—", "Organizations"],
              ].map(([value, label]) => (
                <div key={String(label)} className="rounded-2xl bg-white/10 p-4">
                  <p className="text-3xl font-semibold">{value}</p>
                  <p className="mt-1 text-sm text-blue-100">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <h2 className="text-2xl font-semibold text-navy">Popular categories</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(stats?.byCategory ?? []).map((cat) => (
            <Link
              key={cat.id}
              href={`/opportunities?category=${cat.id}`}
              className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-blue-200"
            >
              <p className="text-2xl">{cat.emoji}</p>
              <p className="mt-3 font-semibold text-navy">{cat.label}</p>
              <p className="text-sm text-slate-500">{cat.count} open</p>
            </Link>
          ))}
        </div>
      </section>

      <Section title={t("featured")} href="/opportunities?featured=true" loading={loading} items={featured} />
      <Section title={t("deadlineSoon")} href="/opportunities?sort=deadline" loading={loading} items={upcoming} />
      {recommended.length ? <Section title={t("recommended")} href="/opportunities?sort=recommended" items={recommended} /> : null}
      <Section title={t("latest")} href="/opportunities" loading={loading} items={latest} />

      <section className="mx-auto max-w-7xl px-4 py-16">
        <h2 className="text-2xl font-semibold text-navy">{t("howTitle")}</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {[
            ["01", t("step1Title"), t("step1Body")],
            ["02", t("step2Title"), t("step2Body")],
            ["03", t("step3Title"), t("step3Body")],
          ].map(([n, title, body]) => (
            <div key={n} className="rounded-2xl bg-white p-6 shadow-sm">
              <p className="text-sm font-bold text-accent">{n}</p>
              <h3 className="mt-2 text-xl font-semibold text-navy">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="text-2xl font-semibold text-navy">{t("partners")}</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {orgs.map((org) => (
              <Link key={org.id} href={`/organizations/${org.slug}`} className="rounded-2xl border p-4 hover:border-blue-200">
                <p className="font-semibold text-navy">{org.name}</p>
                <p className="text-xs text-slate-500">{org.isSample ? "Sample partner" : "Partner"} {org.verified ? "✓" : ""}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <h2 className="text-2xl font-semibold text-navy">{t("testimonials")}</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {testimonials.map((item) => (
            <blockquote key={item.name} className="rounded-2xl bg-white p-6">
              <p className="text-sm leading-6 text-slate-700">“{item.quote}”</p>
              <footer className="mt-4 text-sm font-semibold text-navy">{item.name}</footer>
              <p className="text-xs text-slate-500">{item.role}</p>
            </blockquote>
          ))}
        </div>
      </section>

      <section className="bg-navy py-16 text-white">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-semibold">{t("ctaTitle")}</h2>
          <p className="mt-3 text-blue-100">{t("ctaBody")}</p>
          <Link href="/register" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-navy">
            {t("createAccount")} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

function Section({
  title,
  href,
  items,
  loading,
}: {
  title: string;
  href: string;
  items: Opportunity[];
  loading?: boolean;
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-6 flex items-end justify-between">
        <h2 className="text-2xl font-semibold text-navy">{title}</h2>
        <Link href={href} className="text-sm font-semibold text-accent">
          View all
        </Link>
      </div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <OpportunitySkeleton key={i} />)
          : items.slice(0, 4).map((item) => <OpportunityCard key={item.id} opportunity={item} />)}
      </div>
    </section>
  );
}
