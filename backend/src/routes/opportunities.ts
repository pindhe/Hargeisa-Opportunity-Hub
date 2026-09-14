import { Router } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { serializeOpportunity } from "../lib/serialize";
import { asyncHandler } from "../utils/asyncHandler";
import { HttpError } from "../middleware/error";
import { optionalAuth, requireAuth } from "../middleware/auth";
import { parsePagination, paginated } from "../utils/pagination";
import { uniqueSlug } from "../lib/slug";
import { scoreOpportunity } from "../services/recommend";

export const opportunitiesRouter = Router();

const includeOrg = { organization: true, tags: true } as const;

function deadlineWindow(value?: string) {
  if (!value) return undefined;
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  if (value === "today") {
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { gte: start, lt: end };
  }
  if (value === "this_week") {
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return { gte: start, lte: end };
  }
  if (value === "this_month") {
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    return { gte: start, lte: end };
  }
  if (value === "upcoming") {
    return { gte: now };
  }
  return undefined;
}

opportunitiesRouter.get(
  "/",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { page, pageSize, skip, take } = parsePagination(req.query as Record<string, unknown>);
    const q = String(req.query.q ?? "").trim();
    const category = String(req.query.category ?? "").trim();
    const location = String(req.query.location ?? "").trim();
    const educationLevel = String(req.query.educationLevel ?? "").trim();
    const fundingType = String(req.query.fundingType ?? "").trim();
    const opportunityType = String(req.query.opportunityType ?? "").trim();
    const field = String(req.query.field ?? "").trim();
    const skill = String(req.query.skill ?? "").trim();
    const sort = String(req.query.sort ?? "recent");
    const featured = String(req.query.featured ?? "");
    const includeExpired = String(req.query.includeExpired ?? "") === "true";

    const where: Prisma.OpportunityWhereInput = {
      status: includeExpired ? { in: ["published", "expired"] } : "published",
      ...(includeExpired ? {} : { deadline: { gte: new Date() } }),
    };

    if (category) {
      const cats = category.split(",").map((c) => c.trim()).filter(Boolean);
      where.category = cats.length > 1 ? { in: cats } : cats[0];
    }
    if (location) where.location = location;
    if (educationLevel) where.educationLevel = educationLevel;
    if (fundingType) where.fundingType = fundingType;
    if (opportunityType) where.opportunityType = opportunityType;
    if (field) where.field = { contains: field };
    if (featured === "true") where.featured = true;
    const deadline = deadlineWindow(String(req.query.deadline ?? ""));
    if (deadline) where.deadline = { ...(where.deadline as object | undefined), ...deadline };

    if (q) {
      await prisma.searchLog.create({ data: { userId: req.user?.id ?? null, query: q } }).catch(() => undefined);
      where.OR = [
        { title: { contains: q } },
        { description: { contains: q } },
        { field: { contains: q } },
        { location: { contains: q } },
        { category: { contains: q } },
        { organization: { name: { contains: q } } },
        { tags: { some: { tag: { contains: q } } } },
        { skills: { contains: q } },
      ];
    }
    if (skill) {
      where.AND = [...((where.AND as unknown[]) ?? []), { skills: { contains: skill } }];
    }

    let orderBy: Prisma.OpportunityOrderByWithRelationInput | Prisma.OpportunityOrderByWithRelationInput[] = {
      createdAt: "desc",
    };
    if (sort === "deadline") orderBy = { deadline: "asc" };
    if (sort === "popular") orderBy = [{ viewCount: "desc" }, { createdAt: "desc" }];

    const [items, total] = await Promise.all([
      prisma.opportunity.findMany({
        where,
        include: includeOrg,
        orderBy,
        skip,
        take: sort === "recommended" ? 80 : take,
      }),
      prisma.opportunity.count({ where }),
    ]);

    let savedIds = new Set<number>();
    if (req.user) {
      const saved = await prisma.savedOpportunity.findMany({
        where: { userId: req.user.id, opportunityId: { in: items.map((i) => i.id) } },
        select: { opportunityId: true },
      });
      savedIds = new Set(saved.map((s) => s.opportunityId));
    }

    let serialized = items.map((item) => serializeOpportunity(item, { saved: savedIds.has(item.id) }));

    if (sort === "recommended" && req.user) {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: { profile: true, skills: { include: { skill: true } }, interests: { include: { interest: true } } },
      });
      if (user) {
        serialized = serialized
          .map((item, idx) => {
            const match = scoreOpportunity(user, items[idx]);
            return { ...item, matchScore: match.score, matchReasons: match.reasons };
          })
          .sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0))
          .slice(skip, skip + take);
      } else {
        serialized = serialized.slice(skip, skip + take);
      }
    }

    res.json(paginated(serialized, total, page, pageSize));
  })
);

opportunitiesRouter.get(
  "/featured",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const items = await prisma.opportunity.findMany({
      where: { status: "published", featured: true, deadline: { gte: new Date() } },
      include: includeOrg,
      orderBy: { updatedAt: "desc" },
      take: 6,
    });
    res.json({ items: items.map((item) => serializeOpportunity(item)) });
  })
);

opportunitiesRouter.get(
  "/upcoming",
  optionalAuth,
  asyncHandler(async (_req, res) => {
    const items = await prisma.opportunity.findMany({
      where: { status: "published", deadline: { gte: new Date() } },
      include: includeOrg,
      orderBy: { deadline: "asc" },
      take: 8,
    });
    res.json({ items: items.map((item) => serializeOpportunity(item)) });
  })
);

opportunitiesRouter.get(
  "/latest",
  optionalAuth,
  asyncHandler(async (_req, res) => {
    const items = await prisma.opportunity.findMany({
      where: { status: "published", deadline: { gte: new Date() } },
      include: includeOrg,
      orderBy: { createdAt: "desc" },
      take: 8,
    });
    res.json({ items: items.map((item) => serializeOpportunity(item)) });
  })
);

opportunitiesRouter.get(
  "/by-slug/:slug",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const opportunity = await prisma.opportunity.findUnique({
      where: { slug: req.params.slug },
      include: includeOrg,
    });
    if (!opportunity) throw new HttpError(404, "Opportunity not found.");
    if (!["published", "expired"].includes(opportunity.status) && req.user?.role !== "admin") {
      const isOwner = req.user?.organizationId === opportunity.organizationId;
      if (!isOwner) throw new HttpError(404, "Opportunity not found.");
    }

    await prisma.opportunity.update({
      where: { id: opportunity.id },
      data: { viewCount: { increment: 1 } },
    });

    let saved = false;
    if (req.user) {
      const row = await prisma.savedOpportunity.findUnique({
        where: { userId_opportunityId: { userId: req.user.id, opportunityId: opportunity.id } },
      });
      saved = Boolean(row);
    }
    res.json({ opportunity: serializeOpportunity(opportunity, { saved }) });
  })
);

const upsertSchema = z.object({
  title: z.string().min(4).max(180),
  category: z.enum(["scholarship", "job", "internship", "course", "training", "competition", "hackathon"]),
  description: z.string().min(20),
  requirements: z.string().optional(),
  benefits: z.string().optional(),
  applicationProcess: z.string().optional(),
  requiredDocuments: z.array(z.string()).optional(),
  location: z.string().min(2),
  opportunityType: z.enum(["online", "offline", "hybrid"]).default("offline"),
  fundingType: z.enum(["fully_funded", "partially_funded", "paid", "free", "unpaid"]).optional(),
  educationLevel: z.string().optional(),
  field: z.string().optional(),
  skills: z.array(z.string()).optional(),
  openingDate: z.string().datetime().optional(),
  deadline: z.string().datetime(),
  interviewDate: z.string().datetime().optional(),
  resultDate: z.string().datetime().optional(),
  applicationUrl: z.string().url().optional().or(z.literal("")),
  applicationMode: z.enum(["external", "internal"]).default("external"),
  contactEmail: z.string().email().optional().or(z.literal("")),
  tags: z.array(z.string()).optional(),
});

opportunitiesRouter.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!["organization", "admin"].includes(req.user!.role)) {
      throw new HttpError(403, "Only organizations and admins can publish opportunities.");
    }
    const data = upsertSchema.parse(req.body);
    const organizationId =
      req.user!.role === "admin" && req.body.organizationId
        ? Number(req.body.organizationId)
        : req.user!.organizationId;
    if (!organizationId) throw new HttpError(400, "No organization is linked to this account.");

    const slug = await uniqueSlug(data.title);
    const opportunity = await prisma.opportunity.create({
      data: {
        organizationId,
        title: data.title,
        slug,
        category: data.category,
        description: data.description,
        requirements: data.requirements,
        benefits: data.benefits,
        applicationProcess: data.applicationProcess,
        requiredDocuments: JSON.stringify(data.requiredDocuments ?? []),
        location: data.location,
        opportunityType: data.opportunityType,
        fundingType: data.fundingType,
        educationLevel: data.educationLevel,
        field: data.field,
        skills: JSON.stringify(data.skills ?? []),
        openingDate: data.openingDate ? new Date(data.openingDate) : new Date(),
        deadline: new Date(data.deadline),
        interviewDate: data.interviewDate ? new Date(data.interviewDate) : null,
        resultDate: data.resultDate ? new Date(data.resultDate) : null,
        applicationUrl: data.applicationUrl || null,
        applicationMode: data.applicationMode,
        contactEmail: data.contactEmail || null,
        status: req.user!.role === "admin" ? "published" : "pending",
        verified: req.user!.role === "admin",
        tags: { create: (data.tags ?? []).map((tag) => ({ tag })) },
      },
      include: includeOrg,
    });
    res.status(201).json({
      opportunity: serializeOpportunity(opportunity),
      message:
        req.user!.role === "admin"
          ? "Opportunity published."
          : "Opportunity submitted and is pending admin review.",
    });
  })
);

opportunitiesRouter.put(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const existing = await prisma.opportunity.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, "Opportunity not found.");
    const isOwner = req.user!.organizationId === existing.organizationId;
    if (req.user!.role !== "admin" && !isOwner) {
      throw new HttpError(403, "You do not have permission to edit this opportunity.");
    }
    const data = upsertSchema.partial().parse(req.body);
    const opportunity = await prisma.opportunity.update({
      where: { id },
      data: {
        title: data.title,
        category: data.category,
        description: data.description,
        requirements: data.requirements,
        benefits: data.benefits,
        applicationProcess: data.applicationProcess,
        location: data.location,
        opportunityType: data.opportunityType,
        fundingType: data.fundingType,
        educationLevel: data.educationLevel,
        field: data.field,
        applicationUrl: data.applicationUrl || undefined,
        applicationMode: data.applicationMode,
        contactEmail: data.contactEmail || undefined,
        requiredDocuments: data.requiredDocuments ? JSON.stringify(data.requiredDocuments) : undefined,
        skills: data.skills ? JSON.stringify(data.skills) : undefined,
        openingDate: data.openingDate ? new Date(data.openingDate) : undefined,
        deadline: data.deadline ? new Date(data.deadline) : undefined,
        interviewDate: data.interviewDate ? new Date(data.interviewDate) : undefined,
        resultDate: data.resultDate ? new Date(data.resultDate) : undefined,
        status: req.user!.role === "admin" ? existing.status : "pending",
        tags: data.tags
          ? { deleteMany: {}, create: data.tags.map((tag) => ({ tag })) }
          : undefined,
      },
      include: includeOrg,
    });
    res.json({ opportunity: serializeOpportunity(opportunity) });
  })
);
