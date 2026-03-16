import { Link } from "wouter";
import { ArrowRight, WifiOff, Download, RefreshCw, HardDrive, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import PublicLayout from "@/components/layout/PublicLayout";

export default function OfflinePwa() {
  return (
    <PublicLayout>
      <section className="py-20 md:py-32 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-6">
              <WifiOff className="w-8 h-8 text-accent" />
            </div>
            <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-semibold mb-6">
              Progressive Web App
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground mb-6">
              No signal? <br className="hidden md:block" />Still works.
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              IncidentIQ is a Progressive Web App — it installs on your phone like a native app and continues working when there's no internet connection.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            {[
              {
                icon: Download,
                title: "Install on Your Home Screen",
                description: "Add IncidentIQ to your home screen on Android or iOS. It opens full-screen with no browser chrome — just like a native app, without the App Store.",
              },
              {
                icon: WifiOff,
                title: "File Reports Without Signal",
                description: "The report form is cached locally. Members in remote areas, river banks, or fields with poor signal can complete and submit a full report offline.",
              },
              {
                icon: HardDrive,
                title: "Queued in Your Device",
                description: "Offline reports — including photos — are stored securely on the device using IndexedDB. Nothing is lost if you close the app.",
              },
              {
                icon: RefreshCw,
                title: "Auto-Submits on Reconnect",
                description: "The moment the device gets signal, Background Sync kicks in and submits all queued reports automatically — no action required from the member.",
              },
              {
                icon: Smartphone,
                title: "Camera-First on Mobile",
                description: "Tapping the photo button opens the native camera directly. No file browser, no extra steps. Take the photo and it's attached to the report.",
              },
              {
                icon: ArrowRight,
                title: "Dashboard Available Offline",
                description: "Responders can review recently loaded reports and add notes even without a connection. Notes sync back when connectivity is restored.",
              },
            ].map(({ icon: Icon, title, description }) => (
              <div key={title} className="bg-card border border-border rounded-2xl p-6">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-accent" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
            ))}
          </div>

          <div className="bg-primary text-primary-foreground rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-3">How to install on your phone</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8 text-left">
              <div>
                <h4 className="font-semibold text-white mb-3">Android (Chrome)</h4>
                <ol className="space-y-2 text-sm text-primary-foreground/80 list-decimal list-inside">
                  <li>Open IncidentIQ in Chrome</li>
                  <li>Tap the three-dot menu (⋮)</li>
                  <li>Tap "Add to Home screen"</li>
                  <li>Tap "Add" to confirm</li>
                </ol>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-3">iPhone / iPad (Safari)</h4>
                <ol className="space-y-2 text-sm text-primary-foreground/80 list-decimal list-inside">
                  <li>Open IncidentIQ in Safari</li>
                  <li>Tap the Share icon (□↑)</li>
                  <li>Scroll and tap "Add to Home Screen"</li>
                  <li>Tap "Add" to confirm</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="mt-16 text-center">
            <Link href="/groups/new">
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold rounded-xl h-14 px-8 shadow-lg shadow-accent/25">
                Register Your Group
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground">1-month free trial · No credit card required</p>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
