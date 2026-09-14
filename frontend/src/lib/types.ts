export type Role = "student" | "job_seeker" | "organization" | "admin";

export type DeadlineTone = "green" | "yellow" | "red" | "gray";

export type OrganizationSummary = {
  id: number;
  name: string;
  slug: string;
  logo: string | null;
  verified: boolean;
  location: string | null;
  isSample: boolean;
};

export type Opportunity = {
  id: number;
  title: string;
  slug: string;
  category: string;
  description: string;
  requirements?: string | null;
  benefits?: string | null;
  applicationProcess?: string | null;
  requiredDocuments: string[];
  importantDates: Record<string, unknown>;
  location: string;
  opportunityType: string;
  fundingType?: string | null;
  educationLevel?: string | null;
  field?: string | null;
  skills: string[];
  openingDate?: string | null;
  deadline: string;
  interviewDate?: string | null;
  resultDate?: string | null;
  applicationUrl?: string | null;
  applicationMode: string;
  contactEmail?: string | null;
  status: string;
  lifecycle: string;
  deadlineTone: DeadlineTone;
  featured: boolean;
  verified: boolean;
  isSample: boolean;
  viewCount: number;
  createdAt: string;
  tags: string[];
  organization: OrganizationSummary;
  saved?: boolean;
  matchScore?: number;
  matchReasons?: string[];
  explanation?: string;
};

export type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type Paginated<T> = {
  items: T[];
  pagination: Pagination;
};

export type User = {
  id: number;
  name: string;
  email: string;
  role: Role;
  profileImage: string | null;
  location: string | null;
  phone?: string | null;
  emailVerified: boolean;
  locale: string;
  organizationId: number | null;
  skills?: string[];
  interests?: string[];
  completeness?: number;
  profile?: {
    educationLevel?: string | null;
    university?: string | null;
    degree?: string | null;
    field?: string | null;
    graduationYear?: number | null;
    gpa?: string | null;
    careerGoals?: string | null;
    preferredLocations?: string[];
    preferredCategories?: string[];
    emailNotifications?: boolean;
    inAppNotifications?: boolean;
    browserNotifications?: boolean;
    deadlineReminders?: boolean;
    recommendationEmails?: boolean;
  } | null;
  languages?: { language: string; level: string }[];
  experiences?: {
    id: number;
    organization: string;
    position: string;
    startDate: string;
    endDate?: string | null;
    description?: string | null;
  }[];
};

export type NotificationItem = {
  id: number;
  title: string;
  message: string;
  type: string;
  read: boolean;
  link?: string | null;
  createdAt: string;
};

export type ApplicationItem = {
  id: number;
  status: string;
  appliedAt?: string | null;
  notes?: string | null;
  createdAt: string;
  opportunity: Opportunity;
};
