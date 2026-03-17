import { Router } from "express";
import Stripe from "stripe";
import { db } from "@workspace/db";
import { subscriptionsTable, groupsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/session";
import { getGroupBySlug, getMemberRecord } from "../lib/groups";

const router = Router();

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not configured");
  return new Stripe(key);
}

router.post("/billing/:groupSlug/checkout", requireAuth, async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.groupSlug) ? req.params.groupSlug[0] : req.params.groupSlug;
  const group = await getGroupBySlug(slug);
  if (!group) { res.status(404).json({ error: "Group not found" }); return; }

  const member = await getMemberRecord(group.id, req.session.userId!);
  if (!member || member.role !== "admin") {
    res.status(403).json({ error: "Only group admins can manage billing" });
    return;
  }

  const { plan } = req.body;
  if (!plan || !["monthly", "annual"].includes(plan)) {
    res.status(422).json({ error: "Plan must be 'monthly' or 'annual'" });
    return;
  }

  const priceId = plan === "monthly"
    ? process.env.STRIPE_MONTHLY_PRICE_ID
    : process.env.STRIPE_ANNUAL_PRICE_ID;

  if (!priceId) {
    res.status(503).json({ error: "Billing not configured" });
    return;
  }

  const stripe = getStripe();
  const appUrl = process.env.APP_URL || "https://groupwatch.io";

  const [subscription] = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.groupId, group.id));

  let customerId = subscription?.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: group.contactEmail ?? undefined,
      name: group.name,
      metadata: { groupId: group.id, groupSlug: group.slug },
    });
    customerId = customer.id;
    await db.update(subscriptionsTable)
      .set({ stripeCustomerId: customerId })
      .where(eq(subscriptionsTable.groupId, group.id));
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    currency: "eur",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/g/${group.slug}/settings?checkout=success`,
    cancel_url: `${appUrl}/g/${group.slug}/settings?checkout=cancelled`,
    metadata: { groupId: group.id, groupSlug: group.slug },
  });

  res.json({ url: session.url });
});

router.post("/billing/:groupSlug/portal", requireAuth, async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.groupSlug) ? req.params.groupSlug[0] : req.params.groupSlug;
  const group = await getGroupBySlug(slug);
  if (!group) { res.status(404).json({ error: "Group not found" }); return; }

  const member = await getMemberRecord(group.id, req.session.userId!);
  if (!member || member.role !== "admin") {
    res.status(403).json({ error: "Only group admins can manage billing" });
    return;
  }

  const [subscription] = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.groupId, group.id));

  if (!subscription?.stripeCustomerId) {
    res.status(400).json({ error: "No billing account found. Please subscribe first." });
    return;
  }

  const stripe = getStripe();
  const appUrl = process.env.APP_URL || "https://groupwatch.io";

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: `${appUrl}/g/${group.slug}/settings`,
  });

  res.json({ url: portalSession.url });
});

router.get("/billing/:groupSlug/status", requireAuth, async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.groupSlug) ? req.params.groupSlug[0] : req.params.groupSlug;
  const group = await getGroupBySlug(slug);
  if (!group) { res.status(404).json({ error: "Group not found" }); return; }

  const member = await getMemberRecord(group.id, req.session.userId!);
  if (!member || member.role !== "admin") {
    res.status(403).json({ error: "Only group admins can view billing" });
    return;
  }

  const [subscription] = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.groupId, group.id));

  res.json({
    status: subscription?.status ?? "trial",
    plan: subscription?.plan ?? null,
    trialEndsAt: subscription?.trialEndsAt ?? null,
    currentPeriodEndsAt: subscription?.currentPeriodEndsAt ?? null,
    cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd ?? false,
  });
});

// Stripe webhook — raw body required
router.post("/billing/webhooks", async (req, res): Promise<void> => {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret || !sig) {
    res.status(400).json({ error: "Webhook not configured" });
    return;
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch {
    res.status(400).json({ error: "Invalid webhook signature" });
    return;
  }

  try {
    // Use 'any' for event data to avoid Stripe SDK version-specific type issues
    const obj = event.data.object as any;

    switch (event.type) {
      case "checkout.session.completed": {
        const groupId = obj.metadata?.groupId;
        const subscriptionId = obj.subscription;
        if (groupId && subscriptionId) {
          const stripe = getStripe();
          const sub = await stripe.subscriptions.retrieve(subscriptionId as string) as any;
          const plan = sub.items.data[0]?.price.recurring?.interval === "year" ? "annual" : "monthly";
          await db.update(subscriptionsTable).set({
            stripeSubscriptionId: sub.id,
            status: "active",
            plan,
            currentPeriodEndsAt: new Date(sub.current_period_end * 1000),
          }).where(eq(subscriptionsTable.groupId, groupId));
        }
        break;
      }
      case "invoice.paid": {
        const subscriptionId = obj.subscription;
        if (subscriptionId) {
          const stripe = getStripe();
          const sub = await stripe.subscriptions.retrieve(subscriptionId as string) as any;
          await db.update(subscriptionsTable).set({
            status: "active",
            currentPeriodEndsAt: new Date(sub.current_period_end * 1000),
          }).where(eq(subscriptionsTable.stripeSubscriptionId, sub.id));
        }
        break;
      }
      case "invoice.payment_failed": {
        const subscriptionId = obj.subscription;
        if (subscriptionId) {
          await db.update(subscriptionsTable)
            .set({ status: "past_due" })
            .where(eq(subscriptionsTable.stripeSubscriptionId, subscriptionId as string));
        }
        break;
      }
      case "customer.subscription.updated": {
        const plan = obj.items?.data[0]?.price.recurring?.interval === "year" ? "annual" : "monthly";
        await db.update(subscriptionsTable).set({
          status: obj.status === "active" ? "active" : obj.status === "past_due" ? "past_due" : "cancelled",
          plan,
          cancelAtPeriodEnd: obj.cancel_at_period_end,
          currentPeriodEndsAt: new Date(obj.current_period_end * 1000),
        }).where(eq(subscriptionsTable.stripeSubscriptionId, obj.id));
        break;
      }
      case "customer.subscription.deleted": {
        await db.update(subscriptionsTable)
          .set({ status: "cancelled" })
          .where(eq(subscriptionsTable.stripeSubscriptionId, obj.id));
        break;
      }
    }
  } catch (err) {
    console.error("Webhook processing error:", err);
  }

  res.json({ message: "Webhook received" });
});

export default router;
