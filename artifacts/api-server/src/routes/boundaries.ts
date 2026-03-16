import { Router } from "express";
import { db } from "@workspace/db";
import { mapBoundariesTable, mapSectionsTable, setupProgressTable } from "@workspace/db";
import { eq, and, asc } from "drizzle-orm";
import { requireAuth } from "../lib/session";
import { getGroupBySlug, getMemberRecord } from "../lib/groups";

const router = Router();

// List boundaries (all members)
router.get("/groups/:groupSlug/boundaries", requireAuth, async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.groupSlug) ? req.params.groupSlug[0] : req.params.groupSlug;
  const group = await getGroupBySlug(slug);
  if (!group) { res.status(404).json({ error: "Group not found" }); return; }

  const member = await getMemberRecord(group.id, req.session.userId!);
  if (!member) { res.status(403).json({ error: "Not a member" }); return; }

  const boundaries = await db
    .select()
    .from(mapBoundariesTable)
    .where(and(eq(mapBoundariesTable.groupId, group.id), eq(mapBoundariesTable.isActive, true)))
    .orderBy(asc(mapBoundariesTable.createdAt));

  const sections = await db
    .select()
    .from(mapSectionsTable)
    .where(and(eq(mapSectionsTable.groupId, group.id), eq(mapSectionsTable.isActive, true)))
    .orderBy(asc(mapSectionsTable.sortOrder));

  const result = boundaries.map(b => ({
    ...b,
    sections: sections.filter(s => s.boundaryId === b.id),
  }));

  res.json(result);
});

// Create boundary (admin only)
router.post("/groups/:groupSlug/boundaries", requireAuth, async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.groupSlug) ? req.params.groupSlug[0] : req.params.groupSlug;
  const group = await getGroupBySlug(slug);
  if (!group) { res.status(404).json({ error: "Group not found" }); return; }

  const member = await getMemberRecord(group.id, req.session.userId!);
  if (!member || member.role !== "admin") { res.status(403).json({ error: "Admin access required" }); return; }

  const { name, boundaryType, geometry, colour, bufferMeters } = req.body;
  if (!name?.trim() || !geometry) { res.status(422).json({ error: "Name and geometry are required" }); return; }

  const [boundary] = await db.insert(mapBoundariesTable).values({
    groupId: group.id,
    name: name.trim(),
    boundaryType: boundaryType ?? "polygon",
    geometry,
    colour: colour ?? "#10b981",
    bufferMeters: bufferMeters ?? null,
    isActive: true,
  }).returning();

  // Mark map boundaries as drawn in setup progress
  try {
    await db.update(setupProgressTable)
      .set({ mapBoundariesDrawn: true })
      .where(eq(setupProgressTable.groupId, group.id));
  } catch {}

  res.status(201).json({ ...boundary, sections: [] });
});

// Update boundary name/colour (admin only)
router.patch("/groups/:groupSlug/boundaries/:boundaryId", requireAuth, async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.groupSlug) ? req.params.groupSlug[0] : req.params.groupSlug;
  const boundaryId = Array.isArray(req.params.boundaryId) ? req.params.boundaryId[0] : req.params.boundaryId;

  const group = await getGroupBySlug(slug);
  if (!group) { res.status(404).json({ error: "Group not found" }); return; }

  const member = await getMemberRecord(group.id, req.session.userId!);
  if (!member || member.role !== "admin") { res.status(403).json({ error: "Admin access required" }); return; }

  const { name, colour } = req.body;
  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name.trim();
  if (colour !== undefined) updates.colour = colour;

  const [updated] = await db.update(mapBoundariesTable)
    .set(updates)
    .where(and(eq(mapBoundariesTable.id, boundaryId), eq(mapBoundariesTable.groupId, group.id)))
    .returning();

  res.json(updated);
});

// Delete boundary (admin only)
router.delete("/groups/:groupSlug/boundaries/:boundaryId", requireAuth, async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.groupSlug) ? req.params.groupSlug[0] : req.params.groupSlug;
  const boundaryId = Array.isArray(req.params.boundaryId) ? req.params.boundaryId[0] : req.params.boundaryId;

  const group = await getGroupBySlug(slug);
  if (!group) { res.status(404).json({ error: "Group not found" }); return; }

  const member = await getMemberRecord(group.id, req.session.userId!);
  if (!member || member.role !== "admin") { res.status(403).json({ error: "Admin access required" }); return; }

  await db.delete(mapBoundariesTable)
    .where(and(eq(mapBoundariesTable.id, boundaryId), eq(mapBoundariesTable.groupId, group.id)));

  res.status(204).send();
});

export default router;
