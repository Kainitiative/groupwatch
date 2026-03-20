import { Link } from "wouter";
import { ArrowRight, ShieldCheck, WifiOff, FileText, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import PublicLayout from "@/components/layout/PublicLayout";

export default function Landing() {
  return (
    <PublicLayout transparentHeader>
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={`${import.meta.env.BASE_URL}images/hero-bg.png`} 
            alt="Abstract dark background" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-primary/80 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/50 via-primary/80 to-background" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-dark mb-8 animate-in slide-in-from-bottom-4 duration-700">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-sm font-medium tracking-wide">The standard for organised groups</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-8 leading-[1.1] animate-in slide-in-from-bottom-8 duration-700 delay-150">
            Incident Reporting, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-accent">
              Built for the Field.
            </span>
          </h1>
          
          <p className="mt-4 text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-10 animate-in slide-in-from-bottom-12 duration-700 delay-300">
            Give your members a fast, offline-ready way to report incidents. Protect your community, build court-ready evidence, and easily secure funding.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 animate-in slide-in-from-bottom-16 duration-700 delay-500">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-base bg-amber-500 hover:bg-amber-400 text-white rounded-xl shadow-xl shadow-amber-500/30 hover:shadow-amber-400/40 hover:-translate-y-1 transition-all font-semibold">
                Register Your Group
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/features">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-base bg-primary-foreground/10 text-white border-primary-foreground/20 hover:bg-primary-foreground/20 rounded-xl backdrop-blur-sm transition-all">
                See All Features
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-sm text-primary-foreground/60 animate-in fade-in duration-1000 delay-700">
            €20/month • 1-month free trial • No credit card required
          </p>
        </div>
      </section>

      {/* Value Props */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-card p-8 rounded-3xl shadow-xl shadow-black/5 border border-border/50 hover:shadow-2xl hover:border-border transition-all duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-accent/20 transition-all">
                <WifiOff className="w-7 h-7 text-accent" />
              </div>
              <h3 className="text-xl font-bold mb-3">Works Completely Offline</h3>
              <p className="text-muted-foreground leading-relaxed">
                Field workers often have zero signal. Our PWA lets them fill out forms, capture GPS, and take photos offline. It auto-syncs the second they hit a connection.
              </p>
            </div>
            
            <div className="bg-card p-8 rounded-3xl shadow-xl shadow-black/5 border border-border/50 hover:shadow-2xl hover:border-border transition-all duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary/20 transition-all">
                <ShieldCheck className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Immutable Evidence</h3>
              <p className="text-muted-foreground leading-relaxed">
                Original submissions are locked forever. Every status change, note, and photo is appended chronologically. Court-ready PDF exports make prosecutions stick.
              </p>
            </div>
            
            <div className="bg-card p-8 rounded-3xl shadow-xl shadow-black/5 border border-border/50 hover:shadow-2xl hover:border-border transition-all duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-amber-500/20 transition-all">
                <FileText className="w-7 h-7 text-amber-500" />
              </div>
              <h3 className="text-xl font-bold mb-3">Funding Applications</h3>
              <p className="text-muted-foreground leading-relaxed">
                Stop guessing. Generate professional Summary PDFs with maps, charts, and hard data proving the extent of the issues your group faces to secure council funding.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-16">Simple to deploy, easy to use.</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="relative">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mb-6 shadow-lg z-10 relative">1</div>
              <h4 className="font-bold text-lg mb-2">Create Group</h4>
              <p className="text-sm text-muted-foreground">Sign up and customise your incident types in minutes.</p>
              <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-[2px] bg-border -z-0" />
            </div>
            <div className="relative">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mb-6 shadow-lg z-10 relative">2</div>
              <h4 className="font-bold text-lg mb-2">Share QR Code</h4>
              <p className="text-sm text-muted-foreground">Print your unique QR code on signs, huts, and newsletters.</p>
              <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-[2px] bg-border -z-0" />
            </div>
            <div className="relative">
              <div className="w-16 h-16 mx-auto rounded-full bg-amber-500 text-white flex items-center justify-center text-2xl font-bold mb-6 shadow-lg shadow-amber-500/30 z-10 relative">3</div>
              <h4 className="font-bold text-lg mb-2">Members Report</h4>
              <p className="text-sm text-muted-foreground">Anyone scans it and reports instantly from the field.</p>
              <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-[2px] bg-border -z-0" />
            </div>
            <div className="relative">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mb-6 shadow-lg z-10 relative"><Zap className="w-6 h-6" /></div>
              <h4 className="font-bold text-lg mb-2">Take Action</h4>
              <p className="text-sm text-muted-foreground">Responders get notified instantly and manage the issue.</p>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
