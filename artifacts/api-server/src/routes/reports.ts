import { Router } from "express";
import { db } from "@workspace/db";
import {
  incidentReportsTable,
  reportPhotosTable,
  reportUpdatesTable,
  incidentTypesTable,
  groupMembersTable,
  groupMemberPermissionsTable,
  usersTable,
} from "@workspace/db";
import { eq, and, desc, count } from "drizzle-orm";
import { requireAuth } from "../lib/session";
import { getGroupBySlug, getMemberRecord, getMemberPermissions, generateReferenceNumber } from "../lib/groups";

const router = Router();

router.get("/groups/:groupSlug/reports", requireAuth, async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.groupSlug) ? req.params.groupSlug[0] : req.params.groupSlug;
  const group = await getGroupBySlug(slug);
  if (!group) { res.status(404).json({ error: "Group not found" }); return; }

  const perms = await getMemberPermissions(group.id, req.session.userId!);
  const member = await getMemberRecord(group.id, req.session.userId!);

  if (!member) { res.status(403).json({ error: "You are not a member of this group" }); return; }
  if (!perms?.canViewDashboard && member.role !== "admin") {
    res.status(403).json({ error: "You do not have dashboard access" });
    return;
  }

  const page = parseInt(String(req.query.page || "1"));
  const limit = Math.min(parseInt(String(req.query.limit || "20")), 100);
  const offset = (page - 1) * limit;

  const validStatuses = ["open", "in_progress", "escalated", "resolved"] as const;
  const validSeverities = ["low", "medium", "high", "emergency"] as const;

  type ReportStatus = typeof validStatuses[number];
  type ReportSeverity = typeof validSeverities[number];

  const statusParam = req.query.status as string | undefined;
  const severityParam = req.query.severity as string | undefined;

  const conditions = [eq(incidentReportsTable.groupId, group.id)];
  if (statusParam && (validStatuses as readonly string[]).includes(statusParam)) {
    conditions.push(eq(incidentReportsTable.status, statusParam as ReportStatus));
  }
  if (severityParam && (validSeverities as readonly string[]).includes(severityParam)) {
    conditions.push(eq(incidentReportsTable.severity, severityParam as ReportSeverity));
  }

  const [totalResult] = await db
    .select({ count: count() })
    .from(incidentReportsTable)
    .where(and(...conditions));

  const total = Number(totalResult?.count ?? 0);

  const reports = await db
    .select({
      report: incidentReportsTable,
      incidentType: incidentTypesTable,
    })
    .from(incidentReportsTable)
    .leftJoin(incidentTypesTable, eq(incidentReportsTable.incidentTypeId, incidentTypesTable.id))
    .where(and(...conditions))
    .orderBy(desc(incidentReportsTable.submittedAt))
    .limit(limit)
    .offset(offset);

  const [photoCountsRaw] = await Promise.all([
    db.select({ reportId: reportPhotosTable.reportId, count: count() })
      .from(reportPhotosTable)
      .groupBy(reportPhotosTable.reportId),
  ]);

  const photoCountMap = Object.fromEntries(
    photoCountsRaw.map ? photoCountsRaw.map((r: any) => [r.reportId, Number(r.count)]) : []
  );

  res.json({
    reports: reports.map(({ report, incidentType }) => ({
      id: report.id,
      referenceNumber: report.referenceNumber,
      groupSlug: slug,
      incidentTypeId: report.incidentTypeId,
      incidentTypeName: incidentType?.name ?? "Unknown",
      severity: report.severity,
      description: report.description,
      latitude: report.latitude,
      longitude: report.longitude,
      status: report.status,
      isAnonymous: report.isAnonymous,
      claimedByUserId: report.claimedByUserId,
      claimedByName: null,
      submittedAt: report.submittedAt,
      photoCount: photoCountMap[report.id] ?? 0,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
});

router.post("/groups/:groupSlug/reports", requireAuth, async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.groupSlug) ? req.params.groupSlug[0] : req.params.groupSlug;
  const group = await getGroupBySlug(slug);
  if (!group) { res.status(404).json({ error: "Group not found" }); return; }

  const { incidentTypeId, severity, description, latitude, longitude, isAnonymous = false } = req.body;

  if (!incidentTypeId || !severity || !description) {
    res.status(422).json({ error: "Incident type, severity and description are required" });
    return;
  }

  if (description.length < 10) {
    res.status(422).json({ error: "Description must be at least 10 characters" });
    return;
  }

  // Verify incident type belongs to this group
  const [incidentType] = await db
    .select()
    .from(incidentTypesTable)
    .where(and(eq(incidentTypesTable.id, incidentTypeId), eq(incidentTypesTable.groupId, group.id)));

  if (!incidentType) {
    res.status(422).json({ error: "Invalid incident type for this group" });
    return;
  }

  // Check if filer is a responder (for auto-claim)
  const member = await getMemberRecord(group.id, req.session.userId!);
  const isResponder = member?.role === "responder" || member?.role === "admin";

  const referenceNumber = generateReferenceNumber();

  const [reporterUser] = await db
    .select({ name: usersTable.name })
    .from(usersTable)
    .where(eq(usersTable.id, req.session.userId!));

  const [report] = await db
    .insert(incidentReportsTable)
    .values({
      referenceNumber,
      groupId: group.id,
      incidentTypeId,
      reporterId: req.session.userId!,
      reporterNameSnapshot: reporterUser?.name ?? "Unknown",
      severity,
      description,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      isAnonymous,
      status: "open",
      claimedByUserId: isResponder ? req.session.userId! : null,
      claimedAt: isResponder ? new Date() : null,
    })
    .returning();

  // Add initial timeline entry
  await db.insert(reportUpdatesTable).values({
    reportId: report.id,
    actorId: req.session.userId!,
    actorNameSnapshot: reporterUser?.name ?? "Unknown",
    updateType: isResponder ? "auto_claim" : "note",
    note: isResponder ? "Report filed and auto-assigned" : "Report submitted",
  });

  res.status(201).json({
    id: report.id,
    referenceNumber: report.referenceNumber,
    groupSlug: slug,
    incidentTypeId: report.incidentTypeId,
    incidentTypeName: incidentType.name,
    severity: report.severity,
    description: report.description,
    latitude: report.latitude,
    longitude: report.longitude,
    status: report.status,
    isAnonymous: report.isAnonymous,
    claimedByUserId: report.claimedByUserId,
    claimedByName: isResponder ? reporterUser?.name ?? null : null,
    submittedAt: report.submittedAt,
    photoCount: 0,
  });
});

router.get("/groups/:groupSlug/reports/:referenceNumber", requireAuth, async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.groupSlug) ? req.params.groupSlug[0] : req.params.groupSlug;
  const refNum = Array.isArray(req.params.referenceNumber) ? req.params.referenceNumber[0] : req.params.referenceNumber;
  const group = await getGroupBySlug(slug);
  if (!group) { res.status(404).json({ error: "Group not found" }); return; }

  const member = await getMemberRecord(group.id, req.session.userId!);
  if (!member) { res.status(403).json({ error: "You are not a member of this group" }); return; }

  const [result] = await db
    .select({ report: incidentReportsTable, incidentType: incidentTypesTable })
    .from(incidentReportsTable)
    .leftJoin(incidentTypesTable, eq(incidentReportsTable.incidentTypeId, incidentTypesTable.id))
    .where(and(
      eq(incidentReportsTable.referenceNumber, refNum),
      eq(incidentReportsTable.groupId, group.id)
    ));

  if (!result) { res.status(404).json({ error: "Report not found" }); return; }

  const { report, incidentType } = result;

  const photos = await db
    .select()
    .from(reportPhotosTable)
    .where(eq(reportPhotosTable.reportId, report.id));

  const updates = await db
    .select()
    .from(reportUpdatesTable)
    .where(eq(reportUpdatesTable.reportId, report.id))
    .orderBy(reportUpdatesTable.createdAt);

  res.json({
    report: {
      id: report.id,
      referenceNumber: report.referenceNumber,
      groupSlug: slug,
      incidentTypeId: report.incidentTypeId,
      incidentTypeName: incidentType?.name ?? "Unknown",
      severity: report.severity,
      description: report.description,
      latitude: report.latitude,
      longitude: report.longitude,
      status: report.status,
      isAnonymous: report.isAnonymous,
      claimedByUserId: report.claimedByUserId,
      claimedByName: null,
      submittedAt: report.submittedAt,
      photoCount: photos.length,
    },
    photos: photos.map(p => ({
      id: p.id,
      url: p.url,
      exifTakenAt: p.exifTakenAt,
      exifLatitude: p.exifLatitude,
      exifLongitude: p.exifLongitude,
      uploadedAt: p.uploadedAt,
    })),
    updates: updates.map(u => ({
      id: u.id,
      updateType: u.updateType,
      actorName: u.actorNameSnapshot,
      note: u.note,
      newStatus: u.newStatus,
      escalatedTo: u.escalatedTo,
      createdAt: u.createdAt,
    })),
    reporter: {
      name: report.isAnonymous ? "Anonymous" : (report.reporterNameSnapshot ?? "Unknown"),
      userId: report.isAnonymous ? null : report.reporterId,
    },
  });
});

router.post("/groups/:groupSlug/reports/:referenceNumber/updates", requireAuth, async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.groupSlug) ? req.params.groupSlug[0] : req.params.groupSlug;
  const refNum = Array.isArray(req.params.referenceNumber) ? req.params.referenceNumber[0] : req.params.referenceNumber;
  const group = await getGroupBySlug(slug);
  if (!group) { res.status(404).json({ error: "Group not found" }); return; }

  const member = await getMemberRecord(group.id, req.session.userId!);
  const perms = await getMemberPermissions(group.id, req.session.userId!);
  if (!member) { res.status(403).json({ error: "You are not a member of this group" }); return; }
  if (!perms?.canActionReports && member.role !== "admin") {
    res.status(403).json({ error: "You do not have permission to action reports" });
    return;
  }

  const [result] = await db
    .select()
    .from(incidentReportsTable)
    .where(and(
      eq(incidentReportsTable.referenceNumber, refNum),
      eq(incidentReportsTable.groupId, group.id)
    ));

  if (!result) { res.status(404).json({ error: "Report not found" }); return; }

  const [actorUser] = await db
    .select({ name: usersTable.name })
    .from(usersTable)
    .where(eq(usersTable.id, req.session.userId!));

  const { updateType, note, newStatus, escalationContactId } = req.body;

  if (!updateType) {
    res.status(422).json({ error: "Update type is required" });
    return;
  }

  // Handle claim — set claimedByUserId if not already claimed
  if (updateType === "claim") {
    if (!result.claimedByUserId) {
      await db.update(incidentReportsTable)
        .set({ claimedByUserId: req.session.userId!, claimedAt: new Date(), status: "in_progress" })
        .where(eq(incidentReportsTable.id, result.id));
    }
  }

  // Handle status change
  if (updateType === "status_change" && newStatus) {
    const statusUpdate: Record<string, unknown> = { status: newStatus };
    if (newStatus === "resolved") statusUpdate.resolvedAt = new Date();
    await db.update(incidentReportsTable)
      .set(statusUpdate)
      .where(eq(incidentReportsTable.id, result.id));
  }

  const [update] = await db
    .insert(reportUpdatesTable)
    .values({
      reportId: result.id,
      actorId: req.session.userId!,
      actorNameSnapshot: actorUser?.name ?? "Unknown",
      updateType,
      note: note ?? null,
      newStatus: newStatus ?? null,
      escalationContactId: escalationContactId ?? null,
    })
    .returning();

  res.status(201).json({
    id: update.id,
    updateType: update.updateType,
    actorName: update.actorNameSnapshot,
    note: update.note,
    newStatus: update.newStatus,
    escalatedTo: update.escalatedTo,
    createdAt: update.createdAt,
  });
});

export default router;
