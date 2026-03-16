import { pgTable, text, boolean, timestamp, uuid, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { groupsTable } from "./groups";

export const groupMembersTable = pgTable("group_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id").notNull().references(() => groupsTable.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["admin", "responder", "member"] }).notNull().default("member"),
  roleTitle: text("role_title"),
  status: text("status", { enum: ["pending", "active", "removed"] }).notNull().default("active"),
  joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique("group_member_unique").on(t.groupId, t.userId),
]);

export const groupMemberPermissionsTable = pgTable("group_member_permissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id").notNull().references(() => groupsTable.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  canReceiveNotifications: boolean("can_receive_notifications").notNull().default(false),
  canViewDashboard: boolean("can_view_dashboard").notNull().default(false),
  canActionReports: boolean("can_action_reports").notNull().default(false),
  canFileReports: boolean("can_file_reports").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (t) => [
  unique("group_member_permissions_unique").on(t.groupId, t.userId),
]);

export const joinRequestsTable = pgTable("join_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id").notNull().references(() => groupsTable.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  status: text("status", { enum: ["pending", "approved", "rejected"] }).notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  respondedAt: timestamp("responded_at", { withTimezone: true }),
});

export const memberInvitesTable = pgTable("member_invites", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id").notNull().references(() => groupsTable.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  role: text("role", { enum: ["admin", "responder", "member"] }).notNull().default("member"),
  invitedByUserId: uuid("invited_by_user_id").references(() => usersTable.id),
  token: text("token").notNull().unique(),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertGroupMemberSchema = createInsertSchema(groupMembersTable).omit({ id: true, createdAt: true, joinedAt: true });
export type InsertGroupMember = z.infer<typeof insertGroupMemberSchema>;
export type GroupMember = typeof groupMembersTable.$inferSelect;

export const insertGroupMemberPermissionsSchema = createInsertSchema(groupMemberPermissionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertGroupMemberPermissions = z.infer<typeof insertGroupMemberPermissionsSchema>;
export type GroupMemberPermissions = typeof groupMemberPermissionsTable.$inferSelect;

export const insertJoinRequestSchema = createInsertSchema(joinRequestsTable).omit({ id: true, createdAt: true });
export type InsertJoinRequest = z.infer<typeof insertJoinRequestSchema>;
export type JoinRequest = typeof joinRequestsTable.$inferSelect;
