import type { Metadata } from "next";
import Link from "next/link";
import { Award, BookOpen, Briefcase, CalendarDays, Code2, GraduationCap, HeartHandshake, Laptop, Presentation, Trophy } from "lucide-react";

export const metadata: Metadata = { title: "Programs" };

const programs = [
  { type: "SCHOLARSHIP", label: "Scholarships", copy: "Funding for study, research, and living costs.", icon: GraduationCap },
  { type: "JOB", label: "Jobs", copy: "Full-time and part-time roles with local and international employers.", icon: Briefcase },
  { type: "INTERNSHIP", label: "Internships", copy: "Short placements to build experience while you study.", icon: Laptop },
  { type: "COURSE", label: "Courses", copy: "Structured learning, from short courses to full programs.", icon: BookOpen },
  { type: "TRAINING", label: "Training", copy: "Practical workshops that build job-ready skills.", icon: Presentation },
  { type: "HACKATHON", label: "Hackathons", copy: "Time-boxed builds for students who like to ship.", icon: Code2 },
  { type: "COMPETITION", label: "Competitions", copy: "Challenges, prizes, and a public result.", icon: Trophy },
  { type: "FELLOWSHIP", label: "Fellowships", copy: "Funded periods of research, leadership, or practice.", icon: Award },
  { type: "VOLUNTEERING", label: "Volunteering", copy: "Ways to contribute skills to community work.", icon: HeartHandshake },
  { type: "EVENT", label: "Events", copy: "Fairs, forums, and gatherings worth showing up for.", icon: CalendarDays },
];

export default function ProgramsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <p className="text-sm font-medium tracking-[0.16em] text-primary uppercase">Programs</p>
      <h1 className="mt-2 max-w-2xl font-display text-4xl tracking-tight md:text-5xl">Choose a path</h1>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">
        Every program opens the catalogue already filtered to that type of opportunity.
      </p>
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {programs.map((program) => (
          <Link
            key={program.type}
            href={`/opportunities?type=${program.type}`}
            className="rounded-3xl border border-border bg-card p-5 transition hover:border-primary/40"
          >
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-accent text-primary">
              <program.icon className="h-5 w-5" />
            </span>
            <h2 className="mt-4 text-lg font-semibold">{program.label}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{program.copy}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
