import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { serializeOpportunity, publicUser } from "../lib/serialize";
import { asyncHandler } from "../utils/asyncHandler";
import { HttpError } from "../middleware/error";
import { requireAuth, requireRoles } from "../middleware/auth";
import { parsePagination, paginated } from "../utils/pagination";
import { sendMail } from "../lib/mail";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRoles("admin"));

adminRouter.get(
  "/analytics",
  asyncHandler(async (_req, res) => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const [
      totalUsers,
      activeUsers,
      totalOpportunities,
      pendingOpportunities,
      expiredOpportunities,
      organizations,
      applications,
      byCategory,
      searches,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { lastLoginAt: { gte: weekAgo } } }),
      prisma.opportunity.count(),
      prisma.opportunity.count({ where: { status: "pending" } }),
      prisma.opportunity.count({ where: { status: "expired" } }),
      prisma.organization.count(),
      prisma.application.count(),
      prisma.opportunity.groupBy({ by: ["category"], _count: { _all: true } }),
      prisma.searchLog.findMany({ orderBy: { createdAt: "desc" }, take: 40 }),
    ]);

    const months: { month: string; count: number }[] = [];
    for (let i = 5; i >= 0; i -= 1) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const count = await prisma.opportunity.count({
        where: { createdAt: { gte: start, lt: end } },
      });
      months.push({
        month: start.toLocaleString("en-GB", { month: "short", year: "numeric" }),
        count,
      });
    }

    const userMonths: { month: string; count: number }[] = [];
    for (let i = 5; i >= 0; i -= 1) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const count = await prisma.user.count({ where: { createdAt: { gte: start, lt: end } } });
      userMonths.push({
        month: start.toLocaleString("en-GB", { month: "short", year: "numeric" }),
        count,
      });
    }

    const popular = await prisma.opportunity.findMany({
      orderBy: [{ viewCount: "desc" }],
      take: 5,
      include: { organization: true, tags: true },
    });

    const mostSaved = await prisma.savedOpportunity.groupBy({
      by: ["opportunityId"],
      _count: { _all: true },
      orderBy: { _count: { opportunityId: "desc" } },
      take: 5,
    });

    res.json({
      totals: {
        totalUsers,
        activeUsers,
        totalOpportunities,
        pendingOpportunities,
        expiredOpportunities,
        organizations,
        applications,
      },
      byCategory: byCategory.map((row) => ({ category: row.category, count: row._count._all })),
      opportunitiesByMonth: months,
      usersByMonth: userMonths,
      mostViewed: popular.map((o) => serializeOpportunity(o)),
      mostSaved,
      searchTrends: searches.map((s) => s.query),
    });
  })
);

adminRouter.get(
  "/users",
  asyncHandler(async (req, res) => {
    const { page, pageSize, skip, take } = parsePagination(req.query as Record<string, unknown>);
    const q = String(req.query.q ?? "");
    const where = q
      ? { OR: [{ name: { contains: q } }, { email: { contains: q } }] }
      : {};
    const [items, total] = await Promise.all([
      prisma.user.findMany({ where, skip, take, orderBy: { createdAt: "desc" } }),
      prisma.user.count({ where }),
    ]);
    res.json(paginated(items.map(publicUser), total, page, pageSize));
  })
);

adminRouter.patch(
  "/users/:id",
  asyncHandler(async (req, res) => {
    const data = z.object({ role: z.enum(["student", "job_seeker", "organization", "admin"]).optional() }).parse(req.body);
    const user = await prisma.user.update({ where: { id: Number(req.params.id) }, data });
    res.json({ user: publicUser(user) });
  })
);

adminRouter.get(
  "/organizations",
  asyncHandler(async (_req, res) => {
    const items = await prisma.organization.findMany({ orderBy: { createdAt: "desc" } });
    res.json({ items });
  })
);

adminRouter.patch(
  "/organizations/:id",
  asyncHandler(async (req, res) => {
    const data = z
      .object({
        status: z.enum(["pending", "approved", "rejected"]).optional(),
        verified: z.boolean().optional(),
      })
      .parse(req.body);
    const org = await prisma.organization.update({
      where: { id: Number(req.params.id) },
      data,
    });
    if (data.status === "approved") {
      const owner = await prisma.user.findFirst({ where: { organizationId: org.id } });
      if (owner) {
        await prisma.notification.create({
          data: {
            userId: owner.id,
            title: "Organization approved",
            message: `${org.name} has been approved and can publish opportunities.`,
            type: "organization",
          },
        });
        await sendMail({
          to: owner.email,
          subject: "Your organization was approved",
          text: `${org.name} has been approved on Hargeisa Opportunity Hub.`,
          html: `<p>${org.name} has been approved. You can now submit opportunities for review.</p>`,
        });
      }
    }
    res.json({ organization: org });
  })
);

adminRouter.get(
  "/opportunities",
  asyncHandler(async (req, res) => {
    const status = String(req.query.status ?? "");
    const { page, pageSize, skip, take } = parsePagination(req.query as Record<string, unknown>);
    const where = status ? { status } : {};
    const [items, total] = await Promise.all([
      prisma.opportunity.findMany({
        where,
        include: { organization: true, tags: true },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.opportunity.count({ where }),
    ]);
    res.json(paginated(items.map((i) => serializeOpportunity(i)), total, page, pageSize));
  })
);

adminRouter.patch(
  "/opportunities/:id",
  asyncHandler(async (req, res) => {
    const data = z
      .object({
        status: z.enum(["pending", "published", "rejected", "expired", "archived"]).optional(),
        featured: z.boolean().optional(),
        verified: z.boolean().optional(),
      })
      .parse(req.body);
    const opportunity = await prisma.opportunity.update({
      where: { id: Number(req.params.id) },
      data,
      include: { organization: true, tags: true },
    });
    res.json({ opportunity: serializeOpportunity(opportunity) });
  })
);

adminRouter.delete(
  "/opportunities/:id",
  asyncHandler(async (req, res) => {
    await prisma.opportunity.delete({ where: { id: Number(req.params.id) } });
    res.json({ ok: true });
  })
);

adminRouter.get(
  "/reports",
  asyncHandler(async (_req, res) => {
    const items = await prisma.report.findMany({
      include: { user: true, opportunity: true },
      orderBy: { createdAt: "desc" },
    });
    res.json({
      items: items.map((r) => ({
        id: r.id,
        reason: r.reason,
        description: r.description,
        status: r.status,
        createdAt: r.createdAt,
        user: { id: r.user.id, name: r.user.name, email: r.user.email },
        opportunity: { id: r.opportunity.id, title: r.opportunity.title, slug: r.opportunity.slug },
      })),
    });
  })
);

adminRouter.patch(
  "/reports/:id",
  asyncHandler(async (req, res) => {
    const { status } = z.object({ status: z.enum(["open", "reviewed", "resolved"] ) }).parse(req.body);
    const report = await prisma.report.update({ where: { id: Number(req.params.id) }, data: { status } });
    res.json({ report });
  })
);

adminRouter.post(
  "/notifications",
  asyncHandler(async (req, res) => {
    const data = z
      .object({
        title: z.string().min(3),
        message: z.string().min(3),
        userId: z.number().optional(),
      })
      .parse(req.body);
    if (data.userId) {
      await prisma.notification.create({
        data: { userId: data.userId, title: data.title, message: data.message, type: "admin" },
      });
    } else {
      const users = await prisma.user.findMany({ select: { id: true } });
      await prisma.notification.createMany({
        data: users.map((u) => ({
          userId: u.id,
          title: data.title,
          message: data.message,
          type: "admin",
        })),
      });
    }
    res.json({ ok: true });
  })
);

adminRouter.get(
  "/settings",
  asyncHandler(async (_req, res) => {
    const rows = await prisma.platformSetting.findMany();
    res.json({
      settings: Object.fromEntries(rows.map((r) => [r.key, r.value])),
    });
  })
);

adminRouter.put(
  "/settings",
  asyncHandler(async (req, res) => {
    const data = z.record(z.string(), z.string()).parse(req.body);
    for (const [key, value] of Object.entries(data)) {
      await prisma.platformSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
    }
    res.json({ ok: true });
  })
);

adminRouter.get(
  "/applications",
  asyncHandler(async (_req, res) => {
    const items = await prisma.application.findMany({
      include: { user: true, opportunity: { include: { organization: true, tags: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    res.json({
      items: items.map((a) => ({
        id: a.id,
        status: a.status,
        appliedAt: a.appliedAt,
        user: { id: a.user.id, name: a.user.name, email: a.user.email },
        opportunity: serializeOpportunity(a.opportunity),
      })),
    });
  })
);
