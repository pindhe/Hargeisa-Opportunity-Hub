"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, Bookmark, GraduationCap, MapPin, ShieldCheck, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { HomePayload } from "@/lib/types";

const points = [
  {
    icon: ShieldCheck,
    title: "Approved listings",
    copy: "A scholarship, job, internship, or course appears after it is reviewed. HOH does not invent opportunities or fill the catalogue with guesses.",
  },
  {
    icon: MapPin,
    title: "Built for Hargeisa",
    copy: "The catalogue is for students, graduates, and job seekers looking for the next step in Hargeisa and Somaliland, with local universities and employers.",
  },
  {
    icon: Bookmark,
    title: "One place to track",
    copy: "Save a listing, watch the deadline, and move an application from planned to accepted on your own board.",
  },
];

const people = [
  { icon: GraduationCap, title: "Students", copy: "Find scholarships, internships, courses, and hackathons while you are still in class." },
  { icon: UserRound, title: "Graduates", copy: "Look for first roles, fellowships, and training that match the field you studied." },
  { icon: BadgeCheck, title: "Professionals", copy: "Keep a short profile and return when a new programme or role opens." },
];

export default function AboutPage() {
  const home = useQuery({
    queryKey: ["home"],
    queryFn: async () => (await api.get<HomePayload>("/api/home")).data,
  });
  const stats = home.data?.stats;
  const figures = [
    [stats?.opportunities ?? "—", "Open listings"],
    [stats?.organizations ?? "—", "Organizations"],
    [stats?.students ?? "—", "Students and graduates"],
  ];

  return (
    <div className="pb-16">
      <section className="relative flex min-h-[26rem] items-center overflow-hidden text-white">
        <img src="/hero-hargeisa.png" alt="" className="absolute inset-0 h-full w-full object-cover object-[center_45%]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,21,16,0.35)_0%,rgba(7,21,16,0.72)_100%)]" />
        <div className="relative mx-auto max-w-3xl px-4 py-20 text-center">
          <p className="text-sm font-medium tracking-[0.18em] text-emerald-100 uppercase">About</p>
          <h1 className="mt-3 font-display text-5xl leading-tight tracking-tight md:text-6xl">Hargeisa Opportunity Hub</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-white/85">
            Scholarships, jobs, internships, courses, and competitions, gathered in one catalogue for people in Hargeisa.
          </p>
        </div>
      </section>

      <section className="relative z-10 mx-auto -mt-10 max-w-6xl px-4">
        <div className="grid gap-3 sm:grid-cols-3">
          {figures.map(([value, label]) => (
            <div key={String(label)} className="rounded-3xl border border-border bg-card px-5 py-5 shadow-[0_16px_40px_-28px_rgba(7,21,16,0.45)]">
              <p className="font-display text-3xl tracking-tight">{value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-14">
        <h2 className="font-display text-3xl">What this is</h2>
        <div className="mt-4 space-y-4 text-base leading-8 text-foreground/85">
          <p>
            HOH is a catalogue for the next step after class, or the next step in a career. Listings come from universities, employers, and programmes, and each one is reviewed before it is public.
          </p>
          <p>
            You search in one place, open the official application when you are ready, and keep the deadline and status on your own board. The assistant answers from approved listings only.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 md:grid-cols-3">
        {points.map((point) => (
          <article key={point.title} className="rounded-[1.6rem] border border-border bg-card p-6">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-accent text-primary">
              <point.icon className="h-5 w-5" />
            </span>
            <h2 className="mt-4 font-display text-2xl">{point.title}</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">{point.copy}</p>
          </article>
        ))}
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="font-display text-3xl">Who it is for</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {people.map((person) => (
            <article key={person.title} className="rounded-[1.6rem] border border-border bg-card p-6">
              <person.icon className="h-5 w-5 text-primary" />
              <h3 className="mt-3 text-lg font-semibold">{person.title}</h3>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">{person.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4">
        <div className="rounded-[2rem] bg-primary px-6 py-10 text-primary-foreground md:px-10">
          <h2 className="font-display text-3xl">Start with the catalogue</h2>
          <p className="mt-3 max-w-xl text-sm leading-7 text-primary-foreground/80">
            Browse what is open now, or create a profile so recommendations can follow your skills and university.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild className="bg-white text-ink hover:bg-emerald-50">
              <Link href="/opportunities">Explore opportunities</Link>
            </Button>
            <Button asChild variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20">
              <Link href="/register">Create profile</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
