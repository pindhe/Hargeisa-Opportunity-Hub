import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { HttpError } from "../middleware/error";
import { requireAuth } from "../middleware/auth";

export const reportsRouter = Router();

reportsRouter.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const data = z
      .object({
        opportunityId: z.number(),
        reason: z.enum([
          "fake",
          "incorrect",
          "expired",
          "scam",
          "broken_link",
          "other",
        ]),
        description: z.string().max(2000).optional(),
      })
      .parse(req.body);
    const opportunity = await prisma.opportunity.findUnique({ where: { id: data.opportunityId } });
    if (!opportunity) throw new HttpError(404, "Opportunity not found.");
    const report = await prisma.report.create({
      data: {
        userId: req.user!.id,
        opportunityId: data.opportunityId,
        reason: data.reason,
        description: data.description,
      },
    });
    res.status(201).json({ report, message: "Thank you. Our team will review this report." });
  })
);
