import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Loader2, Gift, CheckCircle2, XCircle } from "lucide-react";
import PublicLayout from "@/components/layout/PublicLayout";

type InviteState =
  | { status: "loading" }
  | { status: "valid"; groupName: string; contactFirstName: string }
  | { status: "invalid"; error: string };

export default function JoinInvite() {
  const [location] = useLocation();
  const token = new URLSearchParams(window.location.search).get("invite") ?? "";
  const [invite, setInvite] = useState<InviteState>({ status: "loading" });

  useEffect(() => {
    if (!token) {
      setInvite({ status: "invalid", error: "No invitation token found." });
      return;
    }
    fetch(`/api/invitations/${token}/validate`, { credentials: "include" })
      .then(r => r.json())
      .then(data => {
        if (data.valid) {
          setInvite({ status: "valid", groupName: data.groupName, contactFirstName: data.contactFirstName });
        } else {
          setInvite({ status: "invalid", error: data.error ?? "This invitation is no longer valid." });
        }
      })
      .catch(() => setInvite({ status: "invalid", error: "Unable to verify invitation." }));
  }, [token]);

  return (
    <PublicLayout>
      <div className="min-h-[calc(100vh-80px)] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-background">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          {invite.status === "loading" && (
            <div className="flex flex-col items-center gap-4 py-16">
              <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
              <p className="text-muted-foreground text-sm">Verifying your invitation…</p>
            </div>
          )}

          {invite.status === "invalid" && (
            <div className="bg-card border border-border/50 rounded-2xl p-8 text-center shadow-xl shadow-black/5">
              <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-foreground mb-2">Invitation unavailable</h2>
              <p className="text-muted-foreground text-sm mb-6">{invite.error}</p>
              <Link
                href="/register"
                className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                Register without an invitation →
              </Link>
            </div>
          )}

          {invite.status === "valid" && (
            <div className="bg-card border border-border/50 rounded-2xl p-8 shadow-xl shadow-black/5">
              <div className="flex items-center justify-center w-14 h-14 bg-emerald-500/10 rounded-2xl mx-auto mb-6">
                <Gift className="w-7 h-7 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-foreground text-center mb-2">
                You've been invited
              </h2>
              <p className="text-center text-muted-foreground text-sm mb-6">
                This invitation is for <strong className="text-foreground">{invite.groupName}</strong>.
              </p>

              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-800">6 months free — applied automatically</p>
                    <p className="text-xs text-emerald-700 mt-0.5">No credit card needed. Your trial starts when you create your group.</p>
                  </div>
                </div>
              </div>

              <Link
                href={`/register?invite=${token}`}
                className="block w-full text-center bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors shadow-lg shadow-emerald-500/20"
              >
                Create your account →
              </Link>

              <p className="text-center text-xs text-muted-foreground mt-4">
                Already have an account?{" "}
                <Link href={`/login?next=/create-group?invite=${token}`} className="font-semibold text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}
