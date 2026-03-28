import { Link } from "wouter";
import { LockKeyhole, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UpgradeWallProps {
  groupSlug: string;
  status: "trial" | "past_due" | "cancelled" | string;
}

export default function UpgradeWall({ groupSlug, status }: UpgradeWallProps) {
  const isTrialExpired = status === "trial";

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-6">
        <LockKeyhole className="w-8 h-8 text-amber-500" />
      </div>
      <h2 className="text-2xl font-bold text-foreground mb-3">
        {isTrialExpired ? "Your free trial has ended" : "Subscription required"}
      </h2>
      <p className="text-muted-foreground max-w-sm mb-8">
        {isTrialExpired
          ? "Your 30-day free trial has expired. Subscribe to keep your incident reporting running."
          : "Your subscription has lapsed. Resubscribe to regain full access to your group."}
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button asChild size="lg">
          <Link href={`/g/${groupSlug}/settings?tab=billing`}>
            <CreditCard className="w-4 h-4 mr-2" />
            {isTrialExpired ? "Subscribe Now" : "Resubscribe"}
          </Link>
        </Button>
        <Button variant="outline" size="lg" asChild>
          <a href="https://groupwatchplatform.com/pricing" target="_blank" rel="noopener noreferrer">
            View Plans
          </a>
        </Button>
      </div>
      <p className="mt-6 text-xs text-muted-foreground">
        Plans start at €20/month · Cancel any time · Your data is safe
      </p>
    </div>
  );
}
