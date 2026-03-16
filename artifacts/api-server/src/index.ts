import app from "./app";
import { db } from "@workspace/db";
import { subscriptionsTable, groupMembersTable, groupsTable, usersTable } from "@workspace/db";
import { eq, and, lt, gt } from "drizzle-orm";
import { sendTrialExpiryReminderEmail } from "./lib/email";

async function runTrialExpiryCheck() {
  try {
    const now = new Date();
    const in5Days = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);

    const expiringSoon = await db
      .select({ sub: subscriptionsTable, group: groupsTable })
      .from(subscriptionsTable)
      .innerJoin(groupsTable, eq(groupsTable.id, subscriptionsTable.groupId))
      .where(and(
        eq(subscriptionsTable.status, "trial"),
        gt(subscriptionsTable.trialEndsAt, now),
        lt(subscriptionsTable.trialEndsAt, in5Days)
      ));

    for (const { sub, group } of expiringSoon) {
      const [admin] = await db
        .select({ user: usersTable })
        .from(groupMembersTable)
        .innerJoin(usersTable, eq(usersTable.id, groupMembersTable.userId))
        .where(and(
          eq(groupMembersTable.groupId, group.id),
          eq(groupMembersTable.role, "admin"),
          eq(groupMembersTable.status, "active")
        ));

      if (!admin || !sub.trialEndsAt) continue;

      const msLeft = sub.trialEndsAt.getTime() - now.getTime();
      const daysLeft = Math.max(1, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));

      sendTrialExpiryReminderEmail(admin.user.email, group.name, daysLeft).catch(() => {});
    }
  } catch {}
}

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  runTrialExpiryCheck();
  setInterval(runTrialExpiryCheck, 6 * 60 * 60 * 1000);
});
