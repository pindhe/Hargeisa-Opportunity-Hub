import nodemailer from "nodemailer";
import { env, isProd } from "../config/env";

function getTransport() {
  if (!env.emailHost || !env.emailUsername) return null;
  return nodemailer.createTransport({
    host: env.emailHost,
    port: env.emailPort,
    secure: env.emailPort === 465,
    auth: {
      user: env.emailUsername,
      pass: env.emailPassword,
    },
  });
}

export async function sendMail(options: { to: string; subject: string; html: string; text?: string }) {
  const transport = getTransport();
  if (!transport) {
    if (!isProd) {
      console.log(`[mail:dev] to=${options.to} subject=${options.subject}\n${options.text ?? options.html}`);
    }
    return { delivered: false, reason: "smtp_not_configured" };
  }

  await transport.sendMail({
    from: env.emailFrom,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  });
  return { delivered: true };
}
