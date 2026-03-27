import { ReactNode } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useGetMe } from "@workspace/api-client-react";

interface PublicLayoutProps {
  children: ReactNode;
  transparentHeader?: boolean;
}

export default function PublicLayout({ children, transparentHeader = false }: PublicLayoutProps) {
  const { data: user, isLoading: authLoading } = useGetMe();

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-accent/20 selection:text-accent">
      <header className={`w-full z-50 transition-all duration-300 ${
        transparentHeader ? "absolute top-0 left-0 bg-transparent" : "bg-card border-b border-border sticky top-0"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="flex items-center group-hover:opacity-90 transition-opacity">
              <img
                src={`${import.meta.env.BASE_URL}images/logo-banner.png`}
                alt="GroupWatch Platform"
                className="h-10 w-auto object-contain rounded-lg"
              />
            </Link>
            
            <nav className="hidden md:flex items-center gap-8">
              <Link href="/for/angling" className={`text-sm font-medium transition-colors hover:text-accent ${transparentHeader ? "text-white/80" : "text-muted-foreground"}`}>Groups</Link>
              <Link href="/pricing" className={`text-sm font-medium transition-colors hover:text-accent ${transparentHeader ? "text-white/80" : "text-muted-foreground"}`}>Pricing</Link>
              <Link href="/help" className={`text-sm font-medium transition-colors hover:text-accent ${transparentHeader ? "text-white/80" : "text-muted-foreground"}`}>Help</Link>
            </nav>

            <div className="flex items-center gap-3">
              {!authLoading && user ? (
                <Link href="/dashboard">
                  <Button className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold rounded-xl shadow-lg shadow-accent/25 hover:shadow-xl hover:shadow-accent/30 transition-all">
                    Dashboard
                  </Button>
                </Link>
              ) : !authLoading ? (
                <>
                  <Link href="/login" className={`text-sm font-medium transition-colors hover:text-accent ${transparentHeader ? "text-white" : "text-foreground"}`}>
                    Sign In
                  </Link>
                  <Link href="/register">
                    <Button className="bg-amber-500 hover:bg-amber-400 text-white font-semibold rounded-xl shadow-lg shadow-amber-500/25 hover:-translate-y-0.5 transition-all">
                      Get Started
                    </Button>
                  </Link>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {children}
      </main>

      <footer className="bg-primary text-primary-foreground py-12 md:py-16 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
            <div className="md:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <img src={`${import.meta.env.BASE_URL}images/logo-transparent.png`} alt="GroupWatch Platform" className="h-8 w-auto object-contain opacity-90" />
              </Link>
              <p className="text-primary-foreground/60 text-sm leading-relaxed">
                Real-time visibility of what's happening in your area, using your own members as eyes and ears on the ground.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Platform</h4>
              <ul className="space-y-3 text-sm text-primary-foreground/70">
                <li><Link href="/pricing" className="hover:text-accent transition-colors">Pricing</Link></li>
                <li><Link href="/features" className="hover:text-accent transition-colors">Features</Link></li>
                <li><Link href="/offline" className="hover:text-accent transition-colors">Offline App (PWA)</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Use Cases</h4>
              <ul className="space-y-3 text-sm text-primary-foreground/70">
                <li><Link href="/for/angling" className="hover:text-accent transition-colors">Angling Clubs</Link></li>
                <li><Link href="/for/environment" className="hover:text-accent transition-colors">Environmental Groups</Link></li>
                <li><Link href="/for/sports" className="hover:text-accent transition-colors">Sports Clubs</Link></li>
                <li><Link href="/for/neighbourhood-watch" className="hover:text-accent transition-colors">Neighbourhood Watch</Link></li>
                <li><Link href="/for/residents" className="hover:text-accent transition-colors">Residents Associations</Link></li>
                <li><Link href="/for/tidy-towns" className="hover:text-accent transition-colors">Tidy Towns</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-3 text-sm text-primary-foreground/70">
                <li><Link href="/help" className="hover:text-accent transition-colors">Help Centre</Link></li>
                <li><Link href="/legal" className="hover:text-accent transition-colors">Privacy & Terms</Link></li>
                <li><Link href="/contact" className="hover:text-accent transition-colors">Contact</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-primary-foreground/10 mt-12 pt-8 text-center md:text-left text-sm text-primary-foreground/50 flex flex-col md:flex-row justify-between items-center gap-4">
            <p>© {new Date().getFullYear()} GroupWatch Platform. All rights reserved.</p>
            <p>Made for the field.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
