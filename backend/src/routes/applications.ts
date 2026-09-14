import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { serializeOpportunity } from "../lib/serialize";
import { asyncHandler } from "../utils/asyncHandler";
import { HttpError } from "../middleware/error";
import { requireAuth } from "../middleware/auth";

export const applicationsRouter = Router();

const statuses = ["planning", "applied", "shortlisted", "interview", "accepted", "rejected"] as const;

applicationsRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const status = String(req.query.status ?? "");
    const rows = await prisma.application.findMany({
      where: {
        userId: req.user!.id,
        ...(status ? { status } : {}),
      },
      include: { opportunity: { include: { organization: true, tags: true } } },
      orderBy: { updatedAt: "desc" },
    });
    res.json({
      items: rows.map((row) => ({
        id: row.id,
        status: row.status,
        appliedAt: row.appliedAt,
        notes: row.notes,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        opportunity: serializeOpportunity(row.opportunity),
      })),
    });
  })
);

applicationsRouter.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const data = z
      .object({
        opportunityId: z.number(),
        status: z.enum(statuses).default("planning"),
        notes: z.string().max(2000).optional(),
      })
      .parse(req.body);
    const opportunity = await prisma.opportunity.findUnique({ where: { id: data.opportunityId } });
    if (!opportunity) throw new HttpError(404, "Opportunity not found.");
    const row = await prisma.application.upsert({
      where: { userId_opportunityId: { userId: req.user!.id, opportunityId: data.opportunityId } },
      update: {
        status: data.status,
        notes: data.notes,
        appliedAt: data.status === "applied" ? new Date() : undefined,
      },
      create: {
        userId: req.user!.id,
        opportunityId: data.opportunityId,
        status: data.status,
        notes: data.notes,
        appliedAt: data.status === "applied" ? new Date() : null,
      },
      include: { opportunity: { include: { organization: true, tags: true } } },
    });
    res.status(201).json({
      application: {
        id: row.id,
        status: row.status,
        appliedAt: row.appliedAt,
        notes: row.notes,
        opportunity: serializeOpportunity(row.opportunity),
      },
    });
  })
);

applicationsRouter.patch(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const data = z
      .object({
        status: z.enum(statuses).optional(),
        notes: z.string().max(2000).optional(),
      })
      .parse(req.body);
    const existing = await prisma.application.findUnique({ where: { id } });
    if (!existing || existing.userId !== req.user!.id) throw new HttpError(404, "Application not found.");
    const row = await prisma.application.update({
      where: { id },
      data: {
        ...data,
        appliedAt:
          data.status === "applied" && !existing.appliedAt ? new Date() : existing.appliedAt,
      },
      include: { opportunity: { include: { organization: true, tags: true } } },
    });
    res.json({
      application: {
        id: row.id,
        status: row.status,
        appliedAt: row.appliedAt,
        notes: row.notes,
        opportunity: serializeOpportunity(row.opportunity),
      },
    });
  })
);
