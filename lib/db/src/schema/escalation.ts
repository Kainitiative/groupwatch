import { pgTable, text, boolean, timestamp, uuid, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { groupsTable } from "./groups";

export const escalationContactsTable = pgTable("escalation_contacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id").notNull().references(() => groupsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  organisation: text("organisation"),
  role: text("role"),
  phone: text("phone"),
  email: text("email"),
  notes: text("notes"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertEscalationContactSchema = createInsertSchema(escalationContactsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertEscalationContact = z.infer<typeof insertEscalationContactSchema>;
export type EscalationContact = typeof escalationContactsTable.$inferSelect;
