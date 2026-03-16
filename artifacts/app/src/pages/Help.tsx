import { Link } from "wouter";
import { ArrowRight, BookOpen, Settings, Bell, FileText, Smartphone, Users } from "lucide-react";
import PublicLayout from "@/components/layout/PublicLayout";

const sections = [
  {
    icon: Settings,
    title: "Setting Up Your Group",
    description: "Creating your group, adding incident types, inviting members, and configuring your first responders.",
    articles: [
      "Creating a group and starting your free trial",
      "Adding and customising incident types",
      "Inviting members by email or share link",
      "Setting up responders and permissions",
      "Drawing map boundaries for your area",
      "Adding escalation contacts",
    ],
  },
  {
    icon: Bell,
    title: "Responder Guide",
    description: "How to receive, claim, action, and resolve incoming reports.",
    articles: [
      "Enabling push notifications on your device",
      "Claiming and actioning a report",
      "Adding field notes and photos",
      "Escalating a report to an external contact",
      "Marking a report as resolved",
    ],
  },
  {
    icon: BookOpen,
    title: "Submitting Reports",
    description: "For members: how to file a report, attach photos, and use the app offline.",
    articles: [
      "Filing your first report",
      "Attaching photos and using the camera",
      "Submitting a report without internet",
      "Tracking the status of your reports",
      "Using the anonymous reporting option",
    ],
  },
  {
    icon: FileText,
    title: "Exports & Evidence",
    description: "Generating PDFs for court, legal proceedings, and funding applications.",
    articles: [
      "Exporting a court-ready individual report PDF",
      "Creating a funding application summary PDF",
      "Exporting reports as a CSV spreadsheet",
      "Understanding the immutability footer",
    ],
  },
  {
    icon: Smartphone,
    title: "Offline & PWA",
    description: "Installing the app on your phone and using it without a connection.",
    articles: [
      "Installing IncidentIQ on Android",
      "Installing IncidentIQ on iPhone",
      "How offline queuing works",
      "What happens when connectivity returns",
    ],
  },
  {
    icon: Users,
    title: "Billing & Account",
    description: "Managing your subscription, upgrading plans, and account settings.",
    articles: [
      "Understanding the free trial",
      "Upgrading from monthly to annual",
      "Cancelling your subscription",
      "Requesting a data export or deletion",
    ],
  },
];

export default function Help() {
  return (
    <PublicLayout>
      <section className="py-20 md:py-32 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-semibold mb-6">
              Help Centre
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-6">
              How can we help?
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Guides for admins, responders, and members — from first setup to exporting a court-ready PDF.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sections.map(({ icon: Icon, title, description, articles }) => (
              <div key={title} className="bg-card border border-border rounded-2xl p-6 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-accent" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{title}</h3>
                <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{description}</p>
                <ul className="space-y-2">
                  {articles.map((a) => (
                    <li key={a} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-accent transition-colors cursor-pointer">
                      <ArrowRight className="w-3 h-3 shrink-0" />
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-16 bg-muted/50 border border-border rounded-2xl p-8 text-center">
            <h3 className="font-semibold text-foreground mb-2">Can't find what you need?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Send us an email and we'll get back to you within one business day.
            </p>
            <Link href="/contact">
              <span className="text-sm font-medium text-accent hover:underline">Contact us →</span>
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
