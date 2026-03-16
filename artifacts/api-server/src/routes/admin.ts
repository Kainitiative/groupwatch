import { Router } from "express";
import { db } from "@workspace/db";
import {
  groupsTable,
  usersTable,
  groupMembersTable,
  subscriptionsTable,
  incidentReportsTable,
  platformSettingsTable,
} from "@workspace/db";
import { eq, count, and, desc } from "drizzle-orm";
import { requireAuth } from "../lib/session";

const router = Router();

async function requireSuperAdmin(req: any, res: any): Promise<boolean> {
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

export default router;
