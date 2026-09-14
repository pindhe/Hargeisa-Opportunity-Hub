import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { hashPassword, verifyPassword, createRawToken, hashToken } from "../lib/password";
import { signAccessToken } from "../lib/jwt";
import { sendMail } from "../lib/mail";
import { publicUser } from "../lib/serialize";
import { env } from "../config/env";
import { asyncHandler } from "../utils/asyncHandler";
import { HttpError } from "../middleware/error";
import { requireAuth } from "../middleware/auth";

export const authRouter = Router();

const registerSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(72),
  role: z.enum(["student", "job_seeker", "organization"]).default("student"),
  organizationName: z.string().min(2).max(160).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

async function issueVerifyEmail(userId: number, email: string, name: string) {
  const raw = createRawToken();
  await prisma.authToken.create({
    data: {
      userId,
      type: "verify_email",
      tokenHash: hashToken(raw),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
    },
  });
  const link = `${env.frontendUrl}/verify-email?token=${raw}`;
  await sendMail({
    to: email,
    subject: "Verify your Hargeisa Opportunity Hub account",
    text: `Hello ${name}, verify your email: ${link}`,
    html: `<p>Hello ${name},</p><p>Confirm your email to finish creating your Hargeisa Opportunity Hub account.</p><p><a href="${link}">Verify email</a></p>`,
  });
}

authRouter.post(
  "/register",
  asyncHandler(async (req, res) => {
    const data = registerSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
    if (existing) throw new HttpError(409, "An account with this email already exists.");

    const passwordHash = await hashPassword(data.password);
    const user = await prisma.$transaction(async (tx) => {
      let organizationId: number | undefined;
      if (data.role === "organization") {
        const name = data.organizationName ?? `${data.name}'s Organization`;
        const org = await tx.organization.create({
          data: {
            name,
            slug: `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${Date.now()}`,
            email: data.email.toLowerCase(),
            status: "pending",
            verified: false,
          },
        });
        organizationId = org.id;
      }

      return tx.user.create({
        data: {
          name: data.name,
          email: data.email.toLowerCase(),
          passwordHash,
          role: data.role,
          organizationId,
          profile: { create: {} },
        },
      });
    });

    await issueVerifyEmail(user.id, user.email, user.name);
    const token = signAccessToken({ sub: user.id, role: user.role, email: user.email });
    res.status(201).json({
      token,
      user: publicUser(user),
      message: "Account created. Please check your email to verify your address.",
    });
  })
);

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const data = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
    if (!user || !(await verifyPassword(data.password, user.passwordHash))) {
      throw new HttpError(401, "Invalid email or password.");
    }
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    const token = signAccessToken({ sub: user.id, role: user.role, email: user.email });
    res.json({ token, user: publicUser(user) });
  })
);

authRouter.get(
  "/profile",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) throw new HttpError(404, "User not found.");
    res.json({ user: publicUser(user) });
  })
);

authRouter.post(
  "/forgot-password",
  asyncHandler(async (req, res) => {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (user) {
      const raw = createRawToken();
      await prisma.authToken.create({
        data: {
          userId: user.id,
          type: "reset_password",
          tokenHash: hashToken(raw),
          expiresAt: new Date(Date.now() + 1000 * 60 * 30),
        },
      });
      const link = `${env.frontendUrl}/reset-password?token=${raw}`;
      await sendMail({
        to: user.email,
        subject: "Reset your Hargeisa Opportunity Hub password",
        text: `Reset your password: ${link}`,
        html: `<p>Reset your password using this link (valid for 30 minutes):</p><p><a href="${link}">${link}</a></p>`,
      });
    }
    res.json({ message: "If an account exists for that email, a reset link has been sent." });
  })
);

authRouter.post(
  "/reset-password",
  asyncHandler(async (req, res) => {
    const { token, password } = z
      .object({ token: z.string().min(10), password: z.string().min(8).max(72) })
      .parse(req.body);
    const record = await prisma.authToken.findFirst({
      where: { tokenHash: hashToken(token), type: "reset_password", usedAt: null, expiresAt: { gt: new Date() } },
    });
    if (!record) throw new HttpError(400, "This reset link is invalid or has expired.");
    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { passwordHash: await hashPassword(password) } }),
      prisma.authToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    ]);
    res.json({ message: "Password updated. You can now log in." });
  })
);

authRouter.post(
  "/verify-email",
  asyncHandler(async (req, res) => {
    const { token } = z.object({ token: z.string().min(10) }).parse(req.body);
    const record = await prisma.authToken.findFirst({
      where: { tokenHash: hashToken(token), type: "verify_email", usedAt: null, expiresAt: { gt: new Date() } },
    });
    if (!record) throw new HttpError(400, "This verification link is invalid or has expired.");
    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { emailVerified: true } }),
      prisma.authToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    ]);
    res.json({ message: "Email verified successfully." });
  })
);

authRouter.post(
  "/resend-verification",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) throw new HttpError(404, "User not found.");
    if (user.emailVerified) throw new HttpError(400, "Your email is already verified.");
    await issueVerifyEmail(user.id, user.email, user.name);
    res.json({ message: "Verification email sent." });
  })
);
