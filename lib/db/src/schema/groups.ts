import { pgTable, text, boolean, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const groupsTable = pgTable("groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  groupType: text("group_type").notNull(),
  description: text("description"),
  logoUrl: text("logo_url"),
  coverImageUrl: text("cover_image_url"),
  brandColour: text("brand_colour"),
  website: text("website"),
  contactEmail: text("contact_email"),
  socialLinks: jsonb("social_links").$type<Record<string, string>>(),
  publicHotspotMapEnabled: boolean("public_hotspot_map_enabled").notNull().default(false),
  publicReportingEnabled: boolean("public_reporting_enabled").notNull().default(false),
  joinToken: text("join_token").notNull().unique(),
  ownerUserId: uuid("owner_user_id").notNull().references(() => usersTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const subscriptionsTable = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id").notNull().references(() => groupsTable.id, { onDelete: "cascade" }).unique(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  status: text("status", { enum: ["trial", "active", "past_due", "cancelled"] }).notNull().default("trial"),
  plan: text("plan", { enum: ["monthly", "annual"] }),
  trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
  currentPeriodEndsAt: timestamp("current_period_ends_at", { withTimezone: true }),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
  trialReminderSentAt: timestamp("trial_reminder_sent_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const setupProgressTable = pgTable("setup_progress", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id").notNull().references(() => groupsTable.id, { onDelete: "cascade" }).unique(),
  profileComplete: boolean("profile_complete").notNull().default(false),
  incidentTypesAdded: boolean("incident_types_added").notNull().default(false),
  responderAssigned: boolean("responder_assigned").notNull().default(false),
  mapBoundariesDrawn: boolean("map_boundaries_drawn").notNull().default(false),
  escalationContactsAdded: boolean("escalation_contacts_added").notNull().default(false),
  shareLinkViewed: boolean("share_link_viewed").notNull().default(false),
  dismissed: boolean("dismissed").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertGroupSchema = createInsertSchema(groupsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertGroup = z.infer<typeof insertGroupSchema>;
export type Group = typeof groupsTable.$inferSelect;

export const insertSubscriptionSchema = createInsertSchema(subscriptionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptionsTable.$inferSelect;

export const insertSetupProgressSchema = createInsertSchema(setupProgressTable).omit({ id: true, updatedAt: true });
export type InsertSetupProgress = z.infer<typeof insertSetupProgressSchema>;
export type SetupProgress = typeof setupProgressTable.$inferSelect;
