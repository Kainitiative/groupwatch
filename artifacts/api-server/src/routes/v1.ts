/**
 * Public REST API v1 — authenticated via API key (Bearer token)
 * Base: /api/v1
 *
 * GET  /api/v1/groups/:slug/incidents         List incidents
 * POST /api/v1/groups/:slug/incidents         Create incident
 * GET  /api/v1/groups/:slug/incident-types    List incident types
 */

import { Router, Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { db } from "@workspace/db";
import {
  apiKeysTable,
  groupsTable,
  incidentReportsTable,
  incidentTypesTable,
} from "@workspace/db";
import { eq, and, desc, lt, gt, isNull, or } from "drizzle-orm";
import { getGroupBySlug, generateReferenceNumber } from "../lib/groups";

const router = Router();

// ---------- API Key middleware ----------
async function requireApiKey(req: Request, res: Response, next: NextFunction): Promise<void> {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or malformed Authorization header. Use: Bearer <api_key>" });
    return;
  }

  const rawKey = auth.slice(7).trim();
  if (!rawKey.startsWith("iiq_")) {
    res.status(401).json({ error: "Invalid API key format" });
    return;
  }

  const hash = crypto.createHash("sha256").update(rawKey).digest("hex");

  const [keyRow] = await db
    .select()
    .from(apiKeysTable)
    .where(eq(apiKeysTable.keyHash, hash));

  if (!keyRow) {
    res.status(401).json({ error: "Invalid API key" });
    return;
  }

  if (!keyRow.isActive) {
    res.status(401).json({ error: "API key has been revoked" });
    return;
  }

  db.update(apiKeysTable)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeysTable.id, keyRow.id))
    .catch(() => {});

  (req as any).apiKeyGroupId = keyRow.groupId;
  next();
}

async function resolveGroup(req: Request, res: Response): Promise<typeof groupsTable.$inferSelect | null> {
  const slug = req.params.slug;
  const group = await getGroupBySlug(slug);
  if (!group) { res.status(404).json({ error: "Group not found" }); return null; }

  if ((req as any).apiKeyGroupId !== group.id) {
    res.status(403).json({ error: "This API key does not belong to the requested group" });
    return null;
  }

  return group;
}

// ---------- GET /api/v1/groups/:slug/incident-types ----------
router.get("/v1/groups/:slug/incident-types", requireApiKey, async (req, res): Promise<void> => {
  const group = await resolveGroup(req, res);
  if (!group) return;

  const types = await db
    .select({
      id: incidentTypesTable.id,
      name: incidentTypesTable.name,
      description: incidentTypesTable.description,
      colour: incidentTypesTable.colour,
      icon: incidentTypesTable.icon,
    })
    .from(incidentTypesTable)
    .where(eq(incidentTypesTable.groupId, group.id))
    .orderBy(incidentTypesTable.name);

  res.json({ data: types });
});

// ---------- GET /api/v1/groups/:slug/incidents ----------
router.get("/v1/groups/:slug/incidents", requireApiKey, async (req, res): Promise<void> => {
  const group = await resolveGroup(req, res);
  if (!group) return;

  const limit = Math.min(parseInt(String(req.query.limit ?? "50")), 200);
  const offset = parseInt(String(req.query.offset ?? "0"));
  const status = String(req.query.status ?? "");
  const severity = String(req.query.severity ?? "");

  const conditions = [eq(incidentReportsTable.groupId, group.id)];
  if (status) conditions.push(eq(incidentReportsTable.status, status as any));
  if (severity) conditions.push(eq(incidentReportsTable.severity, severity as any));

  const rows = await db
    .select({
      id: incidentReportsTable.id,
      referenceNumber: incidentReportsTable.referenceNumber,
      incidentTypeId: incidentReportsTable.incidentTypeId,
      severity: incidentReportsTable.severity,
      status: incidentReportsTable.status,
      description: incidentReportsTable.description,
      latitude: incidentReportsTable.latitude,
      longitude: incidentReportsTable.longitude,
      reportedAt: incidentReportsTable.reportedAt,
      reporterName: incidentReportsTable.reporterName,
      isAnonymous: incidentReportsTable.isAnonymous,
    })
    .from(incidentReportsTable)
    .where(and(...conditions))
    .orderBy(desc(incidentReportsTable.reportedAt))
    .limit(limit)
    .offset(offset);

  res.json({ data: rows, limit, offset, count: rows.length });
});

// ---------- POST /api/v1/groups/:slug/incidents ----------
router.post("/v1/groups/:slug/incidents", requireApiKey, async (req, res): Promise<void> => {
  const group = await resolveGroup(req, res);
  if (!group) return;

  const { incidentTypeId, severity, description, latitude, longitude, reporterName, reporterEmail } = req.body;

  if (!incidentTypeId || !severity || !description) {
    res.status(400).json({ error: "incidentTypeId, severity, and description are required" }); return;
  }

  const validSeverities = ["low", "medium", "high", "emergency"];
  if (!validSeverities.includes(severity)) {
    res.status(400).json({ error: `severity must be one of: ${validSeverities.join(", ")}` }); return;
  }

  const [type] = await db
    .select({ id: incidentTypesTable.id })
    .from(incidentTypesTable)
    .where(and(eq(incidentTypesTable.id, incidentTypeId), eq(incidentTypesTable.groupId, group.id)));

  if (!type) {
    res.status(400).json({ error: "Incident type not found for this group" }); return;
  }

  const referenceNumber = generateReferenceNumber(group.slug);

  const [report] = await db
    .insert(incidentReportsTable)
    .values({
      groupId: group.id,
      incidentTypeId,
      severity,
      status: "open",
      description: description.trim(),
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      reporterName: reporterName ?? null,
      reporterEmail: reporterEmail ?? null,
      reportedAt: new Date(),
      referenceNumber,
      isAnonymous: !reporterName,
      source: "api",
    } as any)
    .returning({
      id: incidentReportsTable.id,
      referenceNumber: incidentReportsTable.referenceNumber,
      status: incidentReportsTable.status,
      reportedAt: incidentReportsTable.reportedAt,
    });

  res.status(201).json({ data: report });
});

export { router as v1Router };
export default router;
