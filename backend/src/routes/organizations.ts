import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { serializeOpportunity } from "../lib/serialize";
import { asyncHandler } from "../utils/asyncHandler";
import { HttpError } from "../middleware/error";
import { optionalAuth, requireAuth } from "../middleware/auth";
import { uniqueOrgSlug } from "../lib/slug";

export const organizationsRouter = Router();

organizationsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const items = await prisma.organization.findMany({
      where: { status: { in: ["approved", "pending"] } },
      orderBy: { name: "asc" },
      include: { _count: { select: { opportunities: true } } },
    });
    res.json({
      items: items.map((org) => ({
        id: org.id,
        name: org.name,
        slug: org.slug,
        logo: org.logo,
        description: org.description,
        website: org.website,
        location: org.location,
        verified: org.verified,
        status: org.status,
        isSample: org.isSample,
        opportunityCount: org._count.opportunities,
      })),
    });
  })
);

organizationsRouter.get(
  "/:slug",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const org = await prisma.organization.findUnique({
      where: { slug: req.params.slug },
      include: {
        opportunities: {
          where: { status: "published", deadline: { gte: new Date() } },
          include: { organization: true, tags: true },
          orderBy: { deadline: "asc" },
        },
      },
    });
    if (!org) throw new HttpError(404, "Organization not found.");
    res.json({
      organization: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        logo: org.logo,
        description: org.description,
        website: org.website,
        location: org.location,
        email: org.verified ? org.email : undefined,
        verified: org.verified,
        status: org.status,
        isSample: org.isSample,
        opportunities: org.opportunities.map((o) => serializeOpportunity(o)),
      },
    });
  })
);

organizationsRouter.put(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (req.user!.role !== "organization" && req.user!.role !== "admin") {
      throw new HttpError(403, "Only organization accounts can update this profile.");
    }
    if (!req.user!.organizationId) throw new HttpError(400, "No organization is linked to this account.");
    const data = z
      .object({
        name: z.string().min(2).max(160).optional(),
        description: z.string().optional(),
        website: z.string().url().optional().or(z.literal("")),
        location: z.string().optional(),
        email: z.string().email().optional(),
        logo: z.string().optional(),
      })
      .parse(req.body);
    const org = await prisma.organization.update({
      where: { id: req.user!.organizationId },
      data: {
        ...data,
        slug: data.name ? await uniqueOrgSlug(data.name) : undefined,
      },
    });
    res.json({ organization: org });
  })
);
