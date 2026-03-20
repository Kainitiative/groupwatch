import { Link } from "wouter";
import { ArrowRight, ShieldCheck, WifiOff, FileText, Zap, MapPin, Bell, BarChart3, CheckCircle2, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import PublicLayout from "@/components/layout/PublicLayout";

const audiences = [
  { emoji: "🎣", label: "Angling Clubs", pain: "Illegal dumping at your riverbank again?" },
  { emoji: "🌿", label: "Tidy Towns", pain: "Can't get the council to act without evidence?" },
  { emoji: "🏘️", label: "Neighbourhood Watch", pain: "Incidents going unreported because it's too complicated?" },
  { emoji: "🏡", label: "Residents Associations", pain: "Members calling you at all hours to report issues?" },
  { emoji: "⚽", label: "Sports Clubs", pain: "Vandalism at your grounds that nobody's tracking?" },
  { emoji: "🌍", label: "Environmental Groups", pain: "Fighting pollution with no hard data to back you up?" },
];

const testimonials = [
  {
    quote: "Before GroupWatch, I was getting WhatsApp messages at midnight about dumping incidents. Now everything goes through the system and I can actually track it.",
    name: "Group Administrator",
    org: "Midlands Angling Club",
  },
  {
    quote: "We used the incident summary report to secure €12,000 in council funding. The data made our case for us.",
    name: "Chairperson",
    org: "Tidy Towns Committee",
  },
  {
    quote: "Our members are in their 60s and 70s. If they can use it, anyone can. It just works.",
    name: "Secretary",
    org: "Neighbourhood Watch",
  },
];

export default function Landing() {
  return (
    <PublicLayout transparentHeader>

      {/* Hero */}
      <section className="relative pt-32 pb-24 md:pt-52 md:pb-36 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={`${import.meta.env.BASE_URL}images/hero-bg.png`}
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-primary/80 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/50 via-primary/85 to-background" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm mb-8 animate-in slide-in-from-bottom-4 duration-700">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-sm font-medium text-white/90 tracking-wide">1 month free — no credit card required</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight leading-[1.08] mb-6 animate-in slide-in-from-bottom-8 duration-700 delay-150">
            Your community has problems.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-300">
              Now you can prove it.
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-white/75 max-w-2xl mx-auto mb-4 animate-in slide-in-from-bottom-12 duration-700 delay-300 leading-relaxed">
            GroupWatch gives community groups a simple, offline-ready app to report incidents, build evidence, and take action — without the phone calls, spreadsheets, or paperwork.
          </p>

          <p className="text-base text-white/50 mb-10 animate-in fade-in duration-700 delay-400">
            Used by angling clubs, tidy towns, neighbourhood watch, residents associations and more.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 animate-in slide-in-from-bottom-16 duration-700 delay-500">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-base bg-amber-500 hover:bg-amber-400 text-white rounded-xl shadow-xl shadow-amber-500/30 hover:shadow-amber-400/40 hover:-translate-y-1 transition-all font-semibold">
                Start Free — Register Your Group
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/features">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-base bg-white/10 text-white border-white/20 hover:bg-white/20 rounded-xl backdrop-blur-sm transition-all">
                See How It Works
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Pain / Audience */}
      <section className="py-20 bg-background border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Sound familiar?</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              GroupWatch was built specifically for volunteer-run community groups who are tired of fighting problems with no tools.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {audiences.map((a) => (
              <div key={a.label} className="flex items-start gap-4 bg-card border border-border/50 rounded-2xl p-5 hover:border-primary/30 hover:shadow-md transition-all">
                <span className="text-3xl shrink-0">{a.emoji}</span>
                <div>
                  <p className="font-semibold text-foreground mb-1">{a.label}</p>
                  <p className="text-sm text-muted-foreground">{a.pain}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center mt-8 text-muted-foreground">
            GroupWatch gives your group the tools to <span className="font-semibold text-foreground">document, escalate, and prove</span> — so you stop being ignored.
          </p>
        </div>
      </section>

      {/* What it actually does */}
      <section className="py-24 bg-secondary/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Everything your group needs. Nothing it doesn't.</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Set up in under 10 minutes. No IT department required.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-card p-8 rounded-3xl shadow-xl shadow-black/5 border border-border/50 hover:shadow-2xl hover:border-border transition-all duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-accent/20 transition-all">
                <WifiOff className="w-7 h-7 text-accent" />
              </div>
              <h3 className="text-xl font-bold mb-3">Works in the Field, Offline</h3>
              <p className="text-muted-foreground leading-relaxed">
                No signal at the river? No problem. Members fill out the form, take photos, and capture GPS coordinates offline. It syncs automatically when they're back in range.
              </p>
            </div>

            <div className="bg-card p-8 rounded-3xl shadow-xl shadow-black/5 border border-border/50 hover:shadow-2xl hover:border-border transition-all duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary/20 transition-all">
                <ShieldCheck className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Evidence That Holds Up</h3>
              <p className="text-muted-foreground leading-relaxed">
                Every report is timestamped and locked. No one can alter the original — only add to it. Court-ready PDF exports mean your evidence is taken seriously.
              </p>
            </div>

            <div className="bg-card p-8 rounded-3xl shadow-xl shadow-black/5 border border-border/50 hover:shadow-2xl hover:border-border transition-all duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-amber-500/20 transition-all">
                <FileText className="w-7 h-7 text-amber-500" />
              </div>
              <h3 className="text-xl font-bold mb-3">Data That Wins Funding</h3>
              <p className="text-muted-foreground leading-relaxed">
                Generate professional summary reports with maps, charts, and statistics. Walk into a council meeting with hard data — and walk out with a grant.
              </p>
            </div>

            <div className="bg-card p-8 rounded-3xl shadow-xl shadow-black/5 border border-border/50 hover:shadow-2xl hover:border-border transition-all duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-blue-500/20 transition-all">
                <Bell className="w-7 h-7 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold mb-3">Instant Notifications</h3>
              <p className="text-muted-foreground leading-relaxed">
                Responders are alerted the moment a report is submitted. No more missed calls, no more WhatsApp chains. The right person gets the right alert immediately.
              </p>
            </div>

            <div className="bg-card p-8 rounded-3xl shadow-xl shadow-black/5 border border-border/50 hover:shadow-2xl hover:border-border transition-all duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all">
                <MapPin className="w-7 h-7 text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold mb-3">Map Every Incident</h3>
              <p className="text-muted-foreground leading-relaxed">
                See exactly where incidents are happening on an interactive map. Spot patterns, identify hotspots, and show the scale of the problem at a glance.
              </p>
            </div>

            <div className="bg-card p-8 rounded-3xl shadow-xl shadow-black/5 border border-border/50 hover:shadow-2xl hover:border-border transition-all duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-purple-500/20 transition-all">
                <BarChart3 className="w-7 h-7 text-purple-500" />
              </div>
              <h3 className="text-xl font-bold mb-3">Analytics Dashboard</h3>
              <p className="text-muted-foreground leading-relaxed">
                Track trends over time — what's increasing, what's been resolved, and where resources should go. Know your situation before you're asked about it.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Up and running in minutes.</h2>
          <p className="text-muted-foreground text-lg mb-16 max-w-xl mx-auto">No training. No IT support. If you can use WhatsApp, you can use GroupWatch.</p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { n: "1", title: "Create Your Group", desc: "Sign up, name your group, and choose your incident types. Takes about 5 minutes.", color: "bg-primary text-primary-foreground" },
              { n: "2", title: "Share Your QR Code", desc: "Print your unique QR code on signs, huts, and club newsletters. No app download needed for reporters.", color: "bg-primary text-primary-foreground" },
              { n: "3", title: "Members Report Instantly", desc: "Anyone scans the QR and fills in a quick form — with photo, GPS and notes — from their phone.", color: "bg-amber-500 text-white shadow-amber-500/30" },
              { n: "⚡", title: "You Take Action", desc: "Responders are notified, investigate, and update the record. Everything is tracked and timestamped.", color: "bg-primary text-primary-foreground" },
            ].map((step, i) => (
              <div key={i} className="relative">
                <div className={`w-16 h-16 mx-auto rounded-full ${step.color} flex items-center justify-center text-2xl font-bold mb-6 shadow-lg z-10 relative`}>
                  {step.n}
                </div>
                <h4 className="font-bold text-lg mb-2">{step.title}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                {i < 3 && <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-[2px] bg-border -z-0" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Real groups. Real results.</h2>
            <p className="text-primary-foreground/70 text-lg">Community groups across Ireland are already using GroupWatch to make their voices heard.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-white/10 border border-white/10 rounded-3xl p-8 backdrop-blur-sm">
                <Quote className="w-8 h-8 text-amber-400 mb-4" />
                <p className="text-primary-foreground/90 leading-relaxed mb-6 italic">"{t.quote}"</p>
                <div>
                  <p className="font-semibold text-white">{t.name}</p>
                  <p className="text-sm text-primary-foreground/60">{t.org}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing CTA */}
      <section className="py-24 bg-background">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Simple, honest pricing.</h2>
          <p className="text-muted-foreground text-xl mb-10">
            One flat price for your whole group. No per-seat fees. No surprises.
          </p>

          <div className="bg-card border border-border rounded-3xl p-10 shadow-2xl shadow-black/5 mb-8">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 mb-8">
              <div className="text-center">
                <p className="text-5xl font-extrabold text-foreground">€20</p>
                <p className="text-muted-foreground mt-1">per month</p>
              </div>
              <div className="text-muted-foreground font-medium">or</div>
              <div className="text-center">
                <p className="text-5xl font-extrabold text-foreground">€200</p>
                <p className="text-muted-foreground mt-1">per year <span className="text-emerald-600 font-semibold text-sm">(2 months free)</span></p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left mb-8">
              {[
                "Unlimited members", "Unlimited reports", "Offline mobile app",
                "Incident mapping", "Evidence-grade PDF exports", "Analytics dashboard",
                "Push notifications", "QR code reporting", "1-month free trial",
              ].map((f) => (
                <div key={f} className="flex items-center gap-3 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-foreground">{f}</span>
                </div>
              ))}
            </div>

            <Link href="/register">
              <Button size="lg" className="w-full h-14 text-base bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg shadow-primary/20 font-semibold">
                Start Your Free Month
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <p className="text-sm text-muted-foreground mt-4">No credit card required. Cancel anytime.</p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-amber-500">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
            Your community deserves better than a WhatsApp group.
          </h2>
          <p className="text-amber-100 text-lg mb-8">
            Give your members a proper tool. Give yourself back your evenings.
          </p>
          <Link href="/register">
            <Button size="lg" className="h-14 px-10 text-base bg-white text-amber-600 hover:bg-amber-50 rounded-xl shadow-xl font-bold transition-all hover:-translate-y-1">
              Register Your Group Free
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

    </PublicLayout>
  );
}
