import type { Request, Response, NextFunction } from "express";
import { db } from "@workspace/db";
import { subscriptionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getGroupBySlug } from "./groups";

const PUBLIC_SUB_PATHS: Array<{ method: string; subPath: string }> = [
  { method: "GET", subPath: "/" },
  { method: "GET", subPath: "/incident-types" },
];

export async function requireGroupSubscription(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const match = req.path.match(/^\/([^/]+)(\/.*)?$/);
    if (!match) { next(); return; }

    const groupSlug = match[1];
    const subPath = match[2] || "/";

    if (groupSlug === "join") { next(); return; }

    const isPublic = PUBLIC_SUB_PATHS.some(
      (p) => p.method === req.method && p.subPath === subPath
    );
    if (isPublic) { next(); return; }

    const group = await getGroupBySlug(groupSlug);
    if (!group) { next(); return; }

    const [subscription] = await db
      .select()
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.groupId, group.id));

    if (!subscription) { next(); return; }

    const now = new Date();

    if (
      subscription.status === "trial" &&
      subscription.trialEndsAt &&
      subscription.trialEndsAt > now
    ) {
      next(); return;
    }

    if (subscription.status === "active") {
      next(); return;
    }

    res.status(402).json({
      error: "subscription_required",
      message:
        subscription.status === "trial"
          ? "Your free trial has expired. Subscribe to keep using GroupWatch."
          : "Your subscription has lapsed. Please resubscribe to regain access.",
      status: subscription.status,
    });
  } catch (err) {
    next(err);
  }
}
