import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import {
  groupsTable,
  usersTable,
  groupMembersTable,
  subscriptionsTable,
  incidentReportsTable,
  platformSettingsTable,
  errorLogsTable,
} from "@workspace/db";
import { eq, count, desc, lt } from "drizzle-orm";
import { requireAuth } from "../lib/session";

const router = Router();

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

router.get("/admin/groups", requireAuth, async (req, res): Promise<void> => {
  if (!await requireSuperAdmin(req, res)) return;

  const page = parseInt(String(req.query.page || "1"));
  const limit = Math.min(parseInt(String(req.query.limit || "50")), 100);
  const offset = (page - 1) * limit;

  const [totalResult] = await db
    .select({ count: count() })
    .from(groupsTable);

  const total = Number(totalResult?.count ?? 0);

  const groups = await db
    .select({
      group: groupsTable,
      subscription: subscriptionsTable,
    })
    .from(groupsTable)
    .leftJoin(subscriptionsTable, eq(subscriptionsTable.groupId, groupsTable.id))
    .orderBy(desc(groupsTable.createdAt))
    .limit(limit)
    .offset(offset);

  const groupIds = groups.map(g => g.group.id);

  const memberCounts = await db
    .select({ groupId: groupMembersTable.groupId, count: count() })
    .from(groupMembersTable)
    .where(eq(groupMembersTable.status, "active"))
    .groupBy(groupMembersTable.groupId);

  const reportCounts = await db
    .select({ groupId: incidentReportsTable.groupId, count: count() })
    .from(incidentReportsTable)
    .groupBy(incidentReportsTable.groupId);

  const memberCountMap = Object.fromEntries(memberCounts.map(m => [m.groupId, Number(m.count)]));
  const reportCountMap = Object.fromEntries(reportCounts.map(r => [r.groupId, Number(r.count)]));

  // Get owner emails
  const ownerIds = groups.map(g => g.group.ownerUserId);
  const owners = await db.select({ id: usersTable.id, email: usersTable.email })
    .from(usersTable);
  const ownerMap = Object.fromEntries(owners.map(o => [o.id, o.email]));

  res.json({
    groups: groups.map(({ group, subscription }) => ({
      id: group.id,
      name: group.name,
      slug: group.slug,
      groupType: group.groupType,
      subscriptionStatus: subscription?.status ?? "trial",
      trialEndsAt: subscription?.trialEndsAt ?? null,
      memberCount: memberCountMap[group.id] ?? 0,
      reportCount: reportCountMap[group.id] ?? 0,
      createdAt: group.createdAt,
      adminEmail: ownerMap[group.ownerUserId] ?? "",
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
});

router.post("/admin/groups/:groupSlug/activate", requireAuth, async (req, res): Promise<void> => {
  if (!await requireSuperAdmin(req, res)) return;

  const slug = Array.isArray(req.params.groupSlug) ? req.params.groupSlug[0] : req.params.groupSlug;
  const [group] = await db.select().from(groupsTable).where(eq(groupsTable.slug, slug));
  if (!group) { res.status(404).json({ error: "Group not found" }); return; }

  await db.update(subscriptionsTable)
    .set({ status: "active" })
    .where(eq(subscriptionsTable.groupId, group.id));

  res.json({ message: `Group ${group.name} activated` });
});

router.post("/admin/groups/:groupSlug/extend-trial", requireAuth, async (req, res): Promise<void> => {
  if (!await requireSuperAdmin(req, res)) return;

  const slug = Array.isArray(req.params.groupSlug) ? req.params.groupSlug[0] : req.params.groupSlug;
  const [group] = await db.select().from(groupsTable).where(eq(groupsTable.slug, slug));
  if (!group) { res.status(404).json({ error: "Group not found" }); return; }

  const days = parseInt(String(req.body.days));
  if (!days || days < 1 || days > 365) {
    res.status(422).json({ error: "Days must be between 1 and 365" });
    return;
  }

  const [sub] = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.groupId, group.id));

  // Extend from current trial end if still in future, otherwise extend from today
  const base = sub?.trialEndsAt && new Date(sub.trialEndsAt) > new Date()
    ? new Date(sub.trialEndsAt)
    : new Date();

  const newTrialEnd = new Date(base);
  newTrialEnd.setDate(newTrialEnd.getDate() + days);

  await db.update(subscriptionsTable)
    .set({ trialEndsAt: newTrialEnd, status: "trial" })
    .where(eq(subscriptionsTable.groupId, group.id));

  res.json({ message: `Trial extended by ${days} days`, trialEndsAt: newTrialEnd });
});

router.get("/admin/platform-settings", requireAuth, async (req, res): Promise<void> => {
  if (!await requireSuperAdmin(req, res)) return;

  const settings = await db.select().from(platformSettingsTable).limit(1);

  if (!settings[0]) {
    const [created] = await db.insert(platformSettingsTable)
      .values({ reportingEnabled: true, maintenanceMode: false })
      .returning();
    res.json({ reportingEnabled: created.reportingEnabled, maintenanceMode: created.maintenanceMode, updatedAt: created.updatedAt });
    return;
  }

  const s = settings[0];
  res.json({ reportingEnabled: s.reportingEnabled, maintenanceMode: s.maintenanceMode, updatedAt: s.updatedAt });
});

router.patch("/admin/platform-settings", requireAuth, async (req, res): Promise<void> => {
  if (!await requireSuperAdmin(req, res)) return;

  const { reportingEnabled, maintenanceMode } = req.body;
  const updates: Record<string, unknown> = {};
  if (reportingEnabled !== undefined) updates.reportingEnabled = reportingEnabled;
  if (maintenanceMode !== undefined) updates.maintenanceMode = maintenanceMode;

  const existing = await db.select().from(platformSettingsTable).limit(1);

  let result;
  if (!existing[0]) {
    [result] = await db.insert(platformSettingsTable)
      .values({ reportingEnabled: true, maintenanceMode: false, ...updates })
      .returning();
  } else {
    [result] = await db.update(platformSettingsTable)
      .set(updates)
      .where(eq(platformSettingsTable.id, existing[0].id))
      .returning();
  }

  res.json({ reportingEnabled: result.reportingEnabled, maintenanceMode: result.maintenanceMode, updatedAt: result.updatedAt });
});

router.get("/admin/users", requireAuth, async (req, res): Promise<void> => {
  if (!await requireSuperAdmin(req, res)) return;

  const page = parseInt(String(req.query.page || "1"));
  const limit = Math.min(parseInt(String(req.query.limit || "50")), 200);
  const offset = (page - 1) * limit;
  const search = String(req.query.search || "").trim().toLowerCase();

  const allUsers = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      isSuperAdmin: usersTable.isSuperAdmin,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)
    .orderBy(desc(usersTable.createdAt));

  const filtered = search
    ? allUsers.filter(u => u.email.toLowerCase().includes(search) || (u.name ?? "").toLowerCase().includes(search))
    : allUsers;

  const memberCounts = await db
    .select({ userId: groupMembersTable.userId, count: count() })
    .from(groupMembersTable)
    .where(eq(groupMembersTable.status, "active"))
    .groupBy(groupMembersTable.userId);
  const memberCountMap = Object.fromEntries(memberCounts.map(m => [m.userId, Number(m.count)]));

  const paginated = filtered.slice(offset, offset + limit);

  res.json({
    users: paginated.map(u => ({ ...u, groupCount: memberCountMap[u.id] ?? 0 })),
    total: filtered.length,
    page,
    limit,
    totalPages: Math.ceil(filtered.length / limit),
  });
});

router.patch("/admin/users/:userId", requireAuth, async (req, res): Promise<void> => {
  if (!await requireSuperAdmin(req, res)) return;

  const { isSuperAdmin } = req.body;
  if (typeof isSuperAdmin !== "boolean") {
    res.status(400).json({ error: "isSuperAdmin (boolean) is required" }); return;
  }

  const [updated] = await db
    .update(usersTable)
    .set({ isSuperAdmin })
    .where(eq(usersTable.id, req.params.userId))
    .returning({ id: usersTable.id, email: usersTable.email, isSuperAdmin: usersTable.isSuperAdmin });

  if (!updated) { res.status(404).json({ error: "User not found" }); return; }
  res.json(updated);
});

router.get("/admin/revenue", requireAuth, async (req, res): Promise<void> => {
  if (!await requireSuperAdmin(req, res)) return;

  const subs = await db.select().from(subscriptionsTable);

  const activeMonthly = subs.filter(s => s.status === "active" && s.plan === "monthly").length;
  const activeAnnual = subs.filter(s => s.status === "active" && s.plan === "annual").length;
  const trialGroups = subs.filter(s => s.status === "trial").length;

  // €20/month or €200/year ÷ 12 ≈ €16.67/month equivalent
  const estimatedMrrEuros = (activeMonthly * 20) + (activeAnnual * (200 / 12));

  const [totalResult] = await db.select({ count: count() }).from(groupsTable);

  res.json({
    activeMonthly,
    activeAnnual,
    trialGroups,
    estimatedMrrEuros: Math.round(estimatedMrrEuros * 100) / 100,
    totalGroups: Number(totalResult?.count ?? 0),
  });
});

router.get("/admin/errors", requireAuth, async (req, res): Promise<void> => {
  if (!await requireSuperAdmin(req, res)) return;

  const page = parseInt(String(req.query.page || "1"));
  const limit = Math.min(parseInt(String(req.query.limit || "50")), 200);
  const offset = (page - 1) * limit;
  const level = req.query.level ? String(req.query.level) : undefined;

  const [totalResult] = await db
    .select({ count: count() })
    .from(errorLogsTable);

  const query = db
    .select()
    .from(errorLogsTable)
    .orderBy(desc(errorLogsTable.createdAt))
    .limit(limit)
    .offset(offset);

  const rows = await query;

  const filtered = level ? rows.filter(r => r.level === level) : rows;

  res.json({
    errors: filtered,
    total: Number(totalResult?.count ?? 0),
    page,
    limit,
    totalPages: Math.ceil(Number(totalResult?.count ?? 0) / limit),
  });
});

router.delete("/admin/errors", requireAuth, async (req, res): Promise<void> => {
  if (!await requireSuperAdmin(req, res)) return;

  // Delete all errors older than 0 seconds (i.e. all)
  await db.delete(errorLogsTable);
  res.json({ message: "All error logs cleared" });
});

router.delete("/admin/errors/:id", requireAuth, async (req, res): Promise<void> => {
  if (!await requireSuperAdmin(req, res)) return;

  await db.delete(errorLogsTable).where(eq(errorLogsTable.id, req.params.id));
  res.json({ message: "Error log entry deleted" });
});

export default router;
