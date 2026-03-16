import { pgTable, text, boolean, timestamp, uuid, doublePrecision, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { groupsTable } from "./groups";
import { usersTable } from "./users";
import { incidentTypesTable } from "./incident-types";

export const incidentReportsTable = pgTable("incident_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  referenceNumber: text("reference_number").notNull().unique(),
  groupId: uuid("group_id").notNull().references(() => groupsTable.id, { onDelete: "cascade" }),
  incidentTypeId: uuid("incident_type_id").notNull().references(() => incidentTypesTable.id),
  reporterId: uuid("reporter_id").references(() => usersTable.id),
  reporterNameSnapshot: text("reporter_name_snapshot"),
  severity: text("severity", { enum: ["low", "medium", "high", "emergency"] }).notNull(),
  description: text("description").notNull(),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  isAnonymous: boolean("is_anonymous").notNull().default(false),
  status: text("status", { enum: ["open", "in_progress", "escalated", "resolved"] }).notNull().default("open"),
  claimedByUserId: uuid("claimed_by_user_id").references(() => usersTable.id),
  claimedAt: timestamp("claimed_at", { withTimezone: true }),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
  // Note: this record is immutable after creation. All changes go into report_updates.
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const reportPhotosTable = pgTable("report_photos", {
  id: uuid("id").primaryKey().defaultRandom(),
  reportId: uuid("report_id").notNull().references(() => incidentReportsTable.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  filePath: text("file_path"),
  exifTakenAt: timestamp("exif_taken_at", { withTimezone: true }),
  exifLatitude: doublePrecision("exif_latitude"),
  exifLongitude: doublePrecision("exif_longitude"),
  fileSize: integer("file_size"),
  uploadedByUserId: uuid("uploaded_by_user_id").references(() => usersTable.id),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
});

export const reportUpdatesTable = pgTable("report_updates", {
  id: uuid("id").primaryKey().defaultRandom(),
  reportId: uuid("report_id").notNull().references(() => incidentReportsTable.id, { onDelete: "cascade" }),
  actorId: uuid("actor_id").references(() => usersTable.id),
  actorNameSnapshot: text("actor_name_snapshot").notNull(),
  updateType: text("update_type", {
    enum: ["claim", "status_change", "note", "photo_added", "escalation", "auto_claim"]
  }).notNull(),
  note: text("note"),
  newStatus: text("new_status", { enum: ["open", "in_progress", "escalated", "resolved"] }),
  escalatedTo: text("escalated_to"),
  escalationContactId: uuid("escalation_contact_id"),
  // This record is append-only — never updated or deleted
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertIncidentReportSchema = createInsertSchema(incidentReportsTable).omit({ id: true, createdAt: true, submittedAt: true });
export type InsertIncidentReport = z.infer<typeof insertIncidentReportSchema>;
export type IncidentReport = typeof incidentReportsTable.$inferSelect;

export const insertReportPhotoSchema = createInsertSchema(reportPhotosTable).omit({ id: true, uploadedAt: true });
export type InsertReportPhoto = z.infer<typeof insertReportPhotoSchema>;
export type ReportPhoto = typeof reportPhotosTable.$inferSelect;

export const insertReportUpdateSchema = createInsertSchema(reportUpdatesTable).omit({ id: true, createdAt: true });
export type InsertReportUpdate = z.infer<typeof insertReportUpdateSchema>;
export type ReportUpdate = typeof reportUpdatesTable.$inferSelect;
