import cron from "node-cron";
import { prisma } from "../lib/prisma";
import { sendMail } from "../lib/mail";

const REMINDERS: { kind: string; days: number; title: string; message: (title: string) => string }[] = [
  {
    kind: "7d",
    days: 7,
    title: "Deadline in 7 days",
    message: (title) => `Your saved opportunity deadline is in 7 days: ${title}.`,
  },
  {
    kind: "3d",
    days: 3,
    title: "Deadline in 3 days",
    message: (title) => `Don't forget! Your opportunity deadline is in 3 days: ${title}.`,
  },
  {
    kind: "1d",
    days: 1,
    title: "Final reminder",
    message: (title) => `Final reminder: ${title} closes tomorrow.`,
  },
  {
    kind: "0d",
    days: 0,
    title: "Deadline today",
    message: (title) => `Today is the final day to apply for ${title}.`,
  },
];

function dayRange(daysFromNow: number) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + daysFromNow);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

export async function expireOpportunities() {
  await prisma.opportunity.updateMany({
    where: { status: "published", deadline: { lt: new Date() } },
    data: { status: "expired" },
  });
}

export async function sendDeadlineReminders() {
  for (const reminder of REMINDERS) {
    const { start, end } = dayRange(reminder.days);
    const saved = await prisma.savedOpportunity.findMany({
      where: {
        opportunity: {
          status: { in: ["published", "expired"] },
          deadline: { gte: start, lt: end },
        },
      },
      include: {
        opportunity: true,
        user: { include: { profile: true } },
      },
    });

    for (const row of saved) {
      if (row.user.profile && row.user.profile.deadlineReminders === false) continue;
      const exists = await prisma.deadlineReminder.findUnique({
        where: {
          userId_opportunityId_kind: {
            userId: row.userId,
            opportunityId: row.opportunityId,
            kind: reminder.kind,
          },
        },
      });
      if (exists) continue;

      const message = reminder.message(row.opportunity.title);
      if (!row.user.profile || row.user.profile.inAppNotifications !== false) {
        await prisma.notification.create({
          data: {
            userId: row.userId,
            title: reminder.title,
            message,
            type: "deadline",
            link: `/opportunities/${row.opportunity.slug}`,
          },
        });
      }

      if (!row.user.profile || row.user.profile.emailNotifications !== false) {
        await sendMail({
          to: row.user.email,
          subject: reminder.title,
          text: message,
          html: `<p>${message}</p><p><a href="${process.env.FRONTEND_URL ?? "http://localhost:3000"}/opportunities/${row.opportunity.slug}">View opportunity</a></p>`,
        });
      }

      await prisma.deadlineReminder.create({
        data: {
          userId: row.userId,
          opportunityId: row.opportunityId,
          kind: reminder.kind,
        },
      });
    }
  }
}

export function startJobs() {
  cron.schedule("15 * * * *", async () => {
    try {
      await expireOpportunities();
      await sendDeadlineReminders();
    } catch (error) {
      console.error("Scheduled job failed", error);
    }
  });
}
