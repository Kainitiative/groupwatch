import { Router } from "express";
import { db } from "@workspace/db";
import { incidentReportsTable, incidentTypesTable } from "@workspace/db";
import { eq, and, gte, sql } from "drizzle-orm";
import { requireAuth } from "../lib/session";
import { getGroupBySlug, getMemberRecord } from "../lib/groups";

const router = Router();

router.get("/groups/:groupSlug/analytics", requireAuth, async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.groupSlug) ? req.params.groupSlug[0] : req.params.groupSlug;
  const period = (req.query.period as string) || "month";

  const group = await getGroupBySlug(slug);
  if (!group) { res.status(404).json({ error: "Group not found" }); return; }

  const member = await getMemberRecord(group.id, req.session.userId!);
  if (!member || (member.role !== "admin" && !member.canViewDashboard)) {
    res.status(403).json({ error: "Access denied" }); return;
  }

  // Determine cutoff date
  const now = new Date();
  let cutoff: Date | null = null;
  if (period === "week") cutoff = new Date(now.getTime() - 7 * 86400000);
  else if (period === "month") cutoff = new Date(now.getTime() - 30 * 86400000);
  else if (period === "year") cutoff = new Date(now.getTime() - 365 * 86400000);

  const baseFilter = cutoff
    ? and(eq(incidentReportsTable.groupId, group.id), gte(incidentReportsTable.submittedAt, cutoff))
    : eq(incidentReportsTable.groupId, group.id);

  // All reports in period
  const reports = await db
    .select({
      id: incidentReportsTable.id,
      severity: incidentReportsTable.severity,
      status: incidentReportsTable.status,
      incidentTypeId: incidentReportsTable.incidentTypeId,
      submittedAt: incidentReportsTable.submittedAt,
      claimedAt: incidentReportsTable.claimedAt,
      resolvedAt: incidentReportsTable.resolvedAt,
    })
    .from(incidentReportsTable)
    .where(baseFilter);

  // Incident type names
  const types = await db
    .select({ id: incidentTypesTable.id, name: incidentTypesTable.name })
    .from(incidentTypesTable)
    .where(eq(incidentTypesTable.groupId, group.id));
  const typeMap = Object.fromEntries(types.map(t => [t.id, t.name]));

  // --- Reports over time (daily buckets) ---
  const buckets: Record<string, number> = {};
  // Determine bucket count and format
  const dayMs = 86400000;
  const numDays = period === "week" ? 7 : period === "month" ? 30 : period === "year" ? 52 : null;

  if (period === "year") {
    // Weekly buckets
    for (let i = 51; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 7 * dayMs);
      const key = `${d.getFullYear()}-W${String(getWeekNumber(d)).padStart(2, "0")}`;
      buckets[key] = 0;
    }
    reports.forEach(r => {
      const d = new Date(r.submittedAt);
      const key = `${d.getFullYear()}-W${String(getWeekNumber(d)).padStart(2, "0")}`;
      if (key in buckets) buckets[key]++;
    });
  } else if (period === "all") {
    // Monthly buckets, last 24 months
    for (let i = 23; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      buckets[key] = 0;
    }
    reports.forEach(r => {
      const d = new Date(r.submittedAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (key in buckets) buckets[key]++;
    });
  } else {
    // Daily buckets
    const days = numDays ?? 30;
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * dayMs);
      const key = d.toISOString().slice(0, 10);
      buckets[key] = 0;
    }
    reports.forEach(r => {
      const key = new Date(r.submittedAt).toISOString().slice(0, 10);
      if (key in buckets) buckets[key]++;
    });
  }
  const reportsOverTime = Object.entries(buckets).map(([date, count]) => ({ date, count }));

  // --- By severity ---
  const severityCounts: Record<string, number> = { low: 0, medium: 0, high: 0, emergency: 0 };
  reports.forEach(r => { if (r.severity in severityCounts) severityCounts[r.severity]++; });
  const bySeverity = Object.entries(severityCounts).map(([severity, count]) => ({ severity, count }));

  // --- By status ---
  const statusCounts: Record<string, number> = { open: 0, in_progress: 0, escalated: 0, resolved: 0 };
  reports.forEach(r => { if (r.status in statusCounts) statusCounts[r.status]++; });
  const byStatus = Object.entries(statusCounts).map(([status, count]) => ({ status, count }));

  // --- By incident type ---
  const typeCounts: Record<string, number> = {};
  reports.forEach(r => {
    const name = typeMap[r.incidentTypeId] ?? "Unknown";
    typeCounts[name] = (typeCounts[name] ?? 0) + 1;
  });
  const byType = Object.entries(typeCounts)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // --- Day of week ---
  const dowCounts = [0, 0, 0, 0, 0, 0, 0];
  reports.forEach(r => { dowCounts[new Date(r.submittedAt).getDay()]++; });
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const byDayOfWeek = dowCounts.map((count, i) => ({ day: dayLabels[i], count }));

  // --- Response time (claim lag) ---
  const claimLags = reports
    .filter(r => r.claimedAt)
    .map(r => (new Date(r.claimedAt!).getTime() - new Date(r.submittedAt).getTime()) / 60000);
  const avgResponseMinutes = claimLags.length > 0 ? Math.round(claimLags.reduce((a, b) => a + b, 0) / claimLags.length) : null;

  // --- Resolution time ---
  const resolutionTimes = reports
    .filter(r => r.claimedAt && r.resolvedAt)
    .map(r => (new Date(r.resolvedAt!).getTime() - new Date(r.claimedAt!).getTime()) / 60000);
  const avgResolutionMinutes = resolutionTimes.length > 0 ? Math.round(resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length) : null;

  res.json({
    total: reports.length,
    reportsOverTime,
    bySeverity,
    byStatus,
    byType,
    byDayOfWeek,
    avgResponseMinutes,
    avgResolutionMinutes,
  });
});

function getWeekNumber(d: Date): number {
  const onejan = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((((d.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7);
}

// CSV Export
router.get("/groups/:groupSlug/reports/export/csv", requireAuth, async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.groupSlug) ? req.params.groupSlug[0] : req.params.groupSlug;

  const group = await getGroupBySlug(slug);
  if (!group) { res.status(404).json({ error: "Group not found" }); return; }

  const member = await getMemberRecord(group.id, req.session.userId!);
  if (!member || (member.role !== "admin" && !member.canViewDashboard)) {
    res.status(403).json({ error: "Access denied" }); return;
  }

  const reports = await db
    .select({
      referenceNumber: incidentReportsTable.referenceNumber,
      incidentTypeId: incidentReportsTable.incidentTypeId,
      severity: incidentReportsTable.severity,
      description: incidentReportsTable.description,
      latitude: incidentReportsTable.latitude,
      longitude: incidentReportsTable.longitude,
      status: incidentReportsTable.status,
      isAnonymous: incidentReportsTable.isAnonymous,
      submittedAt: incidentReportsTable.submittedAt,
      claimedAt: incidentReportsTable.claimedAt,
      resolvedAt: incidentReportsTable.resolvedAt,
    })
    .from(incidentReportsTable)
    .where(eq(incidentReportsTable.groupId, group.id));

  const types = await db
    .select({ id: incidentTypesTable.id, name: incidentTypesTable.name })
    .from(incidentTypesTable)
    .where(eq(incidentTypesTable.groupId, group.id));
  const typeMap = Object.fromEntries(types.map(t => [t.id, t.name]));

  const escape = (v: unknown) => {
    const s = String(v ?? "");
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const header = ["Reference", "Incident Type", "Severity", "Status", "Description", "Latitude", "Longitude", "Anonymous", "Submitted At", "Claimed At", "Resolved At"];
  const rows = reports.map(r => [
    r.referenceNumber,
    typeMap[r.incidentTypeId] ?? "",
    r.severity,
    r.status,
    r.description,
    r.latitude ?? "",
    r.longitude ?? "",
    r.isAnonymous ? "Yes" : "No",
    r.submittedAt ? new Date(r.submittedAt).toISOString() : "",
    r.claimedAt ? new Date(r.claimedAt).toISOString() : "",
    r.resolvedAt ? new Date(r.resolvedAt).toISOString() : "",
  ].map(escape).join(","));

  const csv = [header.join(","), ...rows].join("\n");
  const filename = `${slug}-incidents-${new Date().toISOString().slice(0, 10)}.csv`;

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(csv);
});

export default router;
