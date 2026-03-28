import { Router } from "express";
import { db } from "@workspace/db";
import {
  groupsTable,
  groupMembersTable,
  subscriptionsTable,
  setupProgressTable,
  incidentTypesTable,
} from "@workspace/db";
import { eq, count, and } from "drizzle-orm";
import { requireAuth } from "../lib/session";
import { getGroupBySlug, createGroupWithTrial, getMemberRecord } from "../lib/groups";

const DEFAULT_INCIDENT_TYPES: Record<string, string[]> = {
  angling_club: [
    "Illegal Netting / Poaching",
    "Water Pollution",
    "Dead Fish / Fish Kill",
    "Illegal Dumping at Riverbank",
    "Invasive Species Spotted",
    "Suspicious Activity",
  ],
  neighbourhood_watch: [
    "Suspicious Activity",
    "Vandalism",
    "Theft",
    "Anti-Social Behaviour",
    "Fly-Tipping",
    "Noise Complaint",
  ],
  hoa: [
    "Noise Complaint",
    "Parking Violation",
    "Property Damage",
    "Maintenance Issue",
    "Security Concern",
    "Fly-Tipping",
  ],
  sports_club: [
    "Pitch / Surface Damage",
    "Vandalism or Graffiti",
    "Equipment Theft",
    "Unsafe Fixture or Structure",
    "Anti-Social Behaviour",
    "Injury Report",
  ],
  tidy_towns: [
    "Litter",
    "Illegal Dumping",
    "Graffiti",
    "Overgrown Verge",
    "Pothole",
    "Damaged Street Furniture",
  ],
  environmental: [
    "Illegal Dumping / Fly-tipping",
    "Water Pollution",
    "Air Quality / Burning",
    "Invasive Species",
    "Habitat Destruction",
    "Wildlife Injury / Death",
  ],
  other: [
    "Incident",
    "Suspicious Activity",
    "Damage",
    "Safety Concern",
  ],
};

const router = Router();

router.post("/groups", requireAuth, async (req, res): Promise<void> => {
  const { name, slug, groupType, description, website, contactEmail } = req.body;

  if (!name || !slug || !groupType) {
    res.status(422).json({ error: "Name, slug and group type are required" });
    return;
  }

  if (!/^[a-z0-9-]+$/.test(slug)) {
    res.status(422).json({ error: "Slug can only contain lowercase letters, numbers and hyphens" });
    return;
  }

  const existing = await getGroupBySlug(slug);
  if (existing) {
    res.status(409).json({ error: "This URL is already taken. Please choose a different one." });
    return;
  }

  const group = await createGroupWithTrial(name, slug, groupType, req.session.userId!, {
    description,
    website,
    contactEmail,
  });

  const typesToSeed = DEFAULT_INCIDENT_TYPES[groupType] ?? DEFAULT_INCIDENT_TYPES.other;
  if (typesToSeed.length > 0) {
    try {
      await db.insert(incidentTypesTable).values(
        typesToSeed.map((name, i) => ({
          groupId: group.id,
          name,
          sortOrder: i,
        }))
      );
      await db
        .update(setupProgressTable)
        .set({ incidentTypesAdded: true })
        .where(eq(setupProgressTable.groupId, group.id));
    } catch (seedErr) {
      console.warn("[groups] incident type seeding failed (non-fatal):", seedErr);
    }
  }

  const [subscription] = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.groupId, group.id));

  res.status(201).json({
    id: group.id,
    name: group.name,
    slug: group.slug,
    groupType: group.groupType,
    description: group.description,
    logoUrl: group.logoUrl,
    coverImageUrl: group.coverImageUrl,
    brandColour: group.brandColour,
    website: group.website,
    contactEmail: group.contactEmail,
    socialLinks: group.socialLinks,
    publicHotspotMapEnabled: group.publicHotspotMapEnabled,
    subscriptionStatus: subscription.status,
    trialEndsAt: subscription.trialEndsAt,
    memberCount: 1,
    createdAt: group.createdAt,
  });
});

router.get("/groups/:groupSlug", async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.groupSlug) ? req.params.groupSlug[0] : req.params.groupSlug;
  const group = await getGroupBySlug(slug);

  if (!group) {
    res.status(404).json({ error: "Group not found" });
    return;
  }

  const [memberCountResult] = await db
    .select({ count: count() })
    .from(groupMembersTable)
    .where(and(eq(groupMembersTable.groupId, group.id), eq(groupMembersTable.status, "active")));

  const [subscription] = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.groupId, group.id));

  res.json({
    id: group.id,
    name: group.name,
    slug: group.slug,
    groupType: group.groupType,
    description: group.description,
    logoUrl: group.logoUrl,
    coverImageUrl: group.coverImageUrl,
    brandColour: group.brandColour,
    website: group.website,
    contactEmail: group.contactEmail,
    socialLinks: group.socialLinks,
    publicHotspotMapEnabled: group.publicHotspotMapEnabled,
    subscriptionStatus: subscription?.status ?? "trial",
    trialEndsAt: subscription?.trialEndsAt,
    memberCount: Number(memberCountResult?.count ?? 0),
    createdAt: group.createdAt,
  });
});

router.patch("/groups/:groupSlug", requireAuth, async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.groupSlug) ? req.params.groupSlug[0] : req.params.groupSlug;
  const group = await getGroupBySlug(slug);

  if (!group) {
    res.status(404).json({ error: "Group not found" });
    return;
  }

  const member = await getMemberRecord(group.id, req.session.userId!);
  if (!member || member.role !== "admin") {
    res.status(403).json({ error: "Only group admins can update group settings" });
    return;
  }

  const allowedFields = [
    "name", "slug", "groupType", "description", "brandColour",
    "website", "contactEmail", "socialLinks", "publicHotspotMapEnabled", "publicReportingEnabled", "logoUrl", "coverImageUrl",
  ];

  const updates: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  if (updates["slug"] && updates["slug"] !== slug) {
    const existingWithSlug = await getGroupBySlug(updates["slug"] as string);
    if (existingWithSlug) {
      res.status(409).json({ error: "This URL is already taken" });
      return;
    }
  }

  // Update setup progress if profile fields are being updated
  const profileFields = ["name", "description", "logoUrl", "brandColour"];
  if (profileFields.some(f => req.body[f] !== undefined)) {
    await db
      .update(setupProgressTable)
      .set({ profileComplete: true })
      .where(eq(setupProgressTable.groupId, group.id));
  }

  const [updated] = await db
    .update(groupsTable)
    .set(updates)
    .where(eq(groupsTable.id, group.id))
    .returning();

  const [memberCountResult] = await db
    .select({ count: count() })
    .from(groupMembersTable)
    .where(and(eq(groupMembersTable.groupId, group.id), eq(groupMembersTable.status, "active")));

  const [subscription] = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.groupId, group.id));

  res.json({
    id: updated.id,
    name: updated.name,
    slug: updated.slug,
    groupType: updated.groupType,
    description: updated.description,
    logoUrl: updated.logoUrl,
    coverImageUrl: updated.coverImageUrl,
    brandColour: updated.brandColour,
    website: updated.website,
    contactEmail: updated.contactEmail,
    socialLinks: updated.socialLinks,
    publicHotspotMapEnabled: updated.publicHotspotMapEnabled,
    subscriptionStatus: subscription?.status ?? "trial",
    trialEndsAt: subscription?.trialEndsAt,
    memberCount: Number(memberCountResult?.count ?? 0),
    createdAt: updated.createdAt,
  });
});

router.get("/groups/:groupSlug/join-link", requireAuth, async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.groupSlug) ? req.params.groupSlug[0] : req.params.groupSlug;
  const group = await getGroupBySlug(slug);

  if (!group) {
    res.status(404).json({ error: "Group not found" });
    return;
  }

  const member = await getMemberRecord(group.id, req.session.userId!);
  if (!member || member.role !== "admin") {
    res.status(403).json({ error: "Only group admins can access the join link" });
    return;
  }

  const appUrl = process.env.APP_URL || "";
  const url = `${appUrl}/groups/join/${group.joinToken}`;

  // Update setup progress
  await db
    .update(setupProgressTable)
    .set({ shareLinkViewed: true })
    .where(eq(setupProgressTable.groupId, group.id));

  res.json({ token: group.joinToken, url });
});

router.get("/groups/join/:token", async (req, res): Promise<void> => {
  const token = Array.isArray(req.params.token) ? req.params.token[0] : req.params.token;

  const [group] = await db
    .select({ id: groupsTable.id, name: groupsTable.name, slug: groupsTable.slug, description: groupsTable.description, logoUrl: groupsTable.logoUrl })
    .from(groupsTable)
    .where(eq(groupsTable.joinToken, token));

  if (!group) {
    res.status(404).json({ error: "This join link is invalid or has expired" });
    return;
  }

  res.json(group);
});

router.post("/groups/join/:token", requireAuth, async (req, res): Promise<void> => {
  const token = Array.isArray(req.params.token) ? req.params.token[0] : req.params.token;

  const [group] = await db
    .select()
    .from(groupsTable)
    .where(eq(groupsTable.joinToken, token));

  if (!group) {
    res.status(400).json({ error: "This join link is invalid or has expired" });
    return;
  }

  const existingMember = await getMemberRecord(group.id, req.session.userId!);
  if (existingMember) {
    res.json({ message: "You are already a member of this group" });
    return;
  }

  await db.insert(groupMembersTable).values({
    groupId: group.id,
    userId: req.session.userId!,
    role: "member",
    status: "active",
  });

  res.json({ message: `You have joined ${group.name}` });
});

router.get("/groups/:groupSlug/setup-progress", requireAuth, async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.groupSlug) ? req.params.groupSlug[0] : req.params.groupSlug;
  const group = await getGroupBySlug(slug);

  if (!group) {
    res.status(404).json({ error: "Group not found" });
    return;
  }

  const member = await getMemberRecord(group.id, req.session.userId!);
  if (!member || member.role !== "admin") {
    res.status(403).json({ error: "Only group admins can view setup progress" });
    return;
  }

  const [progress] = await db
    .select()
    .from(setupProgressTable)
    .where(eq(setupProgressTable.groupId, group.id));

  if (!progress) {
    res.json({
      profileComplete: false,
      incidentTypesAdded: false,
      responderAssigned: false,
      mapBoundariesDrawn: false,
      escalationContactsAdded: false,
      shareLinkViewed: false,
      completedSteps: 0,
      totalSteps: 6,
      dismissed: false,
    });
    return;
  }

  const steps = [
    progress.profileComplete,
    progress.incidentTypesAdded,
    progress.responderAssigned,
    progress.mapBoundariesDrawn,
    progress.escalationContactsAdded,
    progress.shareLinkViewed,
  ];

  res.json({
    profileComplete: progress.profileComplete,
    incidentTypesAdded: progress.incidentTypesAdded,
    responderAssigned: progress.responderAssigned,
    mapBoundariesDrawn: progress.mapBoundariesDrawn,
    escalationContactsAdded: progress.escalationContactsAdded,
    shareLinkViewed: progress.shareLinkViewed,
    completedSteps: steps.filter(Boolean).length,
    totalSteps: 6,
    dismissed: progress.dismissed,
  });
});

export default router;
