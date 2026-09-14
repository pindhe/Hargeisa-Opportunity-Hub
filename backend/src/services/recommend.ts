import type { Opportunity, User, UserProfile, UserSkill, UserInterest, Skill, Interest } from "@prisma/client";
import { parseJsonArray } from "../utils/deadline";

type ProfileBundle = User & {
  profile: UserProfile | null;
  skills: (UserSkill & { skill: Skill })[];
  interests: (UserInterest & { interest: Interest })[];
};

export type MatchResult = {
  score: number;
  reasons: string[];
};

function overlap(a: string[], b: string[]) {
  const setB = new Set(b.map((x) => x.toLowerCase()));
  return a.filter((x) => setB.has(x.toLowerCase()));
}

function includesLoose(haystack: string | null | undefined, needle: string | null | undefined) {
  if (!haystack || !needle) return false;
  return haystack.toLowerCase().includes(needle.toLowerCase()) || needle.toLowerCase().includes(haystack.toLowerCase());
}

export function scoreOpportunity(user: ProfileBundle, opportunity: Opportunity): MatchResult {
  const reasons: string[] = [];
  let education = 0;
  let field = 0;
  let skills = 0;
  let interest = 0;
  let location = 0;
  let experience = 0;

  const educationLevel = user.profile?.educationLevel;
  if (educationLevel && opportunity.educationLevel) {
    if (includesLoose(opportunity.educationLevel, educationLevel) || opportunity.educationLevel === "any") {
      education = 1;
      reasons.push(`Your education level (${educationLevel}) matches this opportunity.`);
    }
  } else if (!opportunity.educationLevel) {
    education = 0.5;
  }

  const userField = user.profile?.field;
  if (userField && opportunity.field && includesLoose(opportunity.field, userField)) {
    field = 1;
    reasons.push(`Your field of study (${userField}) aligns with ${opportunity.field}.`);
  } else if (userField && includesLoose(opportunity.title + " " + opportunity.description, userField)) {
    field = 0.6;
    reasons.push(`This opportunity is related to your field of study (${userField}).`);
  }

  const userSkills = user.skills.map((s) => s.skill.name);
  const oppSkills = parseJsonArray(opportunity.skills);
  const skillHits = overlap(userSkills, oppSkills.length ? oppSkills : (opportunity.title + " " + opportunity.description).split(/\W+/));
  if (userSkills.length) {
    skills = Math.min(1, skillHits.length / Math.max(2, Math.min(userSkills.length, 4)));
    if (skillHits.length) {
      reasons.push(`Recommended because you have ${skillHits.slice(0, 4).join(", ")} skills.`);
    }
  }

  const userInterests = user.interests.map((i) => i.interest.name);
  const blob = `${opportunity.title} ${opportunity.category} ${opportunity.field ?? ""} ${opportunity.description}`.toLowerCase();
  const interestHits = userInterests.filter((i) => blob.includes(i.toLowerCase()));
  if (userInterests.length) {
    interest = Math.min(1, interestHits.length / Math.max(1, Math.min(userInterests.length, 3)));
    if (interestHits.length) {
      reasons.push(`This matches your interest in ${interestHits.slice(0, 3).join(", ")}.`);
    }
  }

  const preferredLocations = parseJsonArray(user.profile?.preferredLocations);
  if (preferredLocations.length) {
    if (preferredLocations.some((loc) => includesLoose(opportunity.location, loc) || opportunity.location === "remote")) {
      location = 1;
      reasons.push(`The location (${opportunity.location}) matches your preferences.`);
    }
  } else if (user.location && includesLoose(opportunity.location, user.location)) {
    location = 1;
    reasons.push(`This opportunity is in ${opportunity.location}.`);
  }

  const preferredCategories = parseJsonArray(user.profile?.preferredCategories);
  if (preferredCategories.some((c) => c.toLowerCase() === opportunity.category.toLowerCase())) {
    experience = 1;
    reasons.push(`You selected ${opportunity.category} as a preferred category.`);
  } else {
    experience = 0.4;
  }

  const score =
    education * 20 +
    field * 25 +
    skills * 20 +
    interest * 15 +
    location * 10 +
    experience * 10;

  const rounded = Math.round(Math.min(99, Math.max(score, reasons.length ? 42 : 18)));
  if (!reasons.length) {
    reasons.push("Complete your profile to receive more accurate match explanations.");
  }

  return { score: rounded, reasons };
}

export function profileCompleteness(user: ProfileBundle) {
  const checks = [
    Boolean(user.profile?.educationLevel),
    Boolean(user.profile?.field),
    Boolean(user.skills.length),
    Boolean(user.interests.length),
    Boolean(user.profile?.careerGoals),
    Boolean(parseJsonArray(user.profile?.preferredLocations).length),
    Boolean(parseJsonArray(user.profile?.preferredCategories).length),
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}
