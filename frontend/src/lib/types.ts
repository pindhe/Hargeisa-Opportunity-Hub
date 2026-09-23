export type User = {
  id: string;
  full_name: string;
  username: string;
  email: string;
  profile_image: string | null;
  phone: string | null;
  location: string | null;
  university: string | null;
  faculty: string | null;
  department: string | null;
  graduation_year: number | null;
  education_level: string | null;
  skills: string[];
  interests: string[];
  preferred_categories: string[];
  preferred_locations: string[];
  bio: string | null;
  role: "STUDENT" | "GRADUATE" | "PROFESSIONAL" | "ADMIN" | string;
  is_verified: boolean;
  onboarding_complete: boolean;
  created_at: string;
  updated_at: string;
};

export type PublicUser = {
  username: string;
  full_name: string;
  profile_image: string | null;
  location: string | null;
  university: string | null;
  faculty: string | null;
  department: string | null;
  graduation_year: number | null;
  education_level: string | null;
  skills: string[];
  interests: string[];
  bio: string | null;
  role: string;
};

export type Organization = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  verified: boolean;
  location: string | null;
  description: string;
  website: string | null;
  email: string | null;
  phone: string | null;
  created_at?: string;
  opportunity_count: number;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  opportunity_count: number;
};

export type Opportunity = {
  id: string;
  title: string;
  slug: string;
  short_description: string;
  description?: string;
  organization: Organization;
  category: Category;
  opportunity_type: string;
  location: string;
  country: string;
  is_remote: boolean;
  deadline: string | null;
  start_date?: string | null;
  end_date?: string | null;
  image: string | null;
  tags: string[];
  skills: string[];
  education_levels?: string[];
  eligibility?: string;
  requirements?: string;
  benefits?: string;
  application_url?: string;
  featured: boolean;
  status: string;
  views: number;
  created_at: string;
  updated_at?: string;
  bookmarked: boolean;
  application_status: string | null;
  days_remaining: number | null;
  recommendation_reason?: string | null;
};

export type PageResult = {
  items: Opportunity[];
  total: number;
  page: number;
  page_size: number;
};

export type Application = {
  id: string;
  status: string;
  notes: string;
  applied_at: string | null;
  updated_at: string;
  opportunity: Opportunity;
};

export type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

export type HomePayload = {
  stats: { opportunities: number; organizations: number; students: number; platforms: number };
  latest: Opportunity[];
  closing_soon: Opportunity[];
  featured: Opportunity[];
  categories: Category[];
  organizations: Organization[];
  announcement: string;
};

export type SearchPayload = {
  query: string;
  opportunities: Opportunity[];
  organizations: Organization[];
  related_categories: Category[];
  suggestions: string[];
  total: number;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant" | string;
  content: string;
  opportunities: Opportunity[];
  created_at: string;
};

export type Conversation = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages?: ChatMessage[];
};

export const OPPORTUNITY_TYPES = [
  "SCHOLARSHIP",
  "JOB",
  "INTERNSHIP",
  "COURSE",
  "TRAINING",
  "HACKATHON",
  "COMPETITION",
  "FELLOWSHIP",
  "VOLUNTEERING",
  "EVENT",
] as const;

export const APPLICATION_STATUSES = ["SAVED", "PLANNED", "APPLIED", "INTERVIEW", "ACCEPTED", "REJECTED"] as const;

export const EDUCATION_LEVELS = ["High School", "Diploma", "Bachelor", "Master", "PhD"] as const;

export const INTERESTS = [
  "Software Engineering",
  "Artificial Intelligence",
  "Business",
  "Medicine",
  "Engineering",
  "Finance",
  "Design",
  "Education",
  "Agriculture",
  "Research",
] as const;

export const SKILL_OPTIONS = [
  "Python",
  "TypeScript",
  "React",
  "AI",
  "Communication",
  "Research",
  "Excel",
  "Finance",
  "Design",
  "Medicine",
  "Agriculture",
  "Education",
  "Engineering",
  "Leadership",
] as const;

export const LOCATION_OPTIONS = ["Hargeisa", "Somaliland", "Somalia", "Africa", "International", "Remote"] as const;

export const SUGGESTED_QUESTIONS = [
  "Find scholarships for software engineering students.",
  "What internships are available in Hargeisa?",
  "Show me opportunities closing this week.",
  "Which opportunities match my skills?",
  "I am a university student interested in AI. What should I apply for?",
  "Help me prepare for the Telesom internship.",
];
