import { Router } from "express";
import { db } from "@workspace/db";
import {
  groupMembersTable,
  groupMemberPermissionsTable,
  usersTable,
  joinRequestsTable,
  setupProgressTable,
  memberInvitesTable,
} from "@workspace/db";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";
import { requireAuth } from "../lib/session";
import { getGroupBySlug, getMemberRecord } from "../lib/groups";
import { sendMemberInviteEmail } from "../lib/email";

const router = Router();

router.get("/groups/:groupSlug/members", requireAuth, async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.groupSlug) ? req.params.groupSlug[0] : req.params.groupSlug;
  const group = await getGroupBySlug(slug);
  if (!group) { res.status(404).json({ error: "Group not found" }); return; }

  const callerMember = await getMemberRecord(group.id, req.session.userId!);
  if (!callerMember) { res.status(403).json({ error: "You are not a member of this group" }); return; }

  const members = await db
    .select({
      member: groupMembersTable,
      user: usersTable,
      permissions: groupMemberPermissionsTable,
    })
    .from(groupMembersTable)
    .innerJoin(usersTable, eq(groupMembersTable.userId, usersTable.id))
    .leftJoin(groupMemberPermissionsTable, and(
      eq(groupMemberPermissionsTable.groupId, groupMembersTable.groupId),
      eq(groupMemberPermissionsTable.userId, groupMembersTable.userId)
    ))
    .where(and(
      eq(groupMembersTable.groupId, group.id),
      eq(groupMembersTable.status, "active")
    ));

  res.json(members.map(({ member, user, permissions }) => ({
    userId: user.id,
    name: user.name,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    role: member.role,
    roleTitle: member.roleTitle,
    permissions: {
      canReceiveNotifications: permissions?.canReceiveNotifications ?? false,
      canViewDashboard: permissions?.canViewDashboard ?? false,
      canActionReports: permissions?.canActionReports ?? false,
      canFileReports: permissions?.canFileReports ?? true,
    },
    isActive: member.status === "active",
    joinedAt: member.joinedAt,
  })));
});

router.post("/groups/:groupSlug/members/invite", requireAuth, async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.groupSlug) ? req.params.groupSlug[0] : req.params.groupSlug;
  const group = await getGroupBySlug(slug);
  if (!group) { res.status(404).json({ error: "Group not found" }); return; }

  const callerMember = await getMemberRecord(group.id, req.session.userId!);
  if (!callerMember || callerMember.role !== "admin") {
    res.status(403).json({ error: "Only group admins can invite members" });
    return;
  }

  const [caller] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, req.session.userId!));

  const { email, role = "member" } = req.body;
  if (!email) { res.status(422).json({ error: "Email is required" }); return; }

  const normalizedEmail = email.toLowerCase().trim();
  const validRoles = ["admin", "responder", "member"] as const;
  const memberRole = validRoles.includes(role) ? (role as typeof validRoles[number]) : "member";

  // Check if user already a member by email
  const [existingUser] = await db.select().from(usersTable).where(eq(usersTable.email, normalizedEmail));
  if (existingUser) {
    const existingMember = await getMemberRecord(group.id, existingUser.id);
    if (existingMember) {
      res.status(409).json({ error: "This user is already a member of the group" });
      return;
    }
    // Auto-add existing user and send notification
    await db.insert(groupMembersTable).values({
      groupId: group.id,
      userId: existingUser.id,
      role: memberRole,
      status: "active",
    }).onConflictDoNothing();

    await db.insert(groupMemberPermissionsTable).values({
      groupId: group.id,
      userId: existingUser.id,
      canFileReports: true,
    }).onConflictDoNothing();

    const appUrl = process.env.APP_URL || "https://groupwatchplatform.com";
    const inviteUrl = `${appUrl}/dashboard`;
    sendMemberInviteEmail(normalizedEmail, group.name, caller?.name ?? "Group Admin", inviteUrl).catch(() => {});
    res.json({ message: `${existingUser.name} has been added to the group` });
    return;
  }

  // User does not exist — create a pending invite token and send email
  const existingInvite = await db
    .select({ id: memberInvitesTable.id })
    .from(memberInvitesTable)
    .where(and(
      eq(memberInvitesTable.groupId, group.id),
      eq(memberInvitesTable.email, normalizedEmail)
    ))
    .limit(1);

  if (existingInvite.length > 0) {
    res.status(409).json({ error: "An invitation has already been sent to this email" });
    return;
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await db.insert(memberInvitesTable).values({
    groupId: group.id,
    email: normalizedEmail,
    role: memberRole,
    invitedByUserId: req.session.userId!,
    token,
    expiresAt,
  });

  const appUrl = process.env.APP_URL || "https://groupwatchplatform.com";
  const inviteUrl = `${appUrl}/register?invite=${token}`;
  sendMemberInviteEmail(normalizedEmail, group.name, caller?.name ?? "Group Admin", inviteUrl).catch(() => {});

  res.json({ message: `Invitation sent to ${normalizedEmail}` });
});

router.get("/groups/:groupSlug/members/join-requests", requireAuth, async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.groupSlug) ? req.params.groupSlug[0] : req.params.groupSlug;
  const group = await getGroupBySlug(slug);
  if (!group) { res.status(404).json({ error: "Group not found" }); return; }

  const callerMember = await getMemberRecord(group.id, req.session.userId!);
  if (!callerMember || callerMember.role !== "admin") {
    res.status(403).json({ error: "Only group admins can view join requests" });
    return;
  }

  const requests = await db
    .select({ request: joinRequestsTable, user: usersTable })
    .from(joinRequestsTable)
    .innerJoin(usersTable, eq(joinRequestsTable.userId, usersTable.id))
    .where(and(
      eq(joinRequestsTable.groupId, group.id),
      eq(joinRequestsTable.status, "pending")
    ));

  res.json(requests.map(({ request, user }) => ({
    id: request.id,
    userId: user.id,
    name: user.name,
    email: user.email,
    requestedAt: request.createdAt,
  })));
});

router.post("/groups/:groupSlug/members/join-requests/:requestId", requireAuth, async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.groupSlug) ? req.params.groupSlug[0] : req.params.groupSlug;
  const requestId = Array.isArray(req.params.requestId) ? req.params.requestId[0] : req.params.requestId;
  const group = await getGroupBySlug(slug);
  if (!group) { res.status(404).json({ error: "Group not found" }); return; }

  const callerMember = await getMemberRecord(group.id, req.session.userId!);
  if (!callerMember || callerMember.role !== "admin") {
    res.status(403).json({ error: "Only group admins can action join requests" });
    return;
  }

  const { action } = req.body;
  if (!action || !["approve", "reject"].includes(action)) {
    res.status(422).json({ error: "Action must be 'approve' or 'reject'" });
    return;
  }

  const [request] = await db
    .select()
    .from(joinRequestsTable)
    .where(and(eq(joinRequestsTable.id, requestId), eq(joinRequestsTable.groupId, group.id)));

  if (!request) { res.status(404).json({ error: "Join request not found" }); return; }

  await db.update(joinRequestsTable)
    .set({ status: action === "approve" ? "approved" : "rejected", respondedAt: new Date() })
    .where(eq(joinRequestsTable.id, requestId));

  if (action === "approve") {
    await db.insert(groupMembersTable).values({
      groupId: group.id,
      userId: request.userId,
      role: "member",
      status: "active",
    }).onConflictDoNothing();

    await db.insert(groupMemberPermissionsTable).values({
      groupId: group.id,
      userId: request.userId,
      canFileReports: true,
    }).onConflictDoNothing();
  }

  res.json({ message: `Join request ${action === "approve" ? "approved" : "rejected"}` });
});

router.patch("/groups/:groupSlug/members/:userId", requireAuth, async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.groupSlug) ? req.params.groupSlug[0] : req.params.groupSlug;
  const targetUserId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
  const group = await getGroupBySlug(slug);
  if (!group) { res.status(404).json({ error: "Group not found" }); return; }

  const callerMember = await getMemberRecord(group.id, req.session.userId!);
  if (!callerMember || callerMember.role !== "admin") {
    res.status(403).json({ error: "Only group admins can update members" });
    return;
  }

  const { role, roleTitle, isActive, permissions } = req.body;

  // Prevent demoting the last admin
  if (role && role !== "admin") {
    const targetMember = await db
      .select()
      .from(groupMembersTable)
      .where(and(eq(groupMembersTable.groupId, group.id), eq(groupMembersTable.userId, targetUserId)))
      .limit(1);
    if (targetMember[0]?.role === "admin") {
      const allAdmins = await db
        .select()
        .from(groupMembersTable)
        .where(and(
          eq(groupMembersTable.groupId, group.id),
          eq(groupMembersTable.role, "admin"),
          eq(groupMembersTable.status, "active")
        ));
      if (allAdmins.length <= 1) {
        res.status(422).json({ error: "Cannot demote the last admin. Promote another member to admin first." });
        return;
      }
    }
  }

  if (role || roleTitle !== undefined || isActive !== undefined) {
    const memberUpdates: Record<string, unknown> = {};
    if (role) memberUpdates.role = role;
    if (roleTitle !== undefined) memberUpdates.roleTitle = roleTitle;
    if (isActive !== undefined) memberUpdates.status = isActive ? "active" : "removed";

    await db.update(groupMembersTable)
      .set(memberUpdates)
      .where(and(
        eq(groupMembersTable.groupId, group.id),
        eq(groupMembersTable.userId, targetUserId)
      ));

    // Update setup progress if a responder is being assigned
    if (role === "responder") {
      await db.update(setupProgressTable)
        .set({ responderAssigned: true })
        .where(eq(setupProgressTable.groupId, group.id));
    }
  }

  if (permissions) {
    await db.insert(groupMemberPermissionsTable)
      .values({
        groupId: group.id,
        userId: targetUserId,
        canReceiveNotifications: permissions.canReceiveNotifications ?? false,
        canViewDashboard: permissions.canViewDashboard ?? false,
        canActionReports: permissions.canActionReports ?? false,
        canFileReports: permissions.canFileReports ?? true,
      })
      .onConflictDoUpdate({
        target: [groupMemberPermissionsTable.groupId, groupMemberPermissionsTable.userId],
        set: {
          canReceiveNotifications: permissions.canReceiveNotifications ?? false,
          canViewDashboard: permissions.canViewDashboard ?? false,
          canActionReports: permissions.canActionReports ?? false,
          canFileReports: permissions.canFileReports ?? true,
        }
      });
  }

  const [updatedMember] = await db
    .select({ member: groupMembersTable, user: usersTable, perms: groupMemberPermissionsTable })
    .from(groupMembersTable)
    .innerJoin(usersTable, eq(groupMembersTable.userId, usersTable.id))
    .leftJoin(groupMemberPermissionsTable, and(
      eq(groupMemberPermissionsTable.groupId, groupMembersTable.groupId),
      eq(groupMemberPermissionsTable.userId, groupMembersTable.userId)
    ))
    .where(and(
      eq(groupMembersTable.groupId, group.id),
      eq(groupMembersTable.userId, targetUserId)
    ));

  if (!updatedMember) { res.status(404).json({ error: "Member not found" }); return; }

  res.json({
    userId: updatedMember.user.id,
    name: updatedMember.user.name,
    email: updatedMember.user.email,
    displayName: updatedMember.user.displayName,
    avatarUrl: updatedMember.user.avatarUrl,
    role: updatedMember.member.role,
    roleTitle: updatedMember.member.roleTitle,
    permissions: {
      canReceiveNotifications: updatedMember.perms?.canReceiveNotifications ?? false,
      canViewDashboard: updatedMember.perms?.canViewDashboard ?? false,
      canActionReports: updatedMember.perms?.canActionReports ?? false,
      canFileReports: updatedMember.perms?.canFileReports ?? true,
    },
    isActive: updatedMember.member.status === "active",
    joinedAt: updatedMember.member.joinedAt,
  });
});

router.delete("/groups/:groupSlug/members/:userId", requireAuth, async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.groupSlug) ? req.params.groupSlug[0] : req.params.groupSlug;
  const targetUserId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
  const group = await getGroupBySlug(slug);
  if (!group) { res.status(404).json({ error: "Group not found" }); return; }

  const callerMember = await getMemberRecord(group.id, req.session.userId!);
  if (!callerMember || callerMember.role !== "admin") {
    res.status(403).json({ error: "Only group admins can remove members" });
    return;
  }

  await db.update(groupMembersTable)
    .set({ status: "removed" })
    .where(and(
      eq(groupMembersTable.groupId, group.id),
      eq(groupMembersTable.userId, targetUserId)
    ));

  res.json({ message: "Member removed from group" });
});

export default router;
