import { pgTable, text, boolean, timestamp, uuid, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { groupsTable } from "./groups";
import { usersTable } from "./users";

export const platformSettingsTable = pgTable("platform_settings", {
  id: serial("id").primaryKey(),
  reportingEnabled: boolean("reporting_enabled").notNull().default(true),
  maintenanceMode: boolean("maintenance_mode").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const apiKeysTable = pgTable("api_keys", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id").notNull().references(() => groupsTable.id, { onDelete: "cascade" }),
  createdByUserId: uuid("created_by_user_id").references(() => usersTable.id),
  keyHash: text("key_hash").notNull(),
  keyPrefix: text("key_prefix").notNull(),
  label: text("label"),
  isActive: boolean("is_active").notNull().default(true),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPlatformSettingsSchema = createInsertSchema(platformSettingsTable).omit({ id: true, updatedAt: true });
export type InsertPlatformSettings = z.infer<typeof insertPlatformSettingsSchema>;
export type PlatformSettings = typeof platformSettingsTable.$inferSelect;

export const insertApiKeySchema = createInsertSchema(apiKeysTable).omit({ id: true, createdAt: true });
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export type ApiKey = typeof apiKeysTable.$inferSelect;
