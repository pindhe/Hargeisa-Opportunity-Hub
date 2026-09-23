import {
  Award,
  BookOpen,
  Briefcase,
  Building2,
  CalendarDays,
  Code2,
  GraduationCap,
  HeartHandshake,
  Presentation,
  Sparkles,
  Trophy,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  GraduationCap,
  Briefcase,
  Building2,
  BookOpen,
  Presentation,
  Code2,
  Trophy,
  Award,
  HeartHandshake,
  CalendarDays,
  Sparkles,
};

export function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? Sparkles;
  return <Icon className={className} aria-hidden />;
}
