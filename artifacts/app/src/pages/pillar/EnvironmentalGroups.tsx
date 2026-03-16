import { Link } from "wouter";
import { ArrowRight, Check, Camera, MapPin, WifiOff, FileText, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import PublicLayout from "@/components/layout/PublicLayout";

const incidentTypes = [
  "Illegal Dumping / Fly-tipping",
  "Water Pollution",
  "Air Quality / Burning",
  "Invasive Species",
  "Habitat Destruction",
  "Noise Pollution",
  "Wildlife Injury / Death",
  "Chemical Spill",
];

const faqs = [
  {
    q: "Can volunteers in the field submit reports without training?",
    a: "Yes. The report form is designed to be completed in under 2 minutes. GPS is auto-detected, photos are taken directly from the camera, and descriptions can be dictated by voice. No technical knowledge required.",
  },
  {
    q: "Will our reports hold up as evidence in regulatory complaints?",
    a: "Reports are immutable from the moment of submission — the original record cannot be altered. Court-ready PDFs include GPS coordinates, timestamps, full-resolution photos with EXIF data, and an immutability footer suitable for regulatory and legal use.",
  },
  {
    q: "Can we submit reports anonymously?",
    a: "Groups can enable anonymous reporting with a legal disclaimer. The reporter's identity is hidden from other members and responders but visible to the group administrator. We recommend legal advice before enabling this feature.",
  },
  {
    q: "How do we use this data for funding applications?",
    a: "The Analytics section shows reports over time, by type, by area, and by severity — with date range filters. The Summary PDF export produces a funding-quality document with your group logo, statistics, charts, and a narrative section.",
  },
  {
    q: "Can the public report incidents to our group without being a member?",
    a: "Yes. Each group has a public report link and a printable QR code. A member of the public can register an account and file a report in a single flow — useful for publicised campaigns or putting the QR code on awareness posters.",
  },
];

export default function EnvironmentalGroups() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="bg-primary text-primary-foreground py-24 md:py-36">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 text-white/90 text-sm font-semibold mb-6">
            Environmental Groups &amp; Conservation
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
            Document the damage. <br />
            <span className="text-accent">Build the case.</span>
          </h1>
          <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-10">
            Give volunteers a fast, offline-ready tool to log pollution, fly-tipping, habitat destruction, and wildlife incidents — with GPS evidence and court-ready exports.
          </p>
          <Link href="/groups/new">
            <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold rounded-xl h-14 px-8 shadow-lg shadow-accent/25">
              Register Your Group — Free Trial
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
              Incident categories your volunteers recognise
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              These are common examples — you create and name your own categories to match how your group works.
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
            From incident to evidence in minutes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: "1",
                title: "Volunteer spots an incident",
                description: "On a nature walk, during a clean-up, or from a car. They open IncidentIQ — or scan the QR code — and tap Report.",
              },
              {
                step: "2",
                title: "Document on the spot",
                description: "Photos from the native camera, GPS coordinates auto-detected, incident type selected from your group's custom list, and a description dictated by voice or typed.",
              },
              {
                step: "3",
                title: "Immediate response and record",
                description: "Designated responders are notified by push and email. The original record is permanently locked — time-stamped, GPS-tagged, and ready for regulatory referral.",
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
                Tools for field volunteers
              </h2>
              <div className="space-y-5">
                {[
                  { icon: WifiOff, text: "Works offline — no signal required in remote nature areas" },
                  { icon: Camera, text: "Photo evidence with GPS and timestamp preserved from EXIF data" },
                  { icon: MapPin, text: "Draw your group's monitoring areas as named map boundaries" },
                  { icon: Bell, text: "Alert your response team the moment a report comes in" },
                  { icon: FileText, text: "Export regulatory-quality PDFs and CSV data for funding bodies" },
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
              <h3 className="font-bold text-white text-lg mb-3">Funding Application Ready</h3>
              <p className="text-sm text-primary-foreground/80 leading-relaxed mb-4">
                The Summary PDF export generates a full funding-quality document including:
              </p>
              <ul className="space-y-2">
                {[
                  "Your group's logo and branding",
                  "Incident statistics for any date range",
                  "Charts: by type, severity, over time",
                  "Named map showing hotspot areas",
                  "Narrative section you write yourself",
                  "Up to 3 featured case summaries",
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
          <h2 className="text-2xl font-bold text-foreground text-center mb-12">FAQ for Environmental Groups</h2>
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
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">Start building your evidence base today.</h2>
          <p className="text-muted-foreground mb-8">First month completely free. No credit card required.</p>
          <Link href="/groups/new">
            <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold rounded-xl h-14 px-8 shadow-lg shadow-accent/25">
              Register Your Group — Free Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}
