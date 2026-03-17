import { Router } from "express";
import { db } from "@workspace/db";
import {
  incidentReportsTable,
  reportPhotosTable,
  reportUpdatesTable,
  incidentTypesTable,
  groupMembersTable,
  usersTable,
} from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { getGroupBySlug, generateReferenceNumber } from "../lib/groups";
import { sendReportNotificationEmail } from "../lib/email";
import { sendPushToGroupResponders } from "../lib/push";
import multer from "multer";
import path from "path";
import fs from "fs";
import exifr from "exifr";

const uploadsDir = path.join(process.cwd(), "uploads", "photos");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const photoUpload = multer({
  dest: uploadsDir,
  limits: { fileSize: 8 * 1024 * 1024, files: 5 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are accepted"));
  },
});

// Simple in-memory rate limiter: max 10 submissions per IP per hour
const ipSubmissions = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = ipSubmissions.get(ip);
  if (!entry || now > entry.resetAt) {
    ipSubmissions.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return true;
  }
  if (entry.count >= 10) return false;
  entry.count++;
  return true;
}

const router = Router();

// GET /api/widget/:slug — public info for the embed form
router.get("/widget/:slug", async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const group = await getGroupBySlug(slug);

  if (!group) {
    res.status(404).json({ error: "Group not found" });
    return;
  }

  if (!group.publicReportingEnabled) {
    res.status(403).json({ error: "Public reporting is not enabled for this group" });
    return;
  }

  const types = await db
    .select({ id: incidentTypesTable.id, name: incidentTypesTable.name, colour: incidentTypesTable.colour })
    .from(incidentTypesTable)
    .where(and(eq(incidentTypesTable.groupId, group.id), eq(incidentTypesTable.isActive, true)));

  res.json({
    groupName: group.name,
    groupType: group.groupType,
    brandColour: group.brandColour,
    logoUrl: group.logoUrl,
    incidentTypes: types,
  });
});

// POST /api/widget/:slug/report — submit a public report (no auth required)
router.post("/widget/:slug/report", photoUpload.array("photos", 5), async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const ip = (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() || req.ip || "unknown";

  if (!checkRateLimit(ip)) {
    res.status(429).json({ error: "Too many submissions — please try again later" });
    return;
  }

  const group = await getGroupBySlug(slug);
  if (!group) {
    res.status(404).json({ error: "Group not found" });
    return;
  }

  if (!group.publicReportingEnabled) {
    res.status(403).json({ error: "Public reporting is not enabled for this group" });
    return;
  }

  const { incidentTypeId, severity, description, reporterName, reporterEmail, latitude, longitude } = req.body;

  if (!incidentTypeId || !severity || !description) {
    res.status(422).json({ error: "Incident type, severity and description are required" });
    return;
  }

  if (description.length < 10) {
    res.status(422).json({ error: "Description must be at least 10 characters" });
    return;
  }

  const validSeverities = ["low", "medium", "high", "emergency"];
  if (!validSeverities.includes(severity)) {
    res.status(422).json({ error: "Invalid severity" });
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

  const referenceNumber = await generateReferenceNumber(group.id);
  const nameSnapshot = reporterName?.trim() || "Public Reporter";

  const [report] = await db
    .insert(incidentReportsTable)
    .values({
      groupId: group.id,
      incidentTypeId,
      reporterId: null,
      reporterNameSnapshot: nameSnapshot,
      severity,
      description,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      isAnonymous: false,
      referenceNumber,
      status: "open",
    })
    .returning();

  // Store reporter email as a note update if provided
  if (reporterEmail?.trim()) {
    await db.insert(reportUpdatesTable).values({
      reportId: report.id,
      actorId: null,
      actorNameSnapshot: nameSnapshot,
      updateType: "note",
      note: `Reporter contact email: ${reporterEmail.trim()} (submitted via public widget)`,
    });
  } else {
    await db.insert(reportUpdatesTable).values({
      reportId: report.id,
      actorId: null,
      actorNameSnapshot: nameSnapshot,
      updateType: "note",
      note: "Report submitted via public reporting widget",
    });
  }

  // Handle photo uploads
  const files = Array.isArray(req.files) ? req.files : [];
  for (const file of files as Express.Multer.File[]) {
    try {
      let exifLat: number | null = null;
      let exifLng: number | null = null;
      let exifTakenAt: Date | null = null;

      try {
        const exif = await exifr.parse(file.path, { gps: true, DateTimeOriginal: true });
        if (exif?.latitude) exifLat = exif.latitude;
        if (exif?.longitude) exifLng = exif.longitude;
        if (exif?.DateTimeOriginal) exifTakenAt = new Date(exif.DateTimeOriginal);
      } catch {}

      await db.insert(reportPhotosTable).values({
        reportId: report.id,
        url: `/uploads/photos/${file.filename}`,
        filePath: file.path,
        fileSize: file.size,
        uploadedByUserId: null,
        exifLatitude: exifLat,
        exifLongitude: exifLng,
        exifTakenAt,
      });
    } catch (err) {
      console.error("Failed to process widget photo", err);
    }
  }

  // Fire notifications asynchronously
  const reportUrl = `${process.env.APP_URL || "https://incidentiq.io"}/g/${slug}/reports/${referenceNumber}`;
  const notifTitle = `New ${incidentType.name} — ${severity.toUpperCase()} (Public)`;
  const notifBody = `${group.name} · ${referenceNumber} · via public form`;

  sendPushToGroupResponders(group.id, { title: notifTitle, body: notifBody, url: reportUrl }).catch(() => {});

  (async () => {
    try {
      const { groupMemberPermissionsTable } = await import("@workspace/db");
      const responders = await db
        .select({ user: usersTable })
        .from(groupMembersTable)
        .innerJoin(usersTable, eq(usersTable.id, groupMembersTable.userId))
        .innerJoin(groupMemberPermissionsTable, and(
          eq(groupMemberPermissionsTable.groupId, groupMembersTable.groupId),
          eq(groupMemberPermissionsTable.userId, groupMembersTable.userId),
        ))
        .where(and(
          eq(groupMembersTable.groupId, group.id),
          eq(groupMembersTable.status, "active"),
          eq(groupMemberPermissionsTable.canReceiveNotifications, true),
        ));

      await Promise.allSettled(
        responders.map(r => sendReportNotificationEmail(
          r.user.email,
          r.user.name,
          group.name,
          referenceNumber,
          incidentType.name,
          severity,
          reportUrl
        ))
      );
    } catch {}
  })();

  res.status(201).json({
    referenceNumber,
    message: "Report submitted successfully. Thank you for your report.",
  });
});

export default router;
