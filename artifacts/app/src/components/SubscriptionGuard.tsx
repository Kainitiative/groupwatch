import { ReactNode } from "react";
import { useGetBillingStatus } from "@workspace/api-client-react";
import UpgradeWall from "@/components/UpgradeWall";

interface SubscriptionGuardProps {
  groupSlug: string;
  children: ReactNode;
}

export default function SubscriptionGuard({ groupSlug, children }: SubscriptionGuardProps) {
  const { data: billing, isLoading } = useGetBillingStatus(groupSlug);

  if (isLoading) return null;

  if (!billing) return <>{children}</>;

  const now = new Date();
  const trialExpired =
    billing.status === "trial" &&
    billing.trialEndsAt != null &&
    new Date(billing.trialEndsAt) <= now;

  const lapsed = billing.status === "cancelled" || billing.status === "past_due";

  if (trialExpired || lapsed) {
    return <UpgradeWall groupSlug={groupSlug} status={billing.status} />;
  }

  return <>{children}</>;
}
