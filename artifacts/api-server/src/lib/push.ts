import webpush from "web-push";
import { db } from "@workspace/db";
import { pushSubscriptionsTable, groupMemberPermissionsTable, groupMembersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

let vapidConfigured = false;

function ensureVapid() {
  if (vapidConfigured) return;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const email = process.env.VAPID_EMAIL;
  if (!publicKey || !privateKey || !email) return;
  webpush.setVapidDetails(`mailto:${email}`, publicKey, privateKey);
  vapidConfigured = true;
}

export async function sendPushToGroupResponders(
  groupId: string,
  payload: { title: string; body: string; url?: string }
): Promise<void> {
  ensureVapid();
  if (!vapidConfigured) return;

  const eligibleMembers = await db
    .select({ userId: groupMemberPermissionsTable.userId })
    .from(groupMemberPermissionsTable)
    .innerJoin(groupMembersTable, and(
      eq(groupMembersTable.groupId, groupMemberPermissionsTable.groupId),
      eq(groupMembersTable.userId, groupMemberPermissionsTable.userId)
    ))
    .where(and(
      eq(groupMemberPermissionsTable.groupId, groupId),
      eq(groupMemberPermissionsTable.canReceiveNotifications, true),
      eq(groupMembersTable.status, "active")
    ));

  if (eligibleMembers.length === 0) return;

  const userIds = eligibleMembers.map(m => m.userId);

  const subscriptions = await db
    .select()
    .from(pushSubscriptionsTable)
    .where(eq(pushSubscriptionsTable.userId, userIds[0]));

  const allSubs = userIds.length > 1
    ? await db.select().from(pushSubscriptionsTable)
    : subscriptions;

  const targetSubs = allSubs.filter(s => userIds.includes(s.userId));

  const pushPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url ?? "/dashboard",
    icon: "/icons/icon-192.png",
  });

  await Promise.allSettled(
    targetSubs.map(sub =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        pushPayload
      ).catch(async (err: unknown) => {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 410 || statusCode === 404) {
          await db.delete(pushSubscriptionsTable).where(eq(pushSubscriptionsTable.endpoint, sub.endpoint));
        }
      })
    )
  );
}
