"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight, BadgeCheck, Search } from "lucide-react";
import { FormEvent, useState } from "react";

import { CategoryIcon } from "@/components/category-icon";
import { OpportunityCard, OrgMark } from "@/components/opportunity-card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { HomePayload } from "@/lib/types";

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const home = useQuery({
    queryKey: ["home"],
    queryFn: async () => (await api.get<HomePayload>("/api/home")).data,
  });

  function onSearch(event: FormEvent) {
    event.preventDefault();
    router.push(query.trim() ? `/search?q=${encodeURIComponent(query.trim())}` : "/opportunities");
  }

  const data = home.data;

  return (
    <div>
      {data?.announcement && (
        <div className="bg-amber-100 px-4 py-2 text-center text-sm text-amber-950">{data.announcement}</div>
      )}
      <section className="relative overflow-hidden bg-ink text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(12,107,88,0.55),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(217,119,6,0.22),transparent_32%)]" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 md:py-28">
          <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-sm font-medium tracking-[0.18em] text-emerald-200/90 uppercase">
            Hargeisa Opportunity Hub
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mt-4 max-w-3xl font-display text-5xl leading-[1.05] tracking-tight md:text-6xl">
            Find Your Next Opportunity in Hargeisa
          </motion.h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-white/75">
            Scholarships, jobs, internships, courses, hackathons and more — all in one place.
          </p>
          <form onSubmit={onSearch} className="mt-8 flex max-w-2xl flex-col gap-2 rounded-2xl border border-white/15 bg-white/10 p-2 backdrop-blur-md sm:flex-row">
            <div className="flex flex-1 items-center gap-2 px-3">
              <Search className="h-4 w-4 text-white/70" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search opportunity, organization, or keyword"
                className="h-11 w-full bg-transparent text-sm text-white outline-none placeholder:text-white/55"
                aria-label="Search opportunities"
              />
            </div>
            <Button type="submit" className="bg-white text-ink hover:bg-emerald-50">
              Search
            </Button>
          </form>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/opportunities">
                Explore Opportunities <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10">
              <Link href="/register">Create Profile</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-3 px-4 py-8 sm:grid-cols-2 lg:grid-cols-4">
        {[
          [data?.stats.opportunities ?? "—", "Opportunities"],
          [data?.stats.organizations ?? "—", "Organizations"],
          [data?.stats.students ?? "—", "Students"],
          [data?.stats.platforms ?? 1, "Platform"],
        ].map(([value, label]) => (
          <div key={String(label)} className="rounded-3xl border border-border bg-white px-5 py-4">
            <p className="font-display text-3xl">{value}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        ))}
      </section>

      <Section title="Featured opportunities" href="/opportunities?featured=true" action="See all">
        <OpportunityGrid items={data?.featured ?? []} loading={home.isLoading} />
      </Section>
      <Section title="Closing soon" href="/opportunities?deadline=soon&sort=deadline" action="View deadlines">
        <OpportunityGrid items={data?.closing_soon ?? []} loading={home.isLoading} />
      </Section>
      <Section title="Latest opportunities" href="/opportunities" action="Explore">
        <OpportunityGrid items={data?.latest ?? []} loading={home.isLoading} />
      </Section>

      <section className="mx-auto max-w-6xl px-4 py-6">
        <h2 className="font-display text-3xl">Popular categories</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {(data?.categories ?? []).map((category) => (
            <Link key={category.id} href={`/opportunities?category=${category.slug}`} className="rounded-3xl border border-border bg-white p-4 hover:border-primary/40">
              <span className="grid h-10 w-10 place-items-center rounded-2xl" style={{ background: `${category.color}18`, color: category.color }}>
                <CategoryIcon name={category.icon} className="h-5 w-5" />
              </span>
              <p className="mt-3 font-semibold">{category.name}</p>
              <p className="text-sm text-muted-foreground">{category.opportunity_count} open</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-6">
        <h2 className="font-display text-3xl">Trusted organizations</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {(data?.organizations ?? []).slice(0, 10).map((org) => (
            <Link key={org.id} href={`/organizations/${org.slug}`} className="rounded-3xl border border-border bg-white p-4">
              <OrgMark name={org.name} />
              <p className="mt-3 flex items-center gap-1 font-semibold">
                {org.name}
                {org.verified && <BadgeCheck className="h-4 w-4 text-primary" aria-label="Verified" />}
              </p>
              <p className="text-sm text-muted-foreground">{org.opportunity_count} opportunities</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <h2 className="font-display text-3xl">How HOH works</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {[
            ["01", "Create your profile", "Tell us your university, skills, interests, and the kinds of opportunities you want."],
            ["02", "Get a personal feed", "HOH ranks approved listings against your profile and explains the match."],
            ["03", "Track and apply", "Save roles, follow deadlines, and move applications across your board."],
          ].map(([step, title, copy]) => (
            <div key={step} className="rounded-3xl bg-white p-5 border border-border">
              <p className="font-display text-sm text-primary">{step}</p>
              <h3 className="mt-2 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-8">
        <div className="overflow-hidden rounded-[2rem] bg-primary px-6 py-10 text-primary-foreground md:px-10">
          <h2 className="max-w-xl font-display text-4xl leading-tight">Your next opportunity is already listed.</h2>
          <p className="mt-3 max-w-xl text-emerald-50/90">Build a profile and HOH will keep the relevant scholarships, internships, and jobs in front of you.</p>
          <Button asChild className="mt-6 bg-white text-ink hover:bg-emerald-50">
            <Link href="/register">Create Profile</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

function Section({ title, href, action, children }: { title: string; href: string; action: string; children: React.ReactNode }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-4">
      <div className="mb-4 flex items-end justify-between gap-3">
        <h2 className="font-display text-3xl">{title}</h2>
        <Link href={href} className="text-sm font-semibold text-primary">
          {action}
        </Link>
      </div>
      {children}
    </section>
  );
}

function OpportunityGrid({ items, loading }: { items: HomePayload["latest"]; loading: boolean }) {
  if (loading) return <div className="h-40 animate-pulse rounded-3xl bg-white" />;
  if (items.length === 0) return <p className="text-sm text-muted-foreground">Nothing to show yet.</p>;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.slice(0, 4).map((item) => (
        <OpportunityCard key={item.id} opportunity={item} />
      ))}
    </div>
  );
}
