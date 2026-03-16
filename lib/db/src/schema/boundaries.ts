import { pgTable, text, boolean, timestamp, uuid, integer, doublePrecision, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { groupsTable } from "./groups";

export const mapBoundariesTable = pgTable("map_boundaries", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id").notNull().references(() => groupsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  boundaryType: text("boundary_type", { enum: ["polygon", "line_buffer"] }).notNull().default("polygon"),
  geometry: jsonb("geometry").notNull(),
  bufferMeters: doublePrecision("buffer_meters"),
  colour: text("colour"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const mapSectionsTable = pgTable("map_sections", {
  id: uuid("id").primaryKey().defaultRandom(),
  boundaryId: uuid("boundary_id").notNull().references(() => mapBoundariesTable.id, { onDelete: "cascade" }),
  groupId: uuid("group_id").notNull().references(() => groupsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertMapBoundarySchema = createInsertSchema(mapBoundariesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertMapBoundary = z.infer<typeof insertMapBoundarySchema>;
export type MapBoundary = typeof mapBoundariesTable.$inferSelect;

export const insertMapSectionSchema = createInsertSchema(mapSectionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertMapSection = z.infer<typeof insertMapSectionSchema>;
export type MapSection = typeof mapSectionsTable.$inferSelect;
