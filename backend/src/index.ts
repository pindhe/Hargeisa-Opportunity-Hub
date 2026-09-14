import path from "path";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import { env, isProd } from "./config/env";
import { errorHandler } from "./middleware/error";
import { authRouter } from "./routes/auth";
import { opportunitiesRouter } from "./routes/opportunities";
import { organizationsRouter } from "./routes/organizations";
import { savedRouter } from "./routes/saved";
import { applicationsRouter } from "./routes/applications";
import { notificationsRouter } from "./routes/notifications";
import { aiRouter } from "./routes/ai";
import { adminRouter } from "./routes/admin";
import { profileRouter } from "./routes/profile";
import { statsRouter } from "./routes/stats";
import { reportsRouter } from "./routes/reports";
import { expireOpportunities, startJobs } from "./jobs/deadlines";

const app = express();

app.set("trust proxy", 1);
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Please try again later." },
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 400,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api", apiLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth/forgot-password", authLimiter);

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "hargeisa-opportunity-hub" });
});

app.use("/api/auth", authRouter);
app.use("/api/opportunities", opportunitiesRouter);
app.use("/api/organizations", organizationsRouter);
app.use("/api/saved", savedRouter);
app.use("/api/applications", applicationsRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/ai", aiRouter);
app.use("/api/admin", adminRouter);
app.use("/api/profile", profileRouter);
app.use("/api/stats", statsRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/categories", statsRouter);

app.use(errorHandler);

async function boot() {
  await expireOpportunities();
  startJobs();
  app.listen(env.port, () => {
    console.log(`HOH API running on ${env.backendUrl} (${isProd ? "production" : "development"})`);
  });
}

boot().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
