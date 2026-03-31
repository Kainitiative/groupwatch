import { Router, Request, Response } from "express";
import crypto from "crypto";
import { db } from "@workspace/db";
import { invitationsTable, groupsTable, subscriptionsTable, usersTable } from "@workspace/db";
import { eq, and, or } from "drizzle-orm";
import { requireAuth } from "../lib/session";
import { sendOutreachInvitationEmail } from "../lib/email";

const router = Router();

const TRANSPARENT_GIF = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

async function requireSuperAdmin(req: Request, res: Response): Promise<boolean> {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.session.userId!));

  if (!user?.isSuperAdmin) {
    res.status(403).json({ error: "Super admin access required" });
    return false;
  }
  return true;
}

router.post("/admin/invitations", requireAuth, async (req, res): Promise<void> => {
  if (!await requireSuperAdmin(req, res)) return;

  const { email, contactFirstName, groupName, groupType } = req.body;
  if (!email || !groupName || !groupType) {
    res.status(422).json({ error: "email, groupName and groupType are required" });
    return;
  }

  const emailLower = String(email).toLowerCase().trim();
  const firstName = contactFirstName ? String(contactFirstName).trim() : "";

  const existing = await db
    .select()
    .from(invitationsTable)
    .where(
      and(
        eq(invitationsTable.email, emailLower),
        or(
          eq(invitationsTable.status, "pending"),
          eq(invitationsTable.status, "opened"),
          eq(invitationsTable.status, "visited")
        )
      )
    )
    .limit(1);

  let token: string;
  let invitationId: string;

  if (existing[0]) {
    token = existing[0].token;
    invitationId = existing[0].id;
    await db
      .update(invitationsTable)
      .set({
        contactFirstName: firstName,
        groupName: String(groupName).trim(),
        groupType: String(groupType).trim(),
        status: "pending",
        openedAt: null,
        visitedAt: null,
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      })
      .where(eq(invitationsTable.id, invitationId));
  } else {
    token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
    const [created] = await db
      .insert(invitationsTable)
      .values({
        email: emailLower,
        contactFirstName: firstName,
        groupName: String(groupName).trim(),
        groupType: String(groupType).trim(),
        token,
        expiresAt,
      })
      .returning();
    invitationId = created.id;
  }

  const appUrl = process.env.APP_URL || "https://groupwatchplatform.com";
  const claimUrl = `${appUrl}/api/invitations/${token}/visit`;
  const pixelUrl = `${appUrl}/api/invitations/${token}/pixel.gif`;

  await sendOutreachInvitationEmail(
    emailLower,
    String(groupName).trim(),
    String(groupType).trim(),
    claimUrl,
    pixelUrl
  );

  res.status(201).json({ message: "Invitation sent", id: invitationId, token });
});

router.get("/admin/invitations", requireAuth, async (req, res): Promise<void> => {
  if (!await requireSuperAdmin(req, res)) return;

  const now = new Date();
  const rows = await db
    .select()
    .from(invitationsTable)
    .orderBy(invitationsTable.createdAt);

  const result = rows.reverse().map(inv => {
    const isExpired =
      inv.status !== "claimed" &&
      inv.status !== "expired" &&
      inv.expiresAt < now;
    return {
      id: inv.id,
      email: inv.email,
      contactFirstName: inv.contactFirstName,
      groupName: inv.groupName,
      groupType: inv.groupType,
      status: isExpired ? "expired" : inv.status,
      openedAt: inv.openedAt,
      visitedAt: inv.visitedAt,
      expiresAt: inv.expiresAt,
      createdAt: inv.createdAt,
    };
  });

  res.json({ invitations: result });
});

router.get("/invitations/:token/pixel.gif", async (req, res): Promise<void> => {
  const { token } = req.params;

  const [inv] = await db
    .select()
    .from(invitationsTable)
    .where(eq(invitationsTable.token, token))
    .limit(1);

  if (inv && inv.status === "pending") {
    await db
      .update(invitationsTable)
      .set({ status: "opened", openedAt: new Date() })
      .where(eq(invitationsTable.id, inv.id));
  }

  res
    .set("Content-Type", "image/gif")
    .set("Cache-Control", "no-store, no-cache, must-revalidate")
    .set("Pragma", "no-cache")
    .status(200)
    .end(TRANSPARENT_GIF);
});

router.get("/invitations/:token/visit", async (req, res): Promise<void> => {
  const { token } = req.params;
  const appUrl = process.env.APP_URL || "https://groupwatchplatform.com";

  const [inv] = await db
    .select()
    .from(invitationsTable)
    .where(eq(invitationsTable.token, token))
    .limit(1);

  if (inv && (inv.status === "pending" || inv.status === "opened")) {
    await db
      .update(invitationsTable)
      .set({ status: "visited", visitedAt: new Date() })
      .where(eq(invitationsTable.id, inv.id));
  }

  res.redirect(`${appUrl}/join?invite=${token}`);
});

router.get("/invitations/:token/validate", async (req, res): Promise<void> => {
  const { token } = req.params;
  const now = new Date();

  const [inv] = await db
    .select()
    .from(invitationsTable)
    .where(eq(invitationsTable.token, token))
    .limit(1);

  if (!inv) {
    res.status(404).json({ valid: false, error: "Invitation not found" });
    return;
  }

  if (inv.status === "claimed") {
    res.json({ valid: false, error: "This invitation has already been claimed" });
    return;
  }

  if (inv.expiresAt < now) {
    res.json({ valid: false, error: "This invitation has expired" });
    return;
  }

  res.json({
    valid: true,
    groupName: inv.groupName,
    contactFirstName: inv.contactFirstName,
    groupType: inv.groupType,
  });
});

export default router;
