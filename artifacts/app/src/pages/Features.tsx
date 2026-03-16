import { Link } from "wouter";
import { ArrowRight, Camera, MapPin, WifiOff, Bell, FileText, BarChart2, ShieldCheck, Users, QrCode, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import PublicLayout from "@/components/layout/PublicLayout";

const features = [
  {
    icon: WifiOff,
    title: "Works Offline",
    description: "Reports are queued on-device when there's no signal and automatically submitted the moment connectivity returns. Perfect for remote lakes, reserves, and rural patrol routes.",
  },
  {
    icon: Camera,
    title: "Photo Evidence",
    description: "Multiple photos per report. GPS coordinates and timestamps are extracted automatically from photo EXIF data — preserving the chain of evidence without any manual entry.",
  },
  {
    icon: MapPin,
    title: "Precise GPS Location",
    description: "Location auto-detected on form load. If GPS is unavailable, members drop a pin on an interactive map. Optionally draw named boundary zones for your area.",
  },
  {
    icon: Bell,
    title: "Instant Notifications",
    description: "Push notifications and emails go to your responders the moment a report is filed. Configurable per-person — notify only who needs to know.",
  },
  {
    icon: Mic,
    title: "Voice-to-Text",
    description: "Members dictate their report description hands-free using the Web Speech API. Ideal for responders who are still on-scene when reporting.",
  },
  {
    icon: ShieldCheck,
    title: "Immutable Records",
    description: "Report submissions are permanently locked the moment they're filed. All actions are appended to an audit trail — nothing can be altered retroactively.",
  },
  {
    icon: FileText,
    title: "Court-Ready PDFs",
    description: "Export individual incident records as court-admissible PDFs with full-resolution photos, GPS data, EXIF metadata, and a timestamped audit timeline.",
  },
  {
    icon: BarChart2,
    title: "Analytics & Charts",
    description: "Reports over time, breakdown by type and severity, response time trends, and a day-of-week heatmap. Filter by date range for funding application periods.",
  },
  {
    icon: Users,
    title: "Flexible Roles",
    description: "Admins, responders, and members. Per-person permission flags control who receives notifications, who can view the dashboard, and who can action reports.",
  },
  {
    icon: QrCode,
    title: "Print-Ready QR Code",
    description: "Download a high-resolution QR code linking directly to your group's report form. Stick it on notice boards, vehicles, or club house entrances.",
  },
];

export default function Features() {
  return (
    <PublicLayout>
      <section className="py-20 md:py-32 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-semibold mb-6">
              Everything You Need
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground mb-6">
              Built for the field. <br className="hidden md:block" />
              Not the office.
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Every feature in IncidentIQ was designed around one scenario: a member on the ground, possibly without signal, needing to record what they just witnessed.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, description }) => (
              <div key={title} className="bg-card border border-border rounded-2xl p-6 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-accent" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
            ))}
          </div>

          <div className="mt-20 text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">Ready to get your group set up?</h2>
            <p className="text-muted-foreground mb-8">First month free. No credit card required.</p>
            <Link href="/groups/new">
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold rounded-xl h-14 px-8 shadow-lg shadow-accent/25">
                Register Your Group
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
