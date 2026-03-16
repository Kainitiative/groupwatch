import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "@workspace/db";

const PgSession = connectPgSimple(session);

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

export function createSessionMiddleware() {
  return session({
    store: new PgSession({
      pool,
      tableName: "session",
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || "dev-session-secret-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      sameSite: "lax",
    },
  });
}

export function requireAuth(req: any, res: any, next: any): void {
  if (!req.session?.userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  next();
}
