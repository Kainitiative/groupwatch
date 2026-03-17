import { Link } from "wouter";
import { ArrowRight, Check, Camera, MapPin, WifiOff, FileText, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import PublicLayout from "@/components/layout/PublicLayout";

const incidentTypes = [
  "Illegal Netting / Poaching",
  "Pollution or Discolouration",
  "Dead Fish / Fish Kill",
  "Illegal Dumping at Riverbank",
  "Invasive Species Spotted",
  "Damaged or Removed Signage",
  "Obstructed Access Point",
  "Suspicious Activity",
];

const faqs = [
  {
    q: "Can members report even if they're in a remote area with no signal?",
    a: "Yes. The app is a Progressive Web App that caches the report form locally. Members can complete and submit a full report — including photos — with no internet connection. It uploads automatically the moment signal returns.",
  },
  {
    q: "Can I use GPS coordinates as evidence in a prosecution?",
    a: "The GPS coordinates, timestamp, and full report are stored in an immutable record the moment they're submitted — nothing can be altered after the fact. Court-ready PDFs include all of this along with a signed immutability footer.",
  },
  {
    q: "Can we draw our club's stretch of river on a map?",
    a: "Yes. The map boundary tool lets you draw polygon or line-with-buffer boundaries and divide them into named sections (e.g. Beat 1, Upper Reach). Reports that fall within a boundary are tagged automatically.",
  },
  {
    q: "We have water bailiffs — can they receive notifications when a report comes in?",
    a: "Yes. Any member you designate as a responder can receive an instant push notification and email the moment a report is filed. You control which responders are notified.",
  },
  {
    q: "Can non-members report an incident?",
    a: "Yes. Each group has a shareable report link and a printable QR code. A visitor who scans the code can register a new account and file a report in a single flow — no prior setup needed.",
  },
];

export default function AnglingClubs() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="bg-primary text-primary-foreground py-24 md:py-36">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 text-white/90 text-sm font-semibold mb-6">
            Angling &amp; Fishing Clubs
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
            Protect your waters. <br />
            <span className="text-accent">Build the evidence.</span>
          </h1>
          <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-10">
            Give every member — on the riverbank, in a boat, or walking a beat — a fast way to report poaching, pollution, and illegal activity. Offline-ready, GPS-tagged, court-admissible.
          </p>
          <Link href="/groups/new">
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
              Incident types your members actually use
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              You create the list. These are typical examples for an angling club — add, rename, or remove any of them.
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
            How it works for angling clubs
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: "1",
                title: "Member spots something",
                description: "On the bank, in a boat, walking a beat. They open the app — or scan the QR code on a notice board — and tap Report.",
              },
              {
                step: "2",
                title: "Photos, GPS, description",
                description: "They take photos directly from the app (native camera on mobile), their GPS is captured automatically, and they describe what they saw — by voice or text. Offline if needed.",
              },
              {
                step: "3",
                title: "Responders notified instantly",
                description: "Your water bailiffs or committee members receive a push notification and email with the incident type, severity, location, and a direct link to the record.",
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

      {/* Field use case */}
      <section className="py-20 bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
                Built for remote, low-signal environments
              </h2>
              <div className="space-y-5">
                {[
                  { icon: WifiOff, text: "Works offline — reports queue on-device and upload when signal returns" },
                  { icon: Camera, text: "Native camera on mobile — take the photo and it's attached immediately" },
                  { icon: MapPin, text: "GPS auto-detected, or drop a pin on the map if location is unavailable" },
                  { icon: Bell, text: "Responders notified by push and email the moment a report is submitted" },
                  { icon: FileText, text: "Every report timestamped and GPS-tagged — immutable from the moment of submission" },
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
              <h3 className="font-bold text-white text-lg mb-3">Evidence for Proceedings</h3>
              <p className="text-sm text-primary-foreground/80 leading-relaxed mb-4">
                Every report submitted through GroupWatch can be exported as a court-admissible PDF including:
              </p>
              <ul className="space-y-2">
                {[
                  "Original submission locked — cannot be altered",
                  "Full GPS coordinates and timestamp",
                  "Full-resolution photos with EXIF metadata",
                  "Complete timestamped audit trail",
                  "Immutability footer for legal proceedings",
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
          <h2 className="text-2xl font-bold text-foreground text-center mb-12">FAQ for Angling Clubs</h2>
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
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">Ready to protect your waters?</h2>
          <p className="text-muted-foreground mb-8">Register your club today. First month completely free.</p>
          <Link href="/groups/new">
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
