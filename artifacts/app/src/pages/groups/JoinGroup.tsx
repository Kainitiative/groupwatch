import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Loader2, Users, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGetMe } from "@workspace/api-client-react";
import PublicLayout from "@/components/layout/PublicLayout";

interface GroupInfo {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
}

type JoinState = "loading" | "ready" | "joining" | "success" | "already-member" | "invalid" | "error";

export default function JoinGroup() {
  const { token } = useParams<{ token: string }>();
  const [, setLocation] = useLocation();
  const { data: user, isLoading: userLoading } = useGetMe();

  const [group, setGroup] = useState<GroupInfo | null>(null);
  const [joinState, setJoinState] = useState<JoinState>("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!token) return;
    fetch(`/api/groups/join/${token}`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("invalid");
        return res.json();
      })
      .then((data) => {
        setGroup(data);
        setJoinState("ready");
      })
      .catch(() => {
        setJoinState("invalid");
      });
  }, [token]);

  const handleJoin = async () => {
    if (!user) {
      setLocation(`/register?next=/groups/join/${token}`);
      return;
    }
    setJoinState("joining");
    try {
      const res = await fetch(`/api/groups/join/${token}`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Something went wrong");
        setJoinState("error");
        return;
      }
      if (data.message?.includes("already")) {
        setJoinState("already-member");
      } else {
        setJoinState("success");
      }
    } catch {
      setErrorMessage("Could not connect to the server. Please try again.");
      setJoinState("error");
    }
  };

  if (joinState === "loading" || userLoading) {
    return (
      <PublicLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </PublicLayout>
    );
  }

  if (joinState === "invalid") {
    return (
      <PublicLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
          <XCircle className="w-16 h-16 text-destructive mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Invalid Join Link</h1>
          <p className="text-muted-foreground max-w-md">
            This join link is invalid or has expired. Ask your group admin to share a fresh link.
          </p>
        </div>
      </PublicLayout>
    );
  }

  if (joinState === "success") {
    return (
      <PublicLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">You've joined {group?.name}!</h1>
          <p className="text-muted-foreground mb-6">You can now submit reports and view activity for this group.</p>
          <Button onClick={() => setLocation("/dashboard")} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-8">
            Go to Dashboard
          </Button>
        </div>
      </PublicLayout>
    );
  }

  if (joinState === "already-member") {
    return (
      <PublicLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
          <CheckCircle2 className="w-16 h-16 text-blue-500 mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">You're already a member</h1>
          <p className="text-muted-foreground mb-6">You're already part of {group?.name}.</p>
          <Button onClick={() => setLocation("/dashboard")} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-8">
            Go to Dashboard
          </Button>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-16">
        <div className="bg-card border border-border/50 rounded-2xl shadow-2xl shadow-black/5 p-8 w-full max-w-md text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            {group?.logoUrl ? (
              <img src={group.logoUrl} alt={group.name} className="w-12 h-12 rounded-xl object-cover" />
            ) : (
              <Users className="w-8 h-8 text-primary" />
            )}
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-1">You've been invited</h1>
          <p className="text-muted-foreground text-sm mb-4">You've been invited to join</p>
          <p className="text-xl font-semibold text-foreground mb-2">{group?.name}</p>
          {group?.description && (
            <p className="text-muted-foreground text-sm mb-6">{group.description}</p>
          )}

          {joinState === "error" && (
            <p className="text-destructive text-sm mb-4 bg-destructive/10 rounded-lg px-3 py-2">{errorMessage}</p>
          )}

          {user ? (
            <Button
              onClick={handleJoin}
              disabled={joinState === "joining"}
              className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg shadow-primary/20"
            >
              {joinState === "joining" ? <Loader2 className="w-5 h-5 animate-spin" /> : `Join ${group?.name}`}
            </Button>
          ) : (
            <div className="space-y-3">
              <Button
                onClick={() => setLocation(`/register?next=/groups/join/${token}`)}
                className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg shadow-primary/20"
              >
                Create account &amp; join
              </Button>
              <Button
                variant="outline"
                onClick={() => setLocation(`/login?next=/groups/join/${token}`)}
                className="w-full h-12 text-base font-semibold rounded-xl border-border/80"
              >
                Sign in &amp; join
              </Button>
              <p className="text-xs text-muted-foreground">You need a free account to join a group.</p>
            </div>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}
