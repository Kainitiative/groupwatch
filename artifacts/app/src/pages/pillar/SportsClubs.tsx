import { Link } from "wouter";
import { ArrowRight, Check, Camera, MapPin, FileText, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import PublicLayout from "@/components/layout/PublicLayout";

const incidentTypes = [
  "Pitch / Surface Damage",
  "Vandalism or Graffiti",
  "Equipment Theft",
  "Unsafe Fixture or Structure",
  "Anti-Social Behaviour",
  "Injury Report",
  "Floodlight / Drainage Issue",
  "Dressing Room Incident",
];

const faqs = [
  {
    q: "Can match officials or grounds staff report without being a full member?",
    a: "Any person who follows your group's shareable report link or scans the QR code can register an account and file a report in one flow. You control who gets full member access and who is just a reporter.",
  },
  {
    q: "Can we assign different pitches or facilities as separate areas?",
    a: "Yes. The map boundary tool lets you draw named areas — Pitch 1, Pitch 2, the car park, the clubhouse — and divide them into sections. Reports that fall within a boundary are tagged automatically.",
  },
  {
    q: "We need this for insurance and county board reporting. Is the data exportable?",
    a: "Yes. Individual incident PDFs include the original locked record, GPS, photos with timestamps, and a full audit trail. For board or county committee submissions, the Summary PDF generates a branded report across any date range.",
  },
  {
    q: "Can we track whether an issue was actioned and by whom?",
    a: "Every action on a report — claiming, status changes, notes, escalation — is logged to a permanent audit trail with the actor's name and timestamp. Nothing can be removed or altered after the fact.",
  },
  {
    q: "What about incidents that need to go to the county board or Gardaí?",
    a: "Escalation contacts let you define external contacts (county board secretary, local Garda station, etc.) and escalate directly from the report record. The escalation is logged to the audit trail.",
  },
];

export default function SportsClubs() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="bg-primary text-primary-foreground py-24 md:py-36">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 text-white/90 text-sm font-semibold mb-6">
            Football, GAA &amp; Sports Clubs
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
            Manage your facilities. <br />
            <span className="text-accent">Protect your club.</span>
          </h1>
          <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-10">
            From pitch damage to anti-social behaviour, give your members and grounds staff a single place to report, track, and escalate incidents — with full audit trails for insurance and county board submissions.
          </p>
          <Link href="/register">
            <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold rounded-xl h-14 px-8 shadow-lg shadow-accent/25">
              Register Your Club — Free Trial
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
              Report categories your club uses
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              You define the list — these are typical examples for football and GAA clubs. Rename and add your own.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {incidentTypes.map((t) => (
              <div key={t} className="bg-card border border-border rounded-xl p-4 text-sm font-medium text-foreground flex items-center gap-2">
                <Check className="w-4 h-4 text-accent shrink-0" /> {t}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-muted/40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-12">
            From pitch to paper in minutes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: "1",
                title: "Report on the spot",
                description: "A groundskeeper, team manager, or member spots damage or an incident. They scan the QR code on the gate or open the app and file a report immediately.",
              },
              {
                step: "2",
                title: "Photos, GPS, incident type",
                description: "Native camera opens on mobile. GPS is auto-detected. They pick the incident category, severity, and describe what happened — by voice or text.",
              },
              {
                step: "3",
                title: "Committee notified, record kept",
                description: "Your designated committee members or groundspeople are notified immediately. The record is permanently locked with timestamp and GPS — ready for insurance or county board.",
              },
            ].map(({ step, title, description }) => (
              <div key={step} className="bg-card border border-border rounded-2xl p-6">
                <div className="w-10 h-10 rounded-full bg-accent/10 text-accent font-bold text-lg flex items-center justify-center mb-4">
                  {step}
                </div>
                <h3 className="font-semibold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
                For committees and grounds staff
              </h2>
              <div className="space-y-5">
                {[
                  { icon: Camera, text: "Photo evidence with EXIF timestamps — proof of condition at time of report" },
                  { icon: MapPin, text: "Draw your pitches, car park, and clubhouse as named zones on the map" },
                  { icon: Bell, text: "Instant notifications to grounds committee or designated responders" },
                  { icon: FileText, text: "Insurance-ready PDFs with immutable original record and full audit trail" },
                  { icon: ArrowRight, text: "Escalate directly to county board, Gardaí, or council from within the report" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-4 h-4 text-accent" />
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-primary text-primary-foreground rounded-2xl p-8">
              <h3 className="font-bold text-white text-lg mb-3">For Insurance &amp; County Board</h3>
              <p className="text-sm text-primary-foreground/80 leading-relaxed mb-4">
                Every incident report can be exported as a PDF including:
              </p>
              <ul className="space-y-2">
                {[
                  "Locked original record — cannot be altered",
                  "GPS location and timestamp",
                  "Full-resolution photos with EXIF data",
                  "Chronological action and update timeline",
                  "Immutability footer for insurance submissions",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-primary-foreground/80">
                    <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" /> {item}
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
          <h2 className="text-2xl font-bold text-foreground text-center mb-12">FAQ for Sports Clubs</h2>
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
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">Get your club set up today.</h2>
          <p className="text-muted-foreground mb-8">First month completely free. No credit card required.</p>
          <Link href="/register">
            <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold rounded-xl h-14 px-8 shadow-lg shadow-accent/25">
              Register Your Club — Free Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}
