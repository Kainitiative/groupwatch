import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import fs from "fs";
import router from "./routes";
import { createSessionMiddleware } from "./lib/session";
import { logError } from "./lib/logError";

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

// Raw body for Stripe webhooks — must come BEFORE json middleware
app.use("/api/billing/webhooks", express.raw({ type: "application/json" }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(createSessionMiddleware());

app.use("/api", router);

// Serve React frontend in production
if (isProduction) {
  const staticDir = path.resolve(process.cwd(), "public");
  if (fs.existsSync(staticDir)) {
    app.use(express.static(staticDir, { maxAge: "7d", immutable: true }));
    app.get("/{*path}", (_req, res) => {
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
