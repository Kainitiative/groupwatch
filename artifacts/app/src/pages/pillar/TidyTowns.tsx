import { Link } from "wouter";
import { ArrowRight, Check, Camera, MapPin, WifiOff, FileText, Bell, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import PublicLayout from "@/components/layout/PublicLayout";

const incidentTypes = [
  "Litter / Rubbish",
  "Illegal Dumping",
  "Graffiti / Vandalism",
  "Overgrown Verge / Hedgerow",
  "Pothole / Road Damage",
  "Fly-tipping",
  "Dog Fouling",
  "Damaged Signage",
  "Blocked Drain",
  "Derelict Property",
  "Illegal Parking",
  "Street Furniture Damage",
];

const faqs = [
  {
    q: "Can we use this to build our annual adjudication report?",
    a: "Yes — and this is one of the strongest use cases. Every logged issue is GPS-tagged, timestamped, and photographed. You can export a full summary PDF showing the volume of issues reported, resolved, and outstanding across any time period. That's exactly what adjudicators want to see: systematic effort and improvement over time.",
  },
  {
    q: "Can volunteers submit reports without creating an account?",
    a: "Absolutely. You get a unique QR code and shareable link. A volunteer scans it, takes a photo, and submits — no app download, no account needed. Registered members get a richer experience with report history, but anonymous public reporting works too.",
  },
  {
    q: "Can we attach this to a specific townland or village area?",
    a: "Yes. You can draw named map boundaries for your area — individual streets, estates, or districts — and reports are automatically tagged to the zone they fall in. This lets you filter your dashboard by area and see which zones need the most attention.",
  },
  {
    q: "Can we forward reports directly to the council?",
    a: "Not automatically yet, but every report exports as a court-quality PDF with GPS coordinates, photos, timestamps, and an immutability footer. These PDFs are ideal for council submissions, Local Authority requests, and An Taisce correspondence.",
  },
  {
    q: "Can multiple committee members manage the dashboard?",
    a: "Yes. You can add as many committee members as you like as admins or responders. Responders can claim issues, update their status, and close them off once resolved — giving you a full picture of open vs. resolved issues at any time.",
  },
];

export default function TidyTowns() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="bg-primary text-primary-foreground py-24 md:py-36">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 text-white/90 text-sm font-semibold mb-6">
            Tidy Towns Committees
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
            Log it. Fix it. <br />
            <span className="text-amber-400">Win it.</span>
          </h1>
          <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-10">
            Give your volunteers a fast way to report litter, dumping, and maintenance issues from the field. GPS-tagged evidence that impresses adjudicators and gets councils moving.
          </p>
          <Link href="/groups/new">
            <Button size="lg" className="bg-amber-500 hover:bg-amber-400 text-white font-semibold rounded-xl h-14 px-8 shadow-lg shadow-amber-500/25">
              Register Your Committee — Free Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <p className="mt-4 text-sm text-primary-foreground/60">1 month free · No credit card required</p>
        </div>
      </section>

      {/* Incident types */}
      <section className="py-20 bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Issue types your volunteers actually log
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              You decide what's on the list. These are typical for a Tidy Towns committee — add, rename, or remove any of them after sign-up.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {incidentTypes.map((t) => (
              <div key={t} className="bg-card border border-border rounded-xl p-4 text-sm font-medium text-foreground flex items-center gap-2">
                <Check className="w-4 h-4 text-amber-500 shrink-0" /> {t}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-muted/40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-12">
            How it works for Tidy Towns
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: "1",
                title: "Volunteer spots an issue",
                description: "They open the app or scan your QR code on a local notice board, pick the issue type, and tap Submit. Takes under two minutes from any phone.",
              },
              {
                step: "2",
                title: "Photo, GPS, description",
                description: "They photograph the issue on the spot, GPS is captured automatically, and they add a description by voice or text. All saved even without signal.",
              },
              {
                step: "3",
                title: "Committee co-ordinated instantly",
                description: "Your committee receives an instant notification. They assign the issue, track progress, and mark it resolved — with a full timestamped audit trail.",
              },
            ].map(({ step, title, description }) => (
              <div key={step} className="bg-card border border-border rounded-2xl p-6">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 font-bold text-lg flex items-center justify-center mb-4">
                  {step}
                </div>
                <h3 className="font-semibold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature highlights */}
      <section className="py-20 bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
                Built for committees on the go
              </h2>
              <div className="space-y-5">
                {[
                  { icon: Camera, text: "Native phone camera — photograph an issue and it's attached to the record immediately, full resolution" },
                  { icon: MapPin, text: "GPS auto-detected — no address needed. Open the app where the issue is and it's pinned to the map" },
                  { icon: WifiOff, text: "Fully offline — reports queue on-device when there's no signal and sync the moment connectivity returns" },
                  { icon: Bell, text: "Committee notified instantly by push and email the moment a volunteer submits a report" },
                  { icon: TrendingUp, text: "Track trends over time — see which streets and issue types recur most, backed by hard data" },
                  { icon: FileText, text: "Export a summary PDF for adjudicators and councils — GPS maps, charts, issue counts, resolved rates" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-4 h-4 text-amber-500" />
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-primary text-primary-foreground rounded-2xl p-8">
              <h3 className="font-bold text-white text-lg mb-3">Evidence that wins marks</h3>
              <p className="text-sm text-primary-foreground/80 leading-relaxed mb-4">
                Tidy Towns adjudicators are looking for systematic effort and measurable improvement. GroupWatch gives you exactly that:
              </p>
              <ul className="space-y-2">
                {[
                  "Volume of issues logged per month and year",
                  "Resolution rate and average time to close",
                  "GPS-mapped evidence across your entire area",
                  "Before/after photo evidence on every issue",
                  "Exportable PDF suitable for An Taisce and council submissions",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-primary-foreground/80">
                    <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" /> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-muted/40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-foreground text-center mb-12">FAQ for Tidy Towns Committees</h2>
          <div className="space-y-8">
            {faqs.map(({ q, a }) => (
              <div key={q}>
                <h4 className="font-semibold text-foreground mb-2">{q}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-background text-center">
        <div className="max-w-xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">Ready to get your committee organised?</h2>
          <p className="text-muted-foreground mb-8">Register today. First month completely free — no credit card required.</p>
          <Link href="/groups/new">
            <Button size="lg" className="bg-amber-500 hover:bg-amber-400 text-white font-semibold rounded-xl h-14 px-8 shadow-lg shadow-amber-500/25">
              Register Your Committee — Free Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}
