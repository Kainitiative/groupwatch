import { pgTable, text, boolean, timestamp, uuid, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { groupsTable } from "./groups";

export const incidentTypesTable = pgTable("incident_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id").notNull().references(() => groupsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  colour: text("colour"),
  icon: text("icon"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertIncidentTypeSchema = createInsertSchema(incidentTypesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertIncidentType = z.infer<typeof insertIncidentTypeSchema>;
export type IncidentType = typeof incidentTypesTable.$inferSelect;
