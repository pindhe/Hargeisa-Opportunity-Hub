import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export function mediaUrl(path: string | null | undefined) {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_URL}${path}`;
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "No deadline";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

export type DeadlineTone = "green" | "yellow" | "red" | "expired" | "open";

export function deadlineInfo(days: number | null | undefined): { label: string; tone: DeadlineTone } {
  if (days === null || days === undefined) return { label: "Rolling", tone: "open" };
  if (days < 0) return { label: "Expired", tone: "expired" };
  if (days === 0) return { label: "Closes today", tone: "red" };
  if (days === 1) return { label: "Closing tomorrow", tone: "red" };
  if (days <= 2) return { label: `${days} days left`, tone: "red" };
  if (days <= 7) return { label: `${days} days left`, tone: "yellow" };
  return { label: `${days} days left`, tone: "green" };
}

export function typeLabel(value: string) {
  const labels: Record<string, string> = {
    SCHOLARSHIP: "Scholarship",
    JOB: "Job",
    INTERNSHIP: "Internship",
    COURSE: "Course",
    TRAINING: "Training",
    HACKATHON: "Hackathon",
    COMPETITION: "Competition",
    FELLOWSHIP: "Fellowship",
    VOLUNTEERING: "Volunteering",
    EVENT: "Event",
  };
  return labels[value] ?? value;
}

export function statusLabel(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
