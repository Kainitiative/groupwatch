import { useState, useEffect } from "react";
import { Download, Share, X, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PwaPrompts() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showAndroid, setShowAndroid] = useState(false);
  const [showIos, setShowIos] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    // Offline detection
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Android/Chrome Install Prompt
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (!sessionStorage.getItem('pwa-prompt-dismissed')) {
        setShowAndroid(true);
      }
    });

    // iOS Safari Detection
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    
    if (isIos && !isStandalone && !sessionStorage.getItem('pwa-prompt-dismissed')) {
      setShowIos(true);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowAndroid(false);
    }
    setDeferredPrompt(null);
  };

  const dismiss = () => {
    sessionStorage.setItem('pwa-prompt-dismissed', 'true');
    setShowAndroid(false);
    setShowIos(false);
  };

  return (
    <>
      {/* Offline Banner */}
      {isOffline && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-destructive text-destructive-foreground px-4 py-2.5 flex items-center justify-center gap-3 shadow-lg animate-in slide-in-from-top-full">
          <WifiOff className="w-4 h-4 shrink-0" />
          <p className="text-sm font-medium text-center">You're offline — reports will sync when you reconnect.</p>
        </div>
      )}

      {/* Android Install Banner */}
      {showAndroid && (
        <div className="fixed bottom-4 left-4 right-4 md:bottom-8 md:left-auto md:right-8 md:w-96 z-50 bg-card border border-border shadow-2xl rounded-2xl p-4 flex flex-col gap-3 animate-in slide-in-from-bottom-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-3 items-center">
              <div className="bg-primary/10 p-2 rounded-xl text-primary shrink-0">
                <Download className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground text-sm">Install GroupWatch</h4>
                <p className="text-xs text-muted-foreground mt-0.5">For faster reporting in the field.</p>
              </div>
            </div>
            <button onClick={dismiss} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
          <Button onClick={handleInstallClick} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold rounded-xl">
            Install App
          </Button>
        </div>
      )}

      {/* iOS Install Tooltip */}
      {showIos && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-50 bg-card border border-border shadow-2xl rounded-2xl p-4 animate-in slide-in-from-bottom-8 flex flex-col gap-3">
          <div className="flex justify-between items-start">
            <h4 className="font-semibold text-foreground text-sm">Install App</h4>
            <button onClick={dismiss} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-muted-foreground">
            Install GroupWatch to your home screen for offline access and faster reporting.
          </p>
          <div className="bg-secondary p-3 rounded-xl flex items-center justify-center gap-3 text-sm text-secondary-foreground font-medium border border-border/50">
            Tap <Share className="w-4 h-4 text-accent" /> then 'Add to Home Screen'
          </div>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-card border-b border-r border-border rotate-45" />
        </div>
      )}
    </>
  );
}
