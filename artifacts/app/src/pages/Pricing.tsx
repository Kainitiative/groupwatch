import { Link } from "wouter";
import { Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import PublicLayout from "@/components/layout/PublicLayout";

const monthly = [
  "Unlimited incident reports",
  "Unlimited members",
  "Custom incident types",
  "Push & email notifications",
  "Photo uploads with GPS tagging",
  "Offline reporting (PWA)",
  "Responder dashboard",
  "Court-ready PDF exports",
  "CSV data exports",
  "Map boundary drawing",
  "Escalation contact management",
  "Shareable QR code",
  "Analytics & charts",
];

export default function Pricing() {
  return (
    <PublicLayout>
      <section className="py-20 md:py-32 bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-semibold mb-6">
            Simple, Transparent Pricing
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground mb-6">
            One plan. Everything included.
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-16">
            No tiers. No feature limits. Every group gets the full platform from day one — and the first month is completely free.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Monthly */}
            <div className="relative bg-card border border-border rounded-2xl p-8 text-left shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold text-foreground mb-2">Monthly</h3>
              <div className="flex items-end gap-1 mb-6">
                <span className="text-5xl font-extrabold text-foreground">€20</span>
                <span className="text-muted-foreground mb-2">/month</span>
              </div>
              <Link href="/groups/new">
                <Button variant="outline" className="w-full mb-8 rounded-xl">
                  Start Free Trial
                </Button>
              </Link>
              <ul className="space-y-3">
                {monthly.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Annual */}
            <div className="relative bg-primary text-primary-foreground rounded-2xl p-8 text-left shadow-xl ring-2 ring-accent">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-accent text-accent-foreground text-xs font-bold px-3 py-1 rounded-full shadow">
                  SAVE 2 MONTHS
                </span>
              </div>
              <h3 className="text-lg font-semibold text-primary-foreground mb-2">Annual</h3>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-5xl font-extrabold text-white">€200</span>
                <span className="text-primary-foreground/70 mb-2">/year</span>
              </div>
              <p className="text-sm text-primary-foreground/60 mb-6">€16.67/month — 2 months free</p>
              <Link href="/groups/new">
                <Button className="w-full mb-8 rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground font-semibold shadow-lg shadow-accent/25">
                  Start Free Trial
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <ul className="space-y-3">
                {monthly.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-primary-foreground/80">
                    <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Trial note */}
          <div className="mt-12 p-6 bg-accent/5 border border-accent/20 rounded-2xl max-w-xl mx-auto">
            <h4 className="font-semibold text-foreground mb-2">1-Month Free Trial</h4>
            <p className="text-sm text-muted-foreground">
              Every new group gets a full month free — no credit card required. You only need to add payment details when your trial ends.
            </p>
          </div>

          {/* FAQ */}
          <div className="mt-24 text-left max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-foreground mb-10 text-center">Common questions</h2>
            <div className="space-y-8">
              {[
                {
                  q: "Is there really no credit card required for the trial?",
                  a: "Correct. You create your group, add your incident types, invite members, and start filing reports — all without entering any payment information. At the end of the trial we'll send a reminder.",
                },
                {
                  q: "What happens when the trial ends?",
                  a: "Your group is paused. No data is deleted. You can reactivate at any time by subscribing, and everything picks up exactly where it left off.",
                },
                {
                  q: "Can I switch between monthly and annual?",
                  a: "Yes. You can switch plans at any time through the billing page in your group settings. The change takes effect on your next renewal date.",
                },
                {
                  q: "Is there a limit on members or reports?",
                  a: "No. Both plans include unlimited members and unlimited reports. There are no usage caps.",
                },
                {
                  q: "What currency do you charge in?",
                  a: "Euro (€) only. Payments are processed securely through Stripe.",
                },
              ].map(({ q, a }) => (
                <div key={q}>
                  <h4 className="font-semibold text-foreground mb-2">{q}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
