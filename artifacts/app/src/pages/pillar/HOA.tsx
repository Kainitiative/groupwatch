import { Link } from "wouter";
import { ArrowRight, Check, Camera, MapPin, FileText, Bell, Home, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import PublicLayout from "@/components/layout/PublicLayout";

const incidentTypes = [
  "Common Area Damage",
  "Unauthorised Parking",
  "Noise Complaint",
  "Waste / Bin Area Issue",
  "Grounds Maintenance Required",
  "Security Concern",
  "Anti-Social Behaviour",
  "Structural / Safety Issue",
];

const faqs = [
  {
    q: "Can residents report issues without creating an account?",
    a: "Any resident who follows your group's shareable link or scans the QR code in the complex can create a free account and submit a report in under two minutes — no app download, no admin setup required.",
  },
  {
    q: "Can we use this for AGM evidence or management company disputes?",
    a: "Yes. Every report is immutable from the moment of submission and can be exported as a court-ready PDF, complete with GPS coordinates, timestamps, photos with EXIF data, and an immutability footer. Suitable for management company correspondence, tribunal submissions, and legal proceedings.",
  },
  {
    q: "Can the management company or property manager receive notifications?",
    a: "Yes. You can designate your property manager or management company contact as a responder. They'll receive an instant push notification and email the moment a report is submitted, with the full incident details and a link to the record.",
  },
  {
    q: "Can we track recurring issues in a specific area of the complex?",
    a: "Yes. The map boundary tool lets you draw named zones — car park, bin stores, green areas, entrances — and divide them into sections. Reports are tagged to the relevant zone automatically, making it easy to identify recurring problem areas.",
  },
  {
    q: "We manage multiple complexes — do we need separate accounts?",
    a: "No. You can create multiple groups on the same account — one per complex or development — each with its own member list, incident history, and settings. Manage them all from your single dashboard.",
  },
];

export default function HOA() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="bg-primary text-primary-foreground py-24 md:py-36">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 text-white/90 text-sm font-semibold mb-6">
            Residents Associations &amp; Management Companies
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
            Manage your complex. <br />
            <span className="text-accent">Build the paper trail.</span>
          </h1>
          <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-10">
            Give residents a simple, structured way to report issues in shared spaces — car parks, bin stores, common areas. Every report is GPS-tagged, timestamped, and legally admissible.
          </p>
          <Link href="/register">
            <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold rounded-xl h-14 px-8 shadow-lg shadow-accent/25">
              Register Your Association — Free Trial
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
              You create the list. These are typical examples for a residents association — add, rename, or remove any of them.
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
            How it works for residents associations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: "1",
                title: "Resident spots an issue",
                description: "They open the app or scan a QR code posted in the lobby or notice board, select the issue type, and submit their report in under two minutes.",
              },
              {
                step: "2",
                title: "Photos, location, description",
                description: "They attach photos from their phone camera, GPS location is captured automatically for outdoor issues, and they describe the problem by voice or text.",
              },
              {
                step: "3",
                title: "Management notified instantly",
                description: "Your property manager or committee receives a push notification and email with full incident details and a link to the record — so nothing falls through the cracks.",
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
                The paper trail that protects your committee
              </h2>
              <div className="space-y-5">
                {[
                  { icon: Home, text: "Zone-based map boundaries — car park, bin stores, green areas — reports tagged automatically" },
                  { icon: Camera, text: "Native phone camera — residents attach photos directly without leaving the app" },
                  { icon: MapPin, text: "GPS coordinates captured for outdoor issues — no address typing required" },
                  { icon: Bell, text: "Property manager notified by push and email the instant a report is submitted" },
                  { icon: Users, text: "Assign roles — committee chair, property manager, maintenance — each with appropriate access" },
                  { icon: FileText, text: "Court-ready PDF exports for management company correspondence and legal submissions" },
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
              <h3 className="font-bold text-white text-lg mb-3">For AGMs and Dispute Resolution</h3>
              <p className="text-sm text-primary-foreground/80 leading-relaxed mb-4">
                Every report can be exported as a court-admissible PDF including:
              </p>
              <ul className="space-y-2">
                {[
                  "Original submission locked — cannot be altered",
                  "Full GPS coordinates and timestamp",
                  "Full-resolution photos with EXIF metadata",
                  "Complete timestamped audit trail",
                  "Immutability footer for legal and tribunal submissions",
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
          <h2 className="text-2xl font-bold text-foreground text-center mb-12">FAQ for Residents Associations</h2>
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
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">Ready to manage your complex better?</h2>
          <p className="text-muted-foreground mb-8">Register today. First month completely free — no credit card required.</p>
          <Link href="/register">
            <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold rounded-xl h-14 px-8 shadow-lg shadow-accent/25">
              Register Your Association — Free Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}
