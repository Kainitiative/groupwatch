import { Router } from "express";
import { db } from "@workspace/db";
import { pushSubscriptionsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../lib/session";

const router = Router();

router.get("/push/vapid-public-key", async (_req, res): Promise<void> => {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  if (!publicKey) {
    res.status(503).json({ error: "Push notifications not configured" });
    return;
  }
  res.json({ publicKey });
});

router.post("/push/subscribe", requireAuth, async (req, res): Promise<void> => {
  const { endpoint, p256dh, auth, userAgent } = req.body;

  if (!endpoint || !p256dh || !auth) {
    res.status(422).json({ error: "endpoint, p256dh and auth are required" });
    return;
  }

  await db
    .insert(pushSubscriptionsTable)
    .values({
      userId: req.session.userId!,
      endpoint,
      p256dh,
      auth,
      userAgent: userAgent ?? null,
    })
    .onConflictDoUpdate({
      target: pushSubscriptionsTable.endpoint,
      set: { p256dh, auth, userId: req.session.userId! },
    });

  res.status(201).json({ message: "Push subscription registered" });
});

router.post("/push/unsubscribe", requireAuth, async (req, res): Promise<void> => {
  const { endpoint } = req.body;
  if (!endpoint) { res.status(422).json({ error: "endpoint is required" }); return; }

  await db
    .delete(pushSubscriptionsTable)
    .where(and(
      eq(pushSubscriptionsTable.endpoint, endpoint),
      eq(pushSubscriptionsTable.userId, req.session.userId!)
    ));

  res.json({ message: "Push subscription removed" });
});

export default router;
