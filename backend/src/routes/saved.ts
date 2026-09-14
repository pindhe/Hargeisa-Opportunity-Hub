import { Router } from "express";
import { prisma } from "../lib/prisma";
import { serializeOpportunity } from "../lib/serialize";
import { asyncHandler } from "../utils/asyncHandler";
import { HttpError } from "../middleware/error";
import { requireAuth } from "../middleware/auth";

export const savedRouter = Router();

savedRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const category = String(req.query.category ?? "");
    const sort = String(req.query.sort ?? "deadline");
    const rows = await prisma.savedOpportunity.findMany({
      where: {
        userId: req.user!.id,
        ...(category ? { opportunity: { category } } : {}),
      },
      include: { opportunity: { include: { organization: true, tags: true } } },
      orderBy:
        sort === "recent"
          ? { createdAt: "desc" }
          : { opportunity: { deadline: "asc" } },
    });
    res.json({
      items: rows.map((row) => ({
        savedAt: row.createdAt,
        opportunity: serializeOpportunity(row.opportunity, { saved: true }),
      })),
    });
  })
);

savedRouter.post(
  "/:opportunityId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const opportunityId = Number(req.params.opportunityId);
    const opportunity = await prisma.opportunity.findUnique({ where: { id: opportunityId } });
    if (!opportunity) throw new HttpError(404, "Opportunity not found.");
    await prisma.savedOpportunity.upsert({
      where: { userId_opportunityId: { userId: req.user!.id, opportunityId } },
      update: {},
      create: { userId: req.user!.id, opportunityId },
    });
    res.json({ saved: true });
  })
);

savedRouter.delete(
  "/:opportunityId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const opportunityId = Number(req.params.opportunityId);
    await prisma.savedOpportunity.deleteMany({
      where: { userId: req.user!.id, opportunityId },
    });
    res.json({ saved: false });
  })
);
