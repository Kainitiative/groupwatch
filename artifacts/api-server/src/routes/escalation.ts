import { Router } from "express";
import { db } from "@workspace/db";
import { escalationContactsTable, setupProgressTable } from "@workspace/db";
import { eq, and, asc } from "drizzle-orm";
import { requireAuth } from "../lib/session";
import { getGroupBySlug, getMemberRecord } from "../lib/groups";

const router = Router();

// List escalation contacts (any active member can view — needed for escalation picker)
router.get("/groups/:groupSlug/escalation-contacts", requireAuth, async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.groupSlug) ? req.params.groupSlug[0] : req.params.groupSlug;
  const group = await getGroupBySlug(slug);
  if (!group) { res.status(404).json({ error: "Group not found" }); return; }

  const member = await getMemberRecord(group.id, req.session.userId!);
  if (!member) { res.status(403).json({ error: "Not a member of this group" }); return; }

  const contacts = await db
    .select()
    .from(escalationContactsTable)
    .where(and(eq(escalationContactsTable.groupId, group.id), eq(escalationContactsTable.isActive, true)))
    .orderBy(asc(escalationContactsTable.sortOrder), asc(escalationContactsTable.createdAt));

  res.json(contacts);
});

// Create escalation contact (admin only)
router.post("/groups/:groupSlug/escalation-contacts", requireAuth, async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.groupSlug) ? req.params.groupSlug[0] : req.params.groupSlug;
  const group = await getGroupBySlug(slug);
  if (!group) { res.status(404).json({ error: "Group not found" }); return; }

  const member = await getMemberRecord(group.id, req.session.userId!);
  if (!member || member.role !== "admin") { res.status(403).json({ error: "Admin access required" }); return; }

  const { name, organisation, role, phone, email, notes } = req.body;
  if (!name?.trim()) { res.status(422).json({ error: "Name is required" }); return; }

  // Get next sort order
  const existing = await db
    .select({ sortOrder: escalationContactsTable.sortOrder })
    .from(escalationContactsTable)
    .where(eq(escalationContactsTable.groupId, group.id))
    .orderBy(asc(escalationContactsTable.sortOrder));
  const nextSort = existing.length > 0 ? (existing[existing.length - 1].sortOrder + 1) : 0;

  const [contact] = await db.insert(escalationContactsTable).values({
    groupId: group.id,
    name: name.trim(),
    organisation: organisation?.trim() || null,
    role: role?.trim() || null,
    phone: phone?.trim() || null,
    email: email?.trim() || null,
    notes: notes?.trim() || null,
    sortOrder: nextSort,
    isActive: true,
  }).returning();

  // Mark escalation contacts as added in setup progress
  try {
    await db.update(setupProgressTable)
      .set({ escalationContactsAdded: true })
      .where(eq(setupProgressTable.groupId, group.id));
  } catch {}

  res.status(201).json(contact);
});

// Update escalation contact (admin only)
router.patch("/groups/:groupSlug/escalation-contacts/:contactId", requireAuth, async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.groupSlug) ? req.params.groupSlug[0] : req.params.groupSlug;
  const contactId = Array.isArray(req.params.contactId) ? req.params.contactId[0] : req.params.contactId;

  const group = await getGroupBySlug(slug);
  if (!group) { res.status(404).json({ error: "Group not found" }); return; }

  const member = await getMemberRecord(group.id, req.session.userId!);
  if (!member || member.role !== "admin") { res.status(403).json({ error: "Admin access required" }); return; }

  const [existing] = await db
    .select()
    .from(escalationContactsTable)
    .where(and(eq(escalationContactsTable.id, contactId), eq(escalationContactsTable.groupId, group.id)));

  if (!existing) { res.status(404).json({ error: "Contact not found" }); return; }

  const { name, organisation, role, phone, email, notes, isActive } = req.body;

  const updates: Partial<typeof escalationContactsTable.$inferInsert> = {};
  if (name !== undefined) updates.name = name.trim();
  if (organisation !== undefined) updates.organisation = organisation?.trim() || null;
  if (role !== undefined) updates.role = role?.trim() || null;
  if (phone !== undefined) updates.phone = phone?.trim() || null;
  if (email !== undefined) updates.email = email?.trim() || null;
  if (notes !== undefined) updates.notes = notes?.trim() || null;
  if (isActive !== undefined) updates.isActive = Boolean(isActive);

  const [updated] = await db
    .update(escalationContactsTable)
    .set(updates)
    .where(eq(escalationContactsTable.id, contactId))
    .returning();

  res.json(updated);
});

// Delete (hard delete) escalation contact (admin only)
router.delete("/groups/:groupSlug/escalation-contacts/:contactId", requireAuth, async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.groupSlug) ? req.params.groupSlug[0] : req.params.groupSlug;
  const contactId = Array.isArray(req.params.contactId) ? req.params.contactId[0] : req.params.contactId;

  const group = await getGroupBySlug(slug);
  if (!group) { res.status(404).json({ error: "Group not found" }); return; }

  const member = await getMemberRecord(group.id, req.session.userId!);
  if (!member || member.role !== "admin") { res.status(403).json({ error: "Admin access required" }); return; }

  await db
    .delete(escalationContactsTable)
    .where(and(eq(escalationContactsTable.id, contactId), eq(escalationContactsTable.groupId, group.id)));

  res.status(204).send();
});

export default router;
