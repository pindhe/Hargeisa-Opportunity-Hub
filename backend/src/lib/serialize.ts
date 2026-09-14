import type { Opportunity, Organization } from "@prisma/client";
import { getDeadlineTone, getLifecycleStatus, parseJsonArray, parseJsonObject } from "../utils/deadline";

type OpportunityWithOrg = Opportunity & { organization: Organization; tags?: { tag: string }[] };

export function serializeOpportunity(
  opportunity: OpportunityWithOrg,
  extras?: { saved?: boolean; matchScore?: number; matchReasons?: string[] }
) {
  const now = new Date();
  return {
    id: opportunity.id,
    title: opportunity.title,
    slug: opportunity.slug,
    category: opportunity.category,
    description: opportunity.description,
    requirements: opportunity.requirements,
    benefits: opportunity.benefits,
    applicationProcess: opportunity.applicationProcess,
    requiredDocuments: parseJsonArray(opportunity.requiredDocuments),
    importantDates: parseJsonObject(opportunity.importantDates),
    location: opportunity.location,
    opportunityType: opportunity.opportunityType,
    fundingType: opportunity.fundingType,
    educationLevel: opportunity.educationLevel,
    field: opportunity.field,
    skills: parseJsonArray(opportunity.skills),
    openingDate: opportunity.openingDate,
    deadline: opportunity.deadline,
    interviewDate: opportunity.interviewDate,
    resultDate: opportunity.resultDate,
    applicationUrl: opportunity.applicationUrl,
    applicationMode: opportunity.applicationMode,
    contactEmail: opportunity.contactEmail,
    status: opportunity.status,
    lifecycle: getLifecycleStatus(opportunity.deadline, opportunity.status, now),
    deadlineTone: getDeadlineTone(opportunity.deadline, now),
    featured: opportunity.featured,
    verified: opportunity.verified,
    isSample: opportunity.isSample,
    viewCount: opportunity.viewCount,
    createdAt: opportunity.createdAt,
    updatedAt: opportunity.updatedAt,
    tags: (opportunity.tags ?? []).map((t) => t.tag),
    organization: {
      id: opportunity.organization.id,
      name: opportunity.organization.name,
      slug: opportunity.organization.slug,
      logo: opportunity.organization.logo,
      verified: opportunity.organization.verified,
      location: opportunity.organization.location,
      isSample: opportunity.organization.isSample,
    },
    saved: extras?.saved ?? false,
    matchScore: extras?.matchScore,
    matchReasons: extras?.matchReasons,
  };
}

export function publicUser(user: {
  id: number;
  name: string;
  email: string;
  role: string;
  profileImage: string | null;
  location: string | null;
  phone?: string | null;
  emailVerified: boolean;
  locale: string;
  organizationId: number | null;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    profileImage: user.profileImage,
    location: user.location,
    phone: user.phone ?? null,
    emailVerified: user.emailVerified,
    locale: user.locale,
    organizationId: user.organizationId,
  };
}
