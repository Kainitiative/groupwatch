import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import fs from "fs";
import router from "./routes";
import { createSessionMiddleware } from "./lib/session";
import { logError } from "./lib/logError";
import { ogRendererMiddleware } from "./lib/ogRenderer";
import { requireGroupSubscription } from "./lib/subscription";

const app: Express = express();

// Trust the first proxy (nginx / Cloudflare) so that secure session cookies
// work correctly when NODE_ENV=production behind a reverse proxy.
app.set("trust proxy", 1);

const isProduction = process.env.NODE_ENV === "production";

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:5173", "http://localhost:5174"];

if (!isProduction) {
  app.use(cors({
    origin: allowedOrigins,
    credentials: true,
  }));
}

app.use(cookieParser());

// Prevent Cloudflare (and any proxy) from caching API responses
app.use("/api", (_req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Surrogate-Control", "no-store");
  next();
});

// Raw body for Stripe webhooks — must come BEFORE json middleware
app.use("/api/billing/webhooks", express.raw({ type: "application/json" }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(createSessionMiddleware());

app.use("/api/groups", requireGroupSubscription);

app.use("/api", router);

// Intercept social media crawlers and return OG meta HTML
// Must be before static file serving so Facebook/Twitter get proper previews
app.use(ogRendererMiddleware());

// Serve React frontend in production
if (isProduction) {
  const staticDir = path.resolve(process.cwd(), "public");
  if (fs.existsSync(staticDir)) {
    // Hashed assets (JS/CSS bundles) get long-lived cache
    app.use(express.static(staticDir, { maxAge: "7d", immutable: true }));
    // index.html must never be cached — it references the hashed bundles
    app.get("/{*path}", (_req, res) => {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
      res.sendFile(path.join(staticDir, "index.html"));
    });
  }
}

// Global error handler — captures unhandled route errors into error_logs
app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  const errObj = err as { status?: number; statusCode?: number } | null;
  const status = errObj?.status ?? errObj?.statusCode ?? 500;
  const message = err instanceof Error ? err.message : "Internal server error";

  // Only persist 5xx errors (don't log 4xx user mistakes)
  if (status >= 500) {
    logError(err, { req, statusCode: status }).catch(() => {});
  }

  if (!res.headersSent) {
    res.status(status).json({ error: message });
  }
});

export default app;
