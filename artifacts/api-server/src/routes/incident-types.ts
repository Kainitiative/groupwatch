import { Router } from "express";
import { db } from "@workspace/db";
import { incidentTypesTable, setupProgressTable } from "@workspace/db";
import { eq, and, asc } from "drizzle-orm";
import { requireAuth } from "../lib/session";
import { getGroupBySlug, getMemberRecord } from "../lib/groups";

const router = Router();

router.get("/groups/:groupSlug/incident-types", async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.groupSlug) ? req.params.groupSlug[0] : req.params.groupSlug;
  const group = await getGroupBySlug(slug);
  if (!group) { res.status(404).json({ error: "Group not found" }); return; }

  const types = await db
    .select()
    .from(incidentTypesTable)
    .where(and(
      eq(incidentTypesTable.groupId, group.id),
      eq(incidentTypesTable.isActive, true)
    ))
    .orderBy(asc(incidentTypesTable.sortOrder), asc(incidentTypesTable.createdAt));

  res.json(types.map(t => ({
    id: t.id,
    name: t.name,
    description: t.description,
    colour: t.colour,
    icon: t.icon,
    sortOrder: t.sortOrder,
    isActive: t.isActive,
    createdAt: t.createdAt,
  })));
});

router.post("/groups/:groupSlug/incident-types", requireAuth, async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.groupSlug) ? req.params.groupSlug[0] : req.params.groupSlug;
  const group = await getGroupBySlug(slug);
  if (!group) { res.status(404).json({ error: "Group not found" }); return; }

  const member = await getMemberRecord(group.id, req.session.userId!);
  if (!member || member.role !== "admin") {
    res.status(403).json({ error: "Only group admins can manage incident types" });
    return;
  }

  const { name, description, colour, icon } = req.body;
  if (!name) { res.status(422).json({ error: "Incident type name is required" }); return; }

  // Get current max sort order
  const existing = await db
    .select()
    .from(incidentTypesTable)
    .where(eq(incidentTypesTable.groupId, group.id));

  const sortOrder = existing.length;

  const [type] = await db
    .insert(incidentTypesTable)
    .values({ groupId: group.id, name, description, colour, icon, sortOrder })
    .returning();

  // Update setup progress
  await db
    .update(setupProgressTable)
    .set({ incidentTypesAdded: true })
    .where(eq(setupProgressTable.groupId, group.id));

  res.status(201).json({
    id: type.id,
    name: type.name,
    description: type.description,
    colour: type.colour,
    icon: type.icon,
    sortOrder: type.sortOrder,
    isActive: type.isActive,
    createdAt: type.createdAt,
  });
});

router.patch("/groups/:groupSlug/incident-types/:typeId", requireAuth, async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.groupSlug) ? req.params.groupSlug[0] : req.params.groupSlug;
  const typeId = Array.isArray(req.params.typeId) ? req.params.typeId[0] : req.params.typeId;
  const group = await getGroupBySlug(slug);
  if (!group) { res.status(404).json({ error: "Group not found" }); return; }

  const member = await getMemberRecord(group.id, req.session.userId!);
  if (!member || member.role !== "admin") {
    res.status(403).json({ error: "Only group admins can manage incident types" });
    return;
  }

  const { name, description, colour, icon, sortOrder, isActive } = req.body;
  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description;
  if (colour !== undefined) updates.colour = colour;
  if (icon !== undefined) updates.icon = icon;
  if (sortOrder !== undefined) updates.sort_order = sortOrder;
  if (isActive !== undefined) updates.is_active = isActive;

  const [type] = await db
    .update(incidentTypesTable)
    .set(updates)
    .where(and(eq(incidentTypesTable.id, typeId), eq(incidentTypesTable.groupId, group.id)))
    .returning();

  if (!type) { res.status(404).json({ error: "Incident type not found" }); return; }

  res.json({
    id: type.id,
    name: type.name,
    description: type.description,
    colour: type.colour,
    icon: type.icon,
    sortOrder: type.sortOrder,
    isActive: type.isActive,
    createdAt: type.createdAt,
  });
});

export default router;
