import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "Hargeisa Opportunity Hub gathers reviewed scholarships, jobs, internships, and courses for students and graduates in Hargeisa.",
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
