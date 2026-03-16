import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, groupMembersTable, groupsTable, subscriptionsTable, groupMemberPermissionsTable, incidentReportsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../lib/session";

const router = Router();

router.get("/users/me", requireAuth, async (req, res): Promise<void> => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.session.userId!));

  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    displayName: user.displayName,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    isPublic: user.isPublic,
    isSuperAdmin: user.isSuperAdmin,
    createdAt: user.createdAt,
  });
});

router.patch("/users/me", requireAuth, async (req, res): Promise<void> => {
  const { displayName, bio, isPublic } = req.body;

  const updates: Record<string, unknown> = {};
  if (displayName !== undefined) updates.displayName = displayName;
  if (bio !== undefined) updates.bio = bio;
  if (isPublic !== undefined) updates.isPublic = isPublic;

  const [user] = await db
    .update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, req.session.userId!))
    .returning();

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    displayName: user.displayName,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    isPublic: user.isPublic,
    isSuperAdmin: user.isSuperAdmin,
    createdAt: user.createdAt,
  });
});

router.get("/users/me/groups", requireAuth, async (req, res): Promise<void> => {
  const memberships = await db
    .select({
      group: groupsTable,
      member: groupMembersTable,
      permissions: groupMemberPermissionsTable,
      subscription: subscriptionsTable,
    })
    .from(groupMembersTable)
    .innerJoin(groupsTable, eq(groupMembersTable.groupId, groupsTable.id))
    .leftJoin(groupMemberPermissionsTable, and(
      eq(groupMemberPermissionsTable.groupId, groupMembersTable.groupId),
      eq(groupMemberPermissionsTable.userId, groupMembersTable.userId)
    ))
    .leftJoin(subscriptionsTable, eq(subscriptionsTable.groupId, groupsTable.id))
    .where(
      and(
        eq(groupMembersTable.userId, req.session.userId!),
        eq(groupMembersTable.status, "active")
      )
    );

  const groups = memberships.map(({ group, member, permissions, subscription }) => ({
    id: group.id,
    name: group.name,
    slug: group.slug,
    groupType: group.groupType,
    logoUrl: group.logoUrl,
    brandColour: group.brandColour,
    subscriptionStatus: subscription?.status ?? "trial",
    myRole: member.role,
    myPermissions: {
      canReceiveNotifications: permissions?.canReceiveNotifications ?? false,
      canViewDashboard: permissions?.canViewDashboard ?? false,
      canActionReports: permissions?.canActionReports ?? false,
      canFileReports: permissions?.canFileReports ?? true,
    },
  }));

  res.json(groups);
});

router.get("/users/me/reports", requireAuth, async (req, res): Promise<void> => {
  const reports = await db
    .select({
      report: incidentReportsTable,
      group: groupsTable,
    })
    .from(incidentReportsTable)
    .innerJoin(groupsTable, eq(incidentReportsTable.groupId, groupsTable.id))
    .where(eq(incidentReportsTable.reporterId, req.session.userId!));

  res.json(reports.map(({ report, group }) => ({
    id: report.id,
    referenceNumber: report.referenceNumber,
    groupSlug: group.slug,
    groupName: group.name,
    incidentTypeName: report.incidentTypeId,
    severity: report.severity,
    status: report.status,
    isAnonymous: report.isAnonymous,
    submittedAt: report.submittedAt,
  })));
});

export default router;
