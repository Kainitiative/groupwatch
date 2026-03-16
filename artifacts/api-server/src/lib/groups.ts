import crypto from "crypto";
import { db } from "@workspace/db";
import {
  groupsTable,
  groupMembersTable,
  groupMemberPermissionsTable,
  subscriptionsTable,
  setupProgressTable,
} from "@workspace/db";
import { eq, and } from "drizzle-orm";

export function generateJoinToken(): string {
  return crypto.randomBytes(24).toString("hex");
}

export function generateReferenceNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `IR-${year}-${rand}`;
}

export async function getGroupBySlug(slug: string) {
  const [group] = await db
    .select()
    .from(groupsTable)
    .where(eq(groupsTable.slug, slug));
  return group ?? null;
}

export async function getMemberRecord(groupId: string, userId: string) {
  const [member] = await db
    .select()
    .from(groupMembersTable)
    .where(
      and(
        eq(groupMembersTable.groupId, groupId),
        eq(groupMembersTable.userId, userId),
        eq(groupMembersTable.status, "active")
      )
    );
  return member ?? null;
}

export async function getMemberPermissions(groupId: string, userId: string) {
  const [perms] = await db
    .select()
    .from(groupMemberPermissionsTable)
    .where(
      and(
        eq(groupMemberPermissionsTable.groupId, groupId),
        eq(groupMemberPermissionsTable.userId, userId)
      )
    );
  return perms ?? null;
}

export async function requireGroupAdmin(groupId: string, userId: string): Promise<boolean> {
  const member = await getMemberRecord(groupId, userId);
  return member?.role === "admin";
}

export async function requireGroupMember(groupId: string, userId: string): Promise<boolean> {
  const member = await getMemberRecord(groupId, userId);
  return member !== null;
}

export async function createGroupWithTrial(
  name: string,
  slug: string,
  groupType: string,
  ownerUserId: string,
  opts: {
    description?: string | null;
    website?: string | null;
    contactEmail?: string | null;
  } = {}
) {
  const joinToken = generateJoinToken();
  const trialEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  return await db.transaction(async (tx) => {
    const [group] = await tx
      .insert(groupsTable)
      .values({
        name,
        slug,
        groupType,
        ownerUserId,
        joinToken,
        description: opts.description ?? null,
        website: opts.website ?? null,
        contactEmail: opts.contactEmail ?? null,
      })
      .returning();

    await tx.insert(subscriptionsTable).values({
      groupId: group.id,
      status: "trial",
      trialEndsAt,
    });

    await tx.insert(groupMembersTable).values({
      groupId: group.id,
      userId: ownerUserId,
      role: "admin",
      status: "active",
    });

    await tx.insert(groupMemberPermissionsTable).values({
      groupId: group.id,
      userId: ownerUserId,
      canReceiveNotifications: true,
      canViewDashboard: true,
      canActionReports: true,
      canFileReports: true,
    });

    await tx.insert(setupProgressTable).values({
      groupId: group.id,
    });

    return group;
  });
}
