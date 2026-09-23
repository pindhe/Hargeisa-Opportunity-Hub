"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight, BadgeCheck, Bookmark, Search, Sparkles, UserRound } from "lucide-react";
import { FormEvent, useState } from "react";

import { CategoryIcon } from "@/components/category-icon";
import { Logo } from "@/components/logo";
import { OrgMark } from "@/components/opportunity-card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { HomePayload } from "@/lib/types";
import { mediaUrl } from "@/lib/utils";

const steps = [
  {
    icon: UserRound,
    title: "Create your profile",
    copy: "Add your university, skills, and the kinds of opportunities you want.",
  },
  {
    icon: Sparkles,
    title: "Get a personal feed",
    copy: "HOH ranks approved listings against your profile and explains the match.",
  },
  {
    icon: Bookmark,
    title: "Track and apply",
    copy: "Save roles, follow deadlines, and move applications across your board.",
  },
];

export default function HomePage() {
  const [query, setQuery] = useState("");
  const home = useQuery({
    queryKey: ["home"],
    queryFn: async () => (await api.get<HomePayload>("/api/home")).data,
  });

  function onSearch(event: FormEvent) {
    event.preventDefault();
    window.dispatchEvent(new CustomEvent("hoh-open-search", { detail: query.trim() }));
  }

  const data = home.data;
  const stats = [
    [data?.stats.opportunities ?? "—", "Open opportunities"],
    [data?.stats.organizations ?? "—", "Organizations"],
    [data?.stats.students ?? "—", "Students and graduates"],
  ];

  return (
    <div>
      {data?.announcement && (
        <div className="bg-amber-100 px-4 py-2 text-center text-sm text-amber-950">{data.announcement}</div>
      )}

      <section className="relative isolate flex min-h-[78vh] items-center overflow-hidden bg-ink text-white">
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.4, ease: "easeOut" }}
        >
          <img src="/bghero-straight.jpg" alt="" className="h-full w-full object-cover object-center" />
        </motion.div>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,21,16,0.82)_0%,rgba(7,21,16,0.55)_42%,rgba(7,21,16,0.88)_100%)]" />
        <div className="relative mx-auto flex w-full max-w-3xl flex-col items-center px-4 py-20 text-center">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Logo tone="onDark" size="lg" />
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mt-6 text-sm font-medium tracking-[0.18em] text-emerald-100 uppercase"
          >
            Hargeisa Opportunity Hub
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.12 }}
            className="mt-4 font-display text-5xl leading-[1.05] tracking-tight md:text-6xl"
          >
            Find your next opportunity in Hargeisa
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.24 }}
            className="mt-5 max-w-2xl text-lg leading-8 text-white/80"
          >
            Scholarships, jobs, internships, courses, and competitions, reviewed and listed in one catalogue.
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
                Explore opportunities <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20">
              <Link href="/register">Create profile</Link>
            </Button>
          </motion.div>
        </div>
      </section>

      <section className="relative z-10 mx-auto -mt-8 max-w-6xl px-4">
        <div className="grid gap-3 sm:grid-cols-3">
          {stats.map(([value, label]) => (
            <div key={String(label)} className="rounded-3xl border border-border bg-card px-5 py-5 shadow-[0_16px_40px_-28px_rgba(7,21,16,0.45)]">
              <p className="font-display text-3xl tracking-tight">{value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <SectionHeading
          eyebrow="Browse"
          title="Popular categories"
          copy="Start with the kind of opportunity you are looking for."
          href="/opportunities"
          action="View the catalogue"
        />
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {(data?.categories ?? []).map((category) => (
            <Link
              key={category.id}
              href={`/opportunities?category=${category.slug}`}
              className="flex h-full flex-col rounded-3xl border border-border bg-card p-4 transition hover:border-primary/40"
            >
              <span className="grid h-10 w-10 place-items-center rounded-2xl" style={{ background: `${category.color}18`, color: category.color }}>
                <CategoryIcon name={category.icon} className="h-5 w-5" />
              </span>
              <p className="mt-3 font-semibold">{category.name}</p>
              <p className="mt-auto pt-2 text-sm text-muted-foreground">{category.opportunity_count} open</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-card/60">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <SectionHeading
            eyebrow="Partners"
            title="Trusted organizations"
            copy="Listings come from universities, employers, and programmes working in Hargeisa."
          />
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {(data?.organizations ?? []).slice(0, 10).map((org) => (
              <Link key={org.id} href={`/organizations/${org.slug}`} className="flex h-full flex-col rounded-3xl border border-border bg-card p-4">
                <span className="grid h-16 place-items-center rounded-2xl bg-white px-3">
                  {org.logo ? (
                    <img src={mediaUrl(org.logo)} alt="" className="max-h-10 w-full object-contain" />
                  ) : (
                    <OrgMark name={org.name} className="h-10 w-10" />
                  )}
                </span>
                <p className="mt-3 flex items-start gap-1 font-semibold leading-snug">
                  <span className="line-clamp-2">{org.name}</span>
                  {org.verified && <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-label="Verified" />}
                </p>
                <p className="mt-auto pt-2 text-sm text-muted-foreground">{org.opportunity_count} opportunities</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <SectionHeading eyebrow="How it works" title="From profile to application" copy="Three steps. The catalogue stays limited to listings HOH has approved." />
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.title} className="rounded-3xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-accent text-primary">
                  <step.icon className="h-5 w-5" />
                </span>
                <p className="font-display text-sm text-primary">0{index + 1}</p>
              </div>
              <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="flex flex-col items-start justify-between gap-6 rounded-[2rem] bg-primary px-6 py-10 text-primary-foreground md:flex-row md:items-center md:px-10">
          <div className="max-w-xl">
            <h2 className="font-display text-4xl leading-tight">Your next opportunity is already listed.</h2>
            <p className="mt-3 text-primary-foreground/80">Build a profile and HOH will keep the relevant scholarships, internships, and jobs in front of you.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild className="bg-white text-ink hover:bg-emerald-50">
              <Link href="/register">Create profile</Link>
            </Button>
            <Button asChild variant="outline" className="border-white/30 bg-transparent text-primary-foreground hover:bg-white/10">
              <Link href="/opportunities">Browse listings</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  copy,
  href,
  action,
}: {
  eyebrow: string;
  title: string;
  copy: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <p className="text-sm font-medium tracking-[0.16em] text-primary uppercase">{eyebrow}</p>
        <h2 className="mt-2 font-display text-3xl tracking-tight md:text-4xl">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy}</p>
      </div>
      {href && action && (
        <Link href={href} className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
          {action} <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
