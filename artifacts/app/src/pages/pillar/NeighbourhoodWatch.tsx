import { Link } from "wouter";
import { ArrowRight, Check, Camera, MapPin, WifiOff, FileText, Bell, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import PublicLayout from "@/components/layout/PublicLayout";

const incidentTypes = [
  "Suspicious Person / Vehicle",
  "Anti-Social Behaviour",
  "Criminal Damage / Graffiti",
  "Fly-tipping / Illegal Dumping",
  "Theft / Attempted Theft",
  "Noise Complaint",
  "Abandoned Vehicle",
  "Street Lighting Fault",
];

const faqs = [
  {
    q: "Can residents submit a report anonymously?",
    a: "Groups can enable anonymous reporting with a legal disclaimer. The reporter's identity is hidden from other members and the dashboard, but visible to the group administrator. We recommend taking legal advice before enabling this option.",
  },
  {
    q: "Can we share a QR code so residents don't need to download an app?",
    a: "Yes. Every group gets a shareable report link and a printable QR code. A resident who scans it can create a free account and file a full report in under two minutes — no app download required.",
  },
  {
    q: "Will our reports be useful as evidence for the Gardaí or local council?",
    a: "Reports are immutable from the moment of submission — nothing can be changed after the fact. Court-ready PDFs include GPS coordinates, full timestamps, photos with EXIF metadata, and an immutability footer suitable for use in legal and council submissions.",
  },
  {
    q: "Can we notify a specific co-ordinator when a report comes in?",
    a: "Yes. Any member you designate as a responder receives an instant push notification and email the moment a report is filed — including the incident type, severity, location, and a direct link to the record.",
  },
  {
    q: "Can we run more than one watch area from a single account?",
    a: "Each group represents one watch area. You can create multiple groups on the same account — one per estate, road, or townland — each with its own member list and incident history.",
  },
];

export default function NeighbourhoodWatch() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="bg-primary text-primary-foreground py-24 md:py-36">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 text-white/90 text-sm font-semibold mb-6">
            Neighbourhood Watch &amp; Community Groups
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
            Safer streets start with <br />
            <span className="text-accent">better reporting.</span>
          </h1>
          <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-10">
            Give every resident a fast, simple way to report incidents — from a phone, without an app download. GPS-tagged, timestamped, and court-admissible the moment it's submitted.
          </p>
          <Link href="/groups/new">
            <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold rounded-xl h-14 px-8 shadow-lg shadow-accent/25">
              Register Your Watch — Free Trial
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
              Incident types your residents actually use
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              You create the list. These are typical examples for a neighbourhood watch — add, rename, or remove any of them.
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
            How it works for neighbourhood watch
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: "1",
                title: "Resident spots something",
                description: "They open the app or scan the QR code on a local notice board, pick the incident type, and tap Report. Takes under two minutes.",
              },
              {
                step: "2",
                title: "Photos, GPS, description",
                description: "They attach photos directly from their phone camera, GPS is captured automatically, and they add a description — by voice or text.",
              },
              {
                step: "3",
                title: "Co-ordinators notified instantly",
                description: "Your watch co-ordinators receive a push notification and email with the incident type, location, and a direct link to the record.",
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

      {/* Feature highlights */}
      <section className="py-20 bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
                Built for residents, not just tech users
              </h2>
              <div className="space-y-5">
                {[
                  { icon: Eye, text: "Optional anonymous reporting — residents can report without revealing their identity" },
                  { icon: Camera, text: "Native phone camera — take a photo and it's attached to the report immediately" },
                  { icon: MapPin, text: "GPS auto-detected — no address needed, just open the app where the incident occurred" },
                  { icon: Bell, text: "Co-ordinators notified by push and email the instant a report is submitted" },
                  { icon: WifiOff, text: "Works offline — reports queue on-device and upload automatically when connectivity returns" },
                  { icon: FileText, text: "Every report immutably timestamped — suitable for Garda, council, and legal submissions" },
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
              <h3 className="font-bold text-white text-lg mb-3">Evidence for Gardaí &amp; Council</h3>
              <p className="text-sm text-primary-foreground/80 leading-relaxed mb-4">
                Every report can be exported as a court-admissible PDF including:
              </p>
              <ul className="space-y-2">
                {[
                  "Original submission locked — cannot be altered",
                  "Full GPS coordinates and timestamp",
                  "Full-resolution photos with EXIF metadata",
                  "Complete timestamped audit trail",
                  "Immutability footer for legal and council submissions",
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
          <h2 className="text-2xl font-bold text-foreground text-center mb-12">FAQ for Neighbourhood Watch</h2>
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
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">Ready to organise your watch?</h2>
          <p className="text-muted-foreground mb-8">Register today. First month completely free — no credit card required.</p>
          <Link href="/groups/new">
            <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold rounded-xl h-14 px-8 shadow-lg shadow-accent/25">
              Register Your Watch — Free Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}
