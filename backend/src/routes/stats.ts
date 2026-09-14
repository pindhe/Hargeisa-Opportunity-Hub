import { Router } from "express";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../utils/asyncHandler";

export const statsRouter = Router();

export const CATEGORIES = [
  { id: "scholarship", label: "Scholarships", emoji: "🎓" },
  { id: "job", label: "Jobs", emoji: "💼" },
  { id: "internship", label: "Internships", emoji: "🧑‍💻" },
  { id: "course", label: "Courses", emoji: "📚" },
  { id: "training", label: "Training", emoji: "🧭" },
  { id: "competition", label: "Competitions", emoji: "🏆" },
  { id: "hackathon", label: "Hackathons", emoji: "⚡" },
];

statsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const now = new Date();
    const [
      opportunities,
      scholarships,
      internships,
      jobs,
      courses,
      competitions,
      organizations,
      users,
    ] = await Promise.all([
      prisma.opportunity.count({ where: { status: "published", deadline: { gte: now } } }),
      prisma.opportunity.count({ where: { status: "published", category: "scholarship", deadline: { gte: now } } }),
      prisma.opportunity.count({ where: { status: "published", category: "internship", deadline: { gte: now } } }),
      prisma.opportunity.count({ where: { status: "published", category: "job", deadline: { gte: now } } }),
      prisma.opportunity.count({
        where: { status: "published", category: { in: ["course", "training"] }, deadline: { gte: now } },
      }),
      prisma.opportunity.count({
        where: { status: "published", category: { in: ["competition", "hackathon"] }, deadline: { gte: now } },
      }),
      prisma.organization.count({ where: { status: "approved" } }),
      prisma.user.count(),
    ]);

    const byCategory = await Promise.all(
      CATEGORIES.map(async (cat) => ({
        ...cat,
        count: await prisma.opportunity.count({
          where: { status: "published", category: cat.id, deadline: { gte: now } },
        }),
      }))
    );

    res.json({
      opportunities,
      scholarships,
      internships,
      jobs,
      courses,
      competitions,
      organizations,
      users,
      byCategory,
    });
  })
);

statsRouter.get(
  "/filters",
  asyncHandler(async (_req, res) => {
    res.json({
      categories: CATEGORIES,
      locations: ["hargeisa", "somaliland", "somalia", "africa", "international", "remote"],
      educationLevels: ["high_school", "diploma", "bachelors", "masters", "phd"],
      fundingTypes: ["fully_funded", "partially_funded", "paid", "free", "unpaid"],
      opportunityTypes: ["online", "offline", "hybrid"],
      fields: [
        "Computer Science",
        "Software Engineering",
        "AI",
        "Business",
        "Accounting",
        "Economics",
        "Engineering",
        "Medicine",
        "Education",
        "Law",
        "Agriculture",
        "Social Sciences",
      ],
      deadlineWindows: ["today", "this_week", "this_month", "upcoming"],
    });
  })
);
