import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

function required(name: string, fallback?: string) {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: required("DATABASE_URL", "file:./dev.db"),
  secretKey: required("SECRET_KEY", "dev-secret-change-me"),
  jwtSecret: required("JWT_SECRET", "dev-jwt-secret-change-me"),
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:3000",
  backendUrl: process.env.BACKEND_URL ?? "http://localhost:4000",
  aiApiKey: process.env.AI_API_KEY ?? "",
  aiApiBase: process.env.AI_API_BASE ?? "https://api.openai.com/v1",
  aiModel: process.env.AI_MODEL ?? "gpt-4o-mini",
  emailHost: process.env.EMAIL_HOST ?? "",
  emailPort: Number(process.env.EMAIL_PORT ?? 587),
  emailUsername: process.env.EMAIL_USERNAME ?? "",
  emailPassword: process.env.EMAIL_PASSWORD ?? "",
  emailFrom: process.env.EMAIL_FROM ?? "Hargeisa Opportunity Hub <noreply@localhost>",
};

export const isProd = env.nodeEnv === "production";
