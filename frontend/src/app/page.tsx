"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight, BadgeCheck, Search } from "lucide-react";
import { FormEvent, useState } from "react";

import { CategoryIcon } from "@/components/category-icon";
import { Logo } from "@/components/logo";
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
      <section className="relative isolate flex min-h-[92vh] items-center overflow-hidden bg-ink text-white">
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.4, ease: "easeOut" }}
        >
          <img
            src="/bghero-straight.jpg"
            alt=""
            className="h-full w-full object-cover object-center"
          />
        </motion.div>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,21,16,0.78)_0%,rgba(7,21,16,0.42)_46%,rgba(7,21,16,0.78)_100%)]" />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -left-16 top-24 h-56 w-56 rounded-full bg-emerald-300/20 blur-3xl"
          animate={{ y: [0, 18, 0], opacity: [0.35, 0.6, 0.35] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -right-10 bottom-16 h-64 w-64 rounded-full bg-amber-200/20 blur-3xl"
          animate={{ y: [0, -22, 0], opacity: [0.25, 0.5, 0.25] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="relative mx-auto flex w-full max-w-3xl flex-col items-center px-4 py-24 text-center">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Logo tone="onDark" size="lg" />
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-sm font-medium tracking-[0.18em] text-emerald-100 uppercase"
          >
            Hargeisa Opportunity Hub
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.12 }}
            className="mt-4 font-display text-5xl leading-[1.05] tracking-tight md:text-6xl"
          >
            Find Your Next Opportunity in Hargeisa
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.24 }}
            className="mt-5 max-w-2xl text-lg leading-8 text-white/80"
          >
            Scholarships, jobs, internships, courses, hackathons and more — all in one place.
          </motion.p>
          <motion.form
            onSubmit={onSearch}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.36 }}
            className="mt-8 flex w-full max-w-2xl flex-col gap-2 rounded-2xl border border-white/20 bg-white/10 p-2 shadow-2xl backdrop-blur-md sm:flex-row"
          >
            <div className="flex flex-1 items-center gap-2 px-3">
              <Search className="h-4 w-4 shrink-0 text-white/70" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search opportunity, organization, or keyword"
                className="h-11 w-full bg-transparent text-center text-sm text-white outline-none placeholder:text-white/55 sm:text-left"
                aria-label="Search opportunities"
              />
            </div>
            <Button type="submit" className="bg-white text-ink hover:bg-emerald-50">
              Search
            </Button>
          </motion.form>
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.48 }}
            className="mt-6 flex flex-wrap items-center justify-center gap-3"
          >
            <Button asChild size="lg">
              <Link href="/opportunities">
                Explore Opportunities <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20">
              <Link href="/register">Create Profile</Link>
            </Button>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-3 px-4 py-8 sm:grid-cols-2 lg:grid-cols-4">
        {[
          [data?.stats.opportunities ?? "—", "Opportunities"],
          [data?.stats.organizations ?? "—", "Organizations"],
          [data?.stats.students ?? "—", "Students"],
          [data?.stats.platforms ?? 1, "Platform"],
        ].map(([value, label]) => (
          <div key={String(label)} className="rounded-3xl border border-border bg-card px-5 py-4">
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
            <Link key={category.id} href={`/opportunities?category=${category.slug}`} className="rounded-3xl border border-border bg-card p-4 hover:border-primary/40">
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
            <Link key={org.id} href={`/organizations/${org.slug}`} className="rounded-3xl border border-border bg-card p-4">
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
            <div key={step} className="rounded-3xl bg-card p-5 border border-border">
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
          <p className="mt-3 max-w-xl text-primary-foreground/80">Build a profile and HOH will keep the relevant scholarships, internships, and jobs in front of you.</p>
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
  if (loading) return <div className="h-40 animate-pulse rounded-3xl bg-card" />;
  if (items.length === 0) return <p className="text-sm text-muted-foreground">Nothing to show yet.</p>;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.slice(0, 4).map((item) => (
        <OpportunityCard key={item.id} opportunity={item} />
      ))}
    </div>
  );
}
