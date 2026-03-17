import { pgTable, text, boolean, timestamp, uuid, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { groupsTable } from "./groups";
import { usersTable } from "./users";
import { mapSectionsTable } from "./boundaries";

export const respondersTable = pgTable("responders", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id").notNull().references(() => groupsTable.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  displayName: text("display_name"),
  phone: text("phone"),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const responderSectionsTable = pgTable("responder_sections", {
  id: uuid("id").primaryKey().defaultRandom(),
  responderId: uuid("responder_id").notNull().references(() => respondersTable.id, { onDelete: "cascade" }),
  sectionId: uuid("section_id").notNull().references(() => mapSectionsTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertResponderSchema = createInsertSchema(respondersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertResponder = z.infer<typeof insertResponderSchema>;
export type Responder = typeof respondersTable.$inferSelect;

export const insertResponderSectionSchema = createInsertSchema(responderSectionsTable).omit({ id: true, createdAt: true });
export type InsertResponderSection = z.infer<typeof insertResponderSectionSchema>;
export type ResponderSection = typeof responderSectionsTable.$inferSelect;
