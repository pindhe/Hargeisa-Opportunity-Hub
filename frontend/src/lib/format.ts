export const CATEGORY_LABELS: Record<string, string> = {
  scholarship: "Scholarship",
  job: "Job",
  internship: "Internship",
  course: "Course",
  training: "Training",
  competition: "Competition",
  hackathon: "Hackathon",
};

export const CATEGORY_COLORS: Record<string, string> = {
  scholarship: "bg-amber-50 text-amber-800 border-amber-200",
  job: "bg-blue-50 text-blue-800 border-blue-200",
  internship: "bg-teal-50 text-teal-800 border-teal-200",
  course: "bg-violet-50 text-violet-800 border-violet-200",
  training: "bg-sky-50 text-sky-800 border-sky-200",
  competition: "bg-orange-50 text-orange-800 border-orange-200",
  hackathon: "bg-fuchsia-50 text-fuchsia-800 border-fuchsia-200",
};

export const LOCATION_LABELS: Record<string, string> = {
  hargeisa: "Hargeisa",
  somaliland: "Somaliland",
  somalia: "Somalia",
  africa: "Africa",
  international: "International",
  remote: "Remote",
};

export const EDUCATION_LABELS: Record<string, string> = {
  high_school: "High School",
  diploma: "Diploma",
  bachelors: "Bachelor's",
  masters: "Master's",
  phd: "PhD",
};

export const FUNDING_LABELS: Record<string, string> = {
  fully_funded: "Fully funded",
  partially_funded: "Partially funded",
  paid: "Paid",
  free: "Free",
  unpaid: "Unpaid",
};

export function formatDate(value?: string | Date | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function daysLeft(deadline: string) {
  const diff = (new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (diff < 0) return "Expired";
  if (diff < 1) return "Closes today";
  if (diff < 2) return "1 day left";
  return `${Math.ceil(diff)} days left`;
}

export function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function labelize(value?: string | null, dict?: Record<string, string>) {
  if (!value) return "—";
  if (dict?.[value]) return dict[value];
  return value.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
