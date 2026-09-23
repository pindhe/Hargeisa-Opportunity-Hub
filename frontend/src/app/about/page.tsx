import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, MapPin, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "About" };

const points = [
  {
    icon: ShieldCheck,
    title: "Approved listings",
    copy: "Scholarships, jobs, internships, and courses appear after they are reviewed. HOH does not invent opportunities.",
  },
  {
    icon: BadgeCheck,
    title: "Built for Hargeisa",
    copy: "The catalogue is for students, graduates, and job seekers looking for the next step in Hargeisa and Somaliland.",
  },
  {
    icon: MapPin,
    title: "One place to track",
    copy: "Save a listing, follow the deadline, and move an application from planned to accepted on your own board.",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <p className="text-sm font-medium tracking-[0.16em] text-primary uppercase">About</p>
      <h1 className="mt-2 max-w-2xl font-display text-4xl tracking-tight md:text-5xl">Hargeisa Opportunity Hub</h1>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">
        HOH gathers scholarships, jobs, internships, courses, and competitions into one catalogue so you can search, save, and apply without checking a dozen places.
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {points.map((point) => (
          <article key={point.title} className="rounded-3xl border border-border bg-card p-5">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-accent text-primary">
              <point.icon className="h-5 w-5" />
            </span>
            <h2 className="mt-4 text-lg font-semibold">{point.title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{point.copy}</p>
          </article>
        ))}
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/opportunities">Explore opportunities</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/register">Create profile</Link>
        </Button>
      </div>
    </div>
  );
}
