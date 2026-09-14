import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { publicUser } from "../lib/serialize";
import { asyncHandler } from "../utils/asyncHandler";
import { HttpError } from "../middleware/error";
import { requireAuth } from "../middleware/auth";
import { parseJsonArray } from "../utils/deadline";
import { profileCompleteness } from "../services/recommend";

export const profileRouter = Router();

function serializeProfile(user: Awaited<ReturnType<typeof loadProfile>>) {
  if (!user) return null;
  return {
    ...publicUser(user),
    profile: user.profile
      ? {
          ...user.profile,
          preferredLocations: parseJsonArray(user.profile.preferredLocations),
          preferredCategories: parseJsonArray(user.profile.preferredCategories),
        }
      : null,
    skills: user.skills.map((s) => s.skill.name),
    interests: user.interests.map((i) => i.interest.name),
    experiences: user.experiences,
    languages: user.languages,
    completeness: profileCompleteness(user),
  };
}

function loadProfile(userId: number) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      skills: { include: { skill: true } },
      interests: { include: { interest: true } },
      experiences: { orderBy: { startDate: "desc" } },
      languages: true,
    },
  });
}

profileRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await loadProfile(req.user!.id);
    if (!user) throw new HttpError(404, "User not found.");
    res.json({ user: serializeProfile(user) });
  })
);

profileRouter.put(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const data = z
      .object({
        name: z.string().min(2).max(120).optional(),
        phone: z.string().max(40).optional(),
        location: z.string().max(80).optional(),
        locale: z.enum(["en", "so"]).optional(),
        profileImage: z.string().max(500).optional(),
        educationLevel: z.string().optional(),
        university: z.string().optional(),
        degree: z.string().optional(),
        field: z.string().optional(),
        graduationYear: z.number().int().optional(),
        gpa: z.string().optional(),
        careerGoals: z.string().max(2000).optional(),
        preferredLocations: z.array(z.string()).optional(),
        preferredCategories: z.array(z.string()).optional(),
        skills: z.array(z.string()).optional(),
        interests: z.array(z.string()).optional(),
        languages: z
          .array(z.object({ language: z.string(), level: z.string().default("conversational") }))
          .optional(),
        experiences: z
          .array(
            z.object({
              organization: z.string(),
              position: z.string(),
              startDate: z.string(),
              endDate: z.string().nullable().optional(),
              description: z.string().optional(),
            })
          )
          .optional(),
        emailNotifications: z.boolean().optional(),
        inAppNotifications: z.boolean().optional(),
        browserNotifications: z.boolean().optional(),
        deadlineReminders: z.boolean().optional(),
        recommendationEmails: z.boolean().optional(),
      })
      .parse(req.body);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: req.user!.id },
        data: {
          name: data.name,
          phone: data.phone,
          location: data.location,
          locale: data.locale,
          profileImage: data.profileImage,
        },
      });

      await tx.userProfile.upsert({
        where: { userId: req.user!.id },
        update: {
          educationLevel: data.educationLevel,
          university: data.university,
          degree: data.degree,
          field: data.field,
          graduationYear: data.graduationYear,
          gpa: data.gpa,
          careerGoals: data.careerGoals,
          preferredLocations: data.preferredLocations ? JSON.stringify(data.preferredLocations) : undefined,
          preferredCategories: data.preferredCategories ? JSON.stringify(data.preferredCategories) : undefined,
          emailNotifications: data.emailNotifications,
          inAppNotifications: data.inAppNotifications,
          browserNotifications: data.browserNotifications,
          deadlineReminders: data.deadlineReminders,
          recommendationEmails: data.recommendationEmails,
        },
        create: {
          userId: req.user!.id,
          educationLevel: data.educationLevel,
          university: data.university,
          degree: data.degree,
          field: data.field,
          graduationYear: data.graduationYear,
          gpa: data.gpa,
          careerGoals: data.careerGoals,
          preferredLocations: JSON.stringify(data.preferredLocations ?? []),
          preferredCategories: JSON.stringify(data.preferredCategories ?? []),
        },
      });

      if (data.skills) {
        await tx.userSkill.deleteMany({ where: { userId: req.user!.id } });
        for (const name of data.skills.map((s) => s.trim()).filter(Boolean)) {
          const skill = await tx.skill.upsert({ where: { name }, update: {}, create: { name } });
          await tx.userSkill.create({ data: { userId: req.user!.id, skillId: skill.id } });
        }
      }

      if (data.interests) {
        await tx.userInterest.deleteMany({ where: { userId: req.user!.id } });
        for (const name of data.interests.map((s) => s.trim()).filter(Boolean)) {
          const interest = await tx.interest.upsert({ where: { name }, update: {}, create: { name } });
          await tx.userInterest.create({ data: { userId: req.user!.id, interestId: interest.id } });
        }
      }

      if (data.languages) {
        await tx.userLanguage.deleteMany({ where: { userId: req.user!.id } });
        await tx.userLanguage.createMany({
          data: data.languages.map((lang) => ({ userId: req.user!.id, ...lang })),
        });
      }

      if (data.experiences) {
        await tx.experience.deleteMany({ where: { userId: req.user!.id } });
        await tx.experience.createMany({
          data: data.experiences.map((exp) => ({
            userId: req.user!.id,
            organization: exp.organization,
            position: exp.position,
            startDate: new Date(exp.startDate),
            endDate: exp.endDate ? new Date(exp.endDate) : null,
            description: exp.description,
          })),
        });
      }
    });

    const user = await loadProfile(req.user!.id);
    res.json({ user: serializeProfile(user) });
  })
);
