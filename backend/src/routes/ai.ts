import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { serializeOpportunity } from "../lib/serialize";
import { asyncHandler } from "../utils/asyncHandler";
import { HttpError } from "../middleware/error";
import { requireAuth } from "../middleware/auth";
import { generateAiText } from "../services/ai";
import { profileCompleteness, scoreOpportunity } from "../services/recommend";
import { parseJsonArray } from "../utils/deadline";

export const aiRouter = Router();

async function loadUserBundle(userId: number) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      skills: { include: { skill: true } },
      interests: { include: { interest: true } },
      experiences: true,
      languages: true,
    },
  });
}

aiRouter.get(
  "/recommendations",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await loadUserBundle(req.user!.id);
    if (!user) throw new HttpError(404, "User not found.");
    const completeness = profileCompleteness(user);
    const opportunities = await prisma.opportunity.findMany({
      where: { status: "published", deadline: { gte: new Date() } },
      include: { organization: true, tags: true },
      take: 80,
    });
    const ranked = opportunities
      .map((opportunity) => {
        const match = scoreOpportunity(user, opportunity);
        return {
          opportunity: serializeOpportunity(opportunity, {
            matchScore: match.score,
            matchReasons: match.reasons,
          }),
          match,
        };
      })
      .sort((a, b) => b.match.score - a.match.score)
      .slice(0, 8);

    const explanations = await Promise.all(
      ranked.map(async (row) => {
        const text = await generateAiText([
          {
            role: "system",
            content:
              "You write one short sentence explaining why an opportunity matches a student profile. Never invent facts. Use only provided profile and opportunity data. Do not claim guaranteed eligibility.",
          },
          {
            role: "user",
            content: JSON.stringify({
              profile: {
                field: user.profile?.field,
                educationLevel: user.profile?.educationLevel,
                skills: user.skills.map((s) => s.skill.name),
                interests: user.interests.map((i) => i.interest.name),
              },
              opportunity: { title: row.opportunity.title, category: row.opportunity.category, field: row.opportunity.field },
              reasons: row.match.reasons,
            }),
          },
        ]);
        return text || row.match.reasons[0];
      })
    );

    res.json({
      completeness,
      items: ranked.map((row, i) => ({
        ...row.opportunity,
        matchScore: row.match.score,
        matchReasons: row.match.reasons,
        explanation: explanations[i],
      })),
    });
  })
);

aiRouter.post(
  "/eligibility",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { opportunityId } = z.object({ opportunityId: z.number() }).parse(req.body);
    const [user, opportunity] = await Promise.all([
      loadUserBundle(req.user!.id),
      prisma.opportunity.findUnique({ where: { id: opportunityId }, include: { organization: true, tags: true } }),
    ]);
    if (!user) throw new HttpError(404, "User not found.");
    if (!opportunity) throw new HttpError(404, "Opportunity not found.");

    const checks: { label: string; status: "pass" | "warn" | "fail"; detail: string }[] = [];
    if (opportunity.educationLevel) {
      const ok =
        user.profile?.educationLevel &&
        opportunity.educationLevel.toLowerCase().includes(user.profile.educationLevel.toLowerCase().split("_")[0]);
      checks.push({
        label: "Education level",
        status: ok ? "pass" : user.profile?.educationLevel ? "fail" : "warn",
        detail: ok
          ? "Your education level matches."
          : user.profile?.educationLevel
            ? `This opportunity asks for ${opportunity.educationLevel.replaceAll("_", " ")}, and your profile lists ${user.profile.educationLevel.replaceAll("_", " ")}.`
            : "Add your education level for a better estimate.",
      });
    }
    if (opportunity.field) {
      const ok = user.profile?.field && opportunity.field.toLowerCase().includes(user.profile.field.toLowerCase());
      checks.push({
        label: "Field of study",
        status: ok ? "pass" : user.profile?.field ? "warn" : "warn",
        detail: ok
          ? "Your field of study matches."
          : user.profile?.field
            ? `This opportunity is in ${opportunity.field}. Your profile lists ${user.profile.field}.`
            : "Add your field of study to check this requirement.",
      });
    }
    const requiredSkills = parseJsonArray(opportunity.skills);
    if (requiredSkills.length) {
      const have = user.skills.map((s) => s.skill.name.toLowerCase());
      const missing = requiredSkills.filter((s) => !have.includes(s.toLowerCase()));
      checks.push({
        label: "Skills",
        status: missing.length === 0 ? "pass" : missing.length < requiredSkills.length ? "warn" : "fail",
        detail:
          missing.length === 0
            ? "Your listed skills match the opportunity."
            : `Your profile does not list: ${missing.join(", ")}.`,
      });
    }
    if (opportunity.requirements?.toLowerCase().includes("ielts") && !JSON.stringify(user).toLowerCase().includes("ielts")) {
      checks.push({
        label: "Language test",
        status: "warn",
        detail: "This opportunity mentions IELTS, but your profile does not contain IELTS information.",
      });
    }

    const fails = checks.filter((c) => c.status === "fail").length;
    const warns = checks.filter((c) => c.status === "warn").length;
    const verdict = fails ? "may_not_be_eligible" : warns ? "needs_more_information" : "likely_eligible";

    const aiSummary = await generateAiText([
      {
        role: "system",
        content:
          "You are HOH AI. Compare a user profile against opportunity requirements. Return 2-4 short sentences. This is an estimate, never a guarantee. Do not invent missing facts.",
      },
      {
        role: "user",
        content: JSON.stringify({
          verdict,
          checks,
          opportunity: { title: opportunity.title, requirements: opportunity.requirements, educationLevel: opportunity.educationLevel, field: opportunity.field },
          profile: { educationLevel: user.profile?.educationLevel, field: user.profile?.field, skills: user.skills.map((s) => s.skill.name) },
        }),
      },
    ]);

    res.json({
      verdict,
      label:
        verdict === "likely_eligible"
          ? "Likely Eligible"
          : verdict === "may_not_be_eligible"
            ? "May Not Be Eligible"
            : "Needs More Information",
      disclaimer: "This is an estimate based on your profile. It is not a guarantee of eligibility.",
      checks,
      summary:
        aiSummary ||
        checks.map((c) => c.detail).join(" "),
      opportunity: serializeOpportunity(opportunity),
    });
  })
);

aiRouter.post(
  "/chat",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { message, opportunityId } = z
      .object({ message: z.string().min(2).max(2000), opportunityId: z.number().optional() })
      .parse(req.body);

    const user = await loadUserBundle(req.user!.id);
    const now = new Date();
    const week = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const keywords = message
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length > 3)
      .slice(0, 6);

    const related = await prisma.opportunity.findMany({
      where: {
        status: "published",
        deadline: { gte: now },
        OR: keywords.length
          ? keywords.map((word) => ({
              OR: [
                { title: { contains: word } },
                { description: { contains: word } },
                { category: { contains: word } },
                { field: { contains: word } },
                { skills: { contains: word } },
              ],
            }))
          : undefined,
      },
      include: { organization: true, tags: true },
      take: 8,
      orderBy: { deadline: "asc" },
    });

    const closingSoon = message.toLowerCase().includes("this week") || message.toLowerCase().includes("closing")
      ? await prisma.opportunity.findMany({
          where: { status: "published", deadline: { gte: now, lte: week } },
          include: { organization: true, tags: true },
          orderBy: { deadline: "asc" },
          take: 8,
        })
      : [];

    const focus = opportunityId
      ? await prisma.opportunity.findUnique({ where: { id: opportunityId }, include: { organization: true, tags: true } })
      : null;

    const catalog = [...(focus ? [focus] : []), ...related, ...closingSoon]
      .filter((item, idx, arr) => arr.findIndex((x) => x.id === item.id) === idx)
      .slice(0, 10)
      .map((o) => ({
        id: o.id,
        slug: o.slug,
        title: o.title,
        category: o.category,
        location: o.location,
        deadline: o.deadline,
        fundingType: o.fundingType,
        educationLevel: o.educationLevel,
        field: o.field,
        requirements: o.requirements,
        requiredDocuments: parseJsonArray(o.requiredDocuments),
        organization: o.organization.name,
        isSample: o.isSample,
      }));

    const system = `You are HOH AI, the career assistant for Hargeisa Opportunity Hub.
Rules:
- Only use the provided opportunity catalog and user profile. Never invent opportunities, deadlines, funding, or requirements.
- If the catalog is empty, say you could not find matching opportunities on the platform.
- Clearly mark sample/demo opportunities as sample data.
- Eligibility answers are estimates, never guarantees.
- Be concise, practical, and supportive for students in Hargeisa, Somaliland.
- If asked for opportunities closing this week, use only catalog items whose deadline is within 7 days.`;

    const reply = await generateAiText([
      { role: "system", content: system },
      {
        role: "user",
        content: JSON.stringify({
          question: message,
          profile: user
            ? {
                name: user.name,
                educationLevel: user.profile?.educationLevel,
                field: user.profile?.field,
                skills: user.skills.map((s) => s.skill.name),
                interests: user.interests.map((i) => i.interest.name),
                careerGoals: user.profile?.careerGoals,
              }
            : null,
          catalog,
        }),
      },
    ]);

    const fallback =
      catalog.length === 0
        ? "I could not find matching opportunities currently published on Hargeisa Opportunity Hub. Try a different search or complete your profile for recommendations."
        : `Here are opportunities currently on the platform that may help:\n${catalog
            .map(
              (o) =>
                `- ${o.title} (${o.category}, ${o.location}, deadline ${new Date(o.deadline).toLocaleDateString("en-GB")})${o.isSample ? " [sample]" : ""}`
            )
            .join("\n")}\n\nI can only answer from opportunities stored on this platform.`;

    res.json({
      reply: reply || fallback,
      opportunities: catalog.map((item) => {
        const full = [...related, ...closingSoon, ...(focus ? [focus] : [])].find((o) => o.id === item.id);
        return full ? serializeOpportunity(full) : item;
      }),
    });
  })
);
