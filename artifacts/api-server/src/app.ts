import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import fs from "fs";
import router from "./routes";
import { createSessionMiddleware } from "./lib/session";

const app: Express = express();

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
    app.get("*", (_req, res) => {
      res.sendFile(path.join(staticDir, "index.html"));
    });
  }
}

export default app;
