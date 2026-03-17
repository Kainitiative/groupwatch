import { Router } from "express";
import crypto from "crypto";
import { db } from "@workspace/db";
import { apiKeysTable, groupMembersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../lib/session";
import { getGroupBySlug } from "../lib/groups";

const router = Router();

function generateApiKey(): { key: string; prefix: string; hash: string } {
  const raw = crypto.randomBytes(32).toString("base64url");
  const key = `iiq_${raw}`;
  const prefix = `iiq_${raw.slice(0, 6)}`;
  const hash = crypto.createHash("sha256").update(key).digest("hex");
  return { key, prefix, hash };
}

async function getAdminMember(groupId: string, userId: string) {
  const [member] = await db
    .select()
    .from(groupMembersTable)
    .where(and(
      eq(groupMembersTable.groupId, groupId),
      eq(groupMembersTable.userId, userId),
      eq(groupMembersTable.status, "active"),
    ));
  return member ?? null;
}

router.get("/groups/:groupSlug/api-keys", requireAuth, async (req, res): Promise<void> => {
  const slug = req.params.groupSlug;
  const group = await getGroupBySlug(slug);
  if (!group) { res.status(404).json({ error: "Group not found" }); return; }

  const member = await getAdminMember(group.id, req.session.userId!);
  if (!member || member.role !== "admin") { res.status(403).json({ error: "Admin access required" }); return; }

  const keys = await db
    .select({
      id: apiKeysTable.id,
      label: apiKeysTable.label,
      keyPrefix: apiKeysTable.keyPrefix,
      isActive: apiKeysTable.isActive,
      lastUsedAt: apiKeysTable.lastUsedAt,
      createdAt: apiKeysTable.createdAt,
    })
    .from(apiKeysTable)
    .where(and(eq(apiKeysTable.groupId, group.id), eq(apiKeysTable.isActive, true)))
    .orderBy(apiKeysTable.createdAt);

  res.json(keys);
});

router.post("/groups/:groupSlug/api-keys", requireAuth, async (req, res): Promise<void> => {
  const slug = req.params.groupSlug;
  const group = await getGroupBySlug(slug);
  if (!group) { res.status(404).json({ error: "Group not found" }); return; }

  const member = await getAdminMember(group.id, req.session.userId!);
  if (!member || member.role !== "admin") { res.status(403).json({ error: "Admin access required" }); return; }

  const { name } = req.body;
  if (!name || typeof name !== "string" || name.trim().length < 1) {
    res.status(400).json({ error: "Name is required" }); return;
  }

  const existing = await db
    .select({ id: apiKeysTable.id })
    .from(apiKeysTable)
    .where(and(eq(apiKeysTable.groupId, group.id), eq(apiKeysTable.isActive, true)));

  if (existing.length >= 10) {
    res.status(400).json({ error: "Maximum 10 active API keys per group" }); return;
  }

  const { key, prefix, hash } = generateApiKey();

  const [created] = await db
    .insert(apiKeysTable)
    .values({
      groupId: group.id,
      createdByUserId: req.session.userId!,
      label: name.trim(),
      keyHash: hash,
      keyPrefix: prefix,
      isActive: true,
    })
    .returning({
      id: apiKeysTable.id,
      label: apiKeysTable.label,
      keyPrefix: apiKeysTable.keyPrefix,
      createdAt: apiKeysTable.createdAt,
    });

  res.status(201).json({ ...created, key });
});

router.delete("/groups/:groupSlug/api-keys/:keyId", requireAuth, async (req, res): Promise<void> => {
  const slug = req.params.groupSlug;
  const group = await getGroupBySlug(slug);
  if (!group) { res.status(404).json({ error: "Group not found" }); return; }

  const member = await getAdminMember(group.id, req.session.userId!);
  if (!member || member.role !== "admin") { res.status(403).json({ error: "Admin access required" }); return; }

  const [updated] = await db
    .update(apiKeysTable)
    .set({ isActive: false })
    .where(and(eq(apiKeysTable.id, req.params.keyId), eq(apiKeysTable.groupId, group.id)))
    .returning({ id: apiKeysTable.id });

  if (!updated) { res.status(404).json({ error: "API key not found" }); return; }

  res.json({ success: true });
});

export default router;
