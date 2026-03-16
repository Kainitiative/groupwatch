import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import router from "./routes";
import { createSessionMiddleware } from "./lib/session";

const app: Express = express();

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:5173", "http://localhost:5174"];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

app.use(cookieParser());

// Raw body for Stripe webhooks — must come BEFORE json middleware
app.use("/api/billing/webhooks", express.raw({ type: "application/json" }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(createSessionMiddleware());

app.use((req, _res, next) => {
  if (req.method !== "GET") {
    console.log(`[API] ${req.method} ${req.path}`, req.body ?? {});
  }
  next();
});

app.use("/api", router);

export default app;
