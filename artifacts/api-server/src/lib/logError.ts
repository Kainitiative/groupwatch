import { db } from "@workspace/db";
import { errorLogsTable } from "@workspace/db";
import type { Request } from "express";

export async function logError(
  err: unknown,
  opts: {
    req?: Request;
    level?: "error" | "warn" | "info";
    statusCode?: number;
    meta?: Record<string, unknown>;
  } = {}
): Promise<void> {
  try {
    const e = err instanceof Error ? err : new Error(String(err));
    const { req, level = "error", statusCode = 500, meta } = opts;

    await db.insert(errorLogsTable).values({
      level,
      message: e.message || "Unknown error",
      stack: e.stack ?? null,
      path: req?.path ?? null,
      method: req?.method ?? null,
      statusCode,
      userId: (req?.session as any)?.userId ?? null,
      meta: meta ? JSON.stringify(meta) : null,
    });
  } catch {
    // Never let error logging itself crash the app
  }
}
