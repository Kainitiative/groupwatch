import { Link } from "wouter";
import {
  Fish,
  MapPin,
  Bell,
  Users,
  ShieldAlert,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Droplets,
  Eye,
} from "lucide-react";

interface Props {
  token: string;
  groupName: string;
  contactFirstName: string;
}

const FEATURES = [
  {
    icon: AlertTriangle,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    title: "Instant Poaching Alerts",
    body:
      "Any member who spots illegal netting or suspicious activity can report it in seconds. Every officer sees it immediately — no more relying on phone chains.",
  },
  {
    icon: Droplets,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    title: "Water Quality & Fish Kill Reports",
    body:
      "Log pollution events and fish kills with photos and precise GPS coordinates. Build a timestamped evidence trail you can hand directly to the environmental agencies.",
  },
  {
    icon: MapPin,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    title: "Pin-Point Location on the Map",
    body:
      "Members tap the exact stretch, beat, or weir on an interactive map. No more vague 'near the bridge' descriptions — officers know exactly where to go.",
  },
  {
    icon: Bell,
    color: "text-violet-500",
    bg: "bg-violet-500/10",
    title: "Push Notifications to All Members",
    body:
      "Critical sightings trigger instant push notifications to every member who has the app installed — including those not on duty.",
  },
  {
    icon: BarChart3,
    color: "text-sky-500",
    bg: "bg-sky-500/10",
    title: "Club Officer Dashboard",
    body:
      "A live feed of every sighting, sortable by type, date, and location. Export reports for IFI submissions, AGM records, or insurance claims.",
  },
  {
    icon: Users,
    color: "text-rose-500",
    bg: "bg-rose-500/10",
    title: "Your Whole Club, Connected",
    body:
      "Invite every member in minutes. Roles keep things tidy — officers manage, members report. One platform replaces the WhatsApp chaos.",
  },
];

const INCIDENT_TYPES = [
  "Illegal Netting / Poaching",
  "Water Pollution",
  "Dead Fish / Fish Kill",
  "Illegal Dumping at Riverbank",
  "Invasive Species Spotted",
  "Suspicious Activity",
];

export default function AnglingClubLanding({ token, groupName, contactFirstName }: Props) {
  const ctaHref = `/register?invite=${token}`;

  return (
    <div className="bg-slate-950 text-white min-h-screen">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[92vh] flex flex-col justify-end overflow-hidden">
        <img
          src="/images/fishing-hero.png"
          alt="Anglers at dawn on an Irish river"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-900/30" />

        <div className="relative z-10 max-w-4xl mx-auto px-6 pb-20 pt-32">
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/30 rounded-full px-4 py-1.5 mb-6">
            <Fish className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-300 text-sm font-medium">Built for Angling & Fishing Clubs</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6 text-white">
            Your club's eyes<br />
            <span className="text-emerald-400">on every stretch of water.</span>
          </h1>

          <p className="text-slate-300 text-lg sm:text-xl max-w-2xl mb-4 leading-relaxed">
            Hi <strong className="text-white">{contactFirstName}</strong> — GroupWatch gives{" "}
            <strong className="text-white">{groupName}</strong> a private platform where every member
            can report poaching, pollution, and fish kills in seconds — with GPS, photos, and instant
            alerts to every officer.
          </p>

          <p className="text-emerald-400 font-semibold text-base mb-10">
            6 months completely free. No credit card needed.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href={ctaHref}
              className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-base py-4 px-8 rounded-xl transition-all shadow-xl shadow-emerald-500/30 hover:shadow-emerald-400/40 hover:-translate-y-0.5"
            >
              Claim your 6 months free →
            </Link>
            <a
              href="#features"
              className="inline-flex items-center justify-center gap-2 border border-slate-600 hover:border-slate-400 text-slate-300 hover:text-white font-semibold text-base py-4 px-8 rounded-xl transition-all"
            >
              See how it works
            </a>
          </div>
        </div>
      </section>

      {/* ── Problem strip ────────────────────────────────────────────────── */}
      <section className="bg-slate-900 border-y border-slate-800 py-10 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-slate-400 text-base sm:text-lg">
            <span className="text-white font-semibold">Still running your club on WhatsApp groups and phone calls?</span>{" "}
            Reports get buried, no one knows who's following up, and there's no record when you need one.
            GroupWatch fixes that.
          </p>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Everything your club needs, nothing it doesn't
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              GroupWatch is purpose-built for angling clubs — the incident types, terminology,
              and workflows match exactly how your club operates on the water.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors"
              >
                <div className={`inline-flex items-center justify-center w-11 h-11 ${f.bg} rounded-xl mb-4`}>
                  <f.icon className={`w-5 h-5 ${f.color}`} />
                </div>
                <h3 className="text-white font-semibold text-base mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Incident types ───────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-slate-900">
        <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-12 items-center">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-3 py-1 mb-5">
              <ShieldAlert className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-blue-300 text-xs font-medium uppercase tracking-wider">Pre-configured for angling clubs</span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">
              Report types set up and ready to go
            </h2>
            <p className="text-slate-400 mb-8 leading-relaxed">
              When you create your group, these sighting categories are already built in.
              Add your own or remove any that don't apply — it takes seconds.
            </p>
            <ul className="space-y-3">
              {INCIDENT_TYPES.map((t) => (
                <li key={t} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span className="text-slate-300 text-sm">{t}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex-1 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl shadow-black/50">
            <img
              src="/images/fishing-map.png"
              alt="Angler using the map feature on smartphone"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* ── Community image ──────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto flex flex-col lg:flex-row-reverse gap-12 items-center">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1 mb-5">
              <Eye className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-300 text-xs font-medium uppercase tracking-wider">Real-time visibility</span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">
              Every member becomes a warden
            </h2>
            <p className="text-slate-400 leading-relaxed mb-6">
              Your club's waterways are too vast for any one person to watch.
              GroupWatch turns every member into a trusted reporter — with their phone,
              they can log what they see in under a minute, and your committee sees it instantly.
            </p>
            <p className="text-slate-400 leading-relaxed">
              Officers get a clean dashboard with every sighting mapped and timestamped.
              No more piecing together WhatsApp screenshots the night before an AGM.
            </p>
          </div>
          <div className="flex-1 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl shadow-black/50">
            <img
              src="/images/fishing-community.png"
              alt="Fishing club members reporting a sighting together"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* ── Pricing callout ──────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-slate-900">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-gradient-to-br from-emerald-900/40 to-slate-900 border border-emerald-800/50 rounded-3xl p-10 shadow-2xl">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/20 rounded-2xl mb-6 mx-auto">
              <Fish className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">
              6 months free — just for {groupName}
            </h2>
            <p className="text-slate-400 mb-2">
              Your exclusive invitation unlocks a full 6-month free trial.
              After that, it's just <strong className="text-white">€20/month</strong> — or{" "}
              <strong className="text-white">€200/year</strong> if you pay annually.
            </p>
            <p className="text-slate-500 text-sm mb-8">
              Unlimited members. Unlimited reports. No per-seat fees.
            </p>

            <div className="grid sm:grid-cols-3 gap-4 mb-10 text-left">
              {[
                { label: "Unlimited members", sub: "Invite every angler in the club" },
                { label: "No credit card now", sub: "Trial starts when you create your group" },
                { label: "Cancel any time", sub: "No lock-in, no penalties" },
              ].map((item) => (
                <div key={item.label} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mb-2" />
                  <p className="text-white text-sm font-semibold">{item.label}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{item.sub}</p>
                </div>
              ))}
            </div>

            <Link
              href={ctaHref}
              className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-lg py-4 px-10 rounded-xl transition-all shadow-xl shadow-emerald-500/30 hover:-translate-y-0.5"
            >
              Claim your 6 months free →
            </Link>
            <p className="text-slate-500 text-xs mt-4">
              Already have an account?{" "}
              <Link href={`/login?next=/create-group?invite=${token}`} className="text-emerald-400 hover:text-emerald-300 font-medium">
                Sign in instead
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* ── Footer CTA ───────────────────────────────────────────────────── */}
      <section className="py-20 px-6 text-center border-t border-slate-800">
        <p className="text-slate-500 text-sm">
          GroupWatch Platform · groupwatchplatform.com
        </p>
        <p className="text-slate-600 text-xs mt-1">
          Your data is stored securely and never shared with third parties.
        </p>
      </section>
    </div>
  );
}
