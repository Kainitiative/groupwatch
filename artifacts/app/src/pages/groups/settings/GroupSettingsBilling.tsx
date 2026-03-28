import { useRoute, useLocation } from "wouter";
import { useGetGroup, useGetBillingStatus, useCreateCheckoutSession } from "@workspace/api-client-react";
import { useGetMe } from "@workspace/api-client-react";
import { CreditCard, ExternalLink } from "lucide-react";
import GroupSettingsLayout from "@/components/layout/GroupSettingsLayout";

export default function GroupSettingsBilling() {
  const [, params] = useRoute("/g/:slug/settings/billing");
  const slug = params?.slug ?? "";
  const [, navigate] = useLocation();

  const { data: group, isLoading } = useGetGroup(slug);
  const { data: user, isLoading: userLoading, isError: userError } = useGetMe();
  const { data: billing } = useGetBillingStatus(slug);
  const checkout = useCreateCheckoutSession();

  if (isLoading) {
    return (
      <GroupSettingsLayout groupSlug={slug}>
        <div className="flex items-center justify-center h-64">
          <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </GroupSettingsLayout>
    );
  }

  if (!userLoading && (userError || !user)) {
    navigate(`/login?next=/g/${slug}/settings/billing`);
    return null;
  }

  if (!group) {
    return (
      <GroupSettingsLayout groupSlug={slug}>
        <div className="text-slate-400 p-8">Group not found.</div>
      </GroupSettingsLayout>
    );
  }

  const statusBadge = () => {
    if (billing?.status === "active") return "bg-emerald-500/20 text-emerald-400";
    if (billing?.status === "trial") return "bg-blue-500/20 text-blue-400";
    if (billing?.status === "past_due") return "bg-yellow-500/20 text-yellow-400";
    return "bg-slate-700 text-slate-400";
  };

  const statusLabel = () => {
    if (billing?.status === "trial") return "Free Trial";
    if (billing?.status === "active") return "Active";
    if (billing?.status === "past_due") return "Payment Due";
    return "Cancelled";
  };

  return (
    <GroupSettingsLayout groupSlug={slug} groupName={group.name}>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white">Billing</h2>
        <p className="text-sm text-slate-400 mt-1">
          Manage your GroupWatch subscription. Choose the plan that suits your group — monthly for flexibility, or annual for the best value. Your subscription covers all features for this group with no per-member charges.
        </p>
      </div>

      <div className="space-y-4">
        {/* Status card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <CreditCard className="w-4 h-4 text-emerald-400" />
            <h3 className="font-semibold text-white">Subscription Status</h3>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusBadge()}`}>
              {statusLabel()}
            </span>
            {billing?.plan && (
              <span className="text-sm text-slate-400">
                {billing.plan === "monthly" ? "€20/month" : "€200/year"}
              </span>
            )}
          </div>

          {billing?.status === "trial" && billing.trialEndsAt && (
            <div className="bg-blue-950/30 border border-blue-700/40 rounded-xl p-4 mb-6">
              <p className="text-sm text-blue-300">
                Trial ends <strong>{new Date(billing.trialEndsAt).toLocaleDateString("en-IE", { day: "numeric", month: "long", year: "numeric" })}</strong>
              </p>
              <p className="text-xs text-blue-400 mt-1">Subscribe before your trial ends to avoid interruption.</p>
            </div>
          )}

          {billing?.status === "active" && (
            <div className="bg-emerald-950/30 border border-emerald-700/40 rounded-xl p-4 mb-6">
              <p className="text-sm text-emerald-300">Your subscription is active. Thank you for supporting GroupWatch Platform.</p>
            </div>
          )}

          {(billing?.status === "trial" || billing?.status === "cancelled") && (
            <div>
              <p className="text-sm text-slate-300 mb-4 font-medium">Choose a plan to get started:</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => checkout.mutate({ groupSlug: slug, data: { plan: "monthly" } }, {
                    onSuccess: (data) => data.url && window.location.replace(data.url),
                  })}
                  disabled={checkout.isPending}
                  className="p-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-blue-500 rounded-xl text-left transition-all cursor-pointer hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-0.5 disabled:opacity-50"
                >
                  <p className="font-bold text-white">€20 / month</p>
                  <p className="text-xs text-slate-400 mt-1">Billed monthly · cancel anytime</p>
                </button>
                <button
                  onClick={() => checkout.mutate({ groupSlug: slug, data: { plan: "annual" } }, {
                    onSuccess: (data) => data.url && window.location.replace(data.url),
                  })}
                  disabled={checkout.isPending}
                  className="p-4 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-700/50 hover:border-emerald-400 rounded-xl text-left transition-all cursor-pointer hover:shadow-lg hover:shadow-emerald-500/20 hover:-translate-y-0.5 relative disabled:opacity-50"
                >
                  <span className="absolute top-2 right-2 text-xs bg-emerald-600 text-white px-2 py-0.5 rounded-full">Best value</span>
                  <p className="font-bold text-white">€200 / year</p>
                  <p className="text-xs text-emerald-400 mt-1">Saves 2 months vs monthly</p>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* What's included */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="font-semibold text-white mb-4">What's included</h3>
          <ul className="space-y-2.5">
            {[
              "Unlimited incident reports",
              "Unlimited members",
              "Real-time push notifications",
              "Analytics dashboard",
              "Public reporting widget & embed code",
              "Escalation contacts & workflows",
              "REST API access",
              "QR code join links",
              "Priority email support",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2.5 text-sm text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Support */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="font-semibold text-white mb-2">Need help?</h3>
          <p className="text-sm text-slate-400 mb-3">
            For billing questions, invoice requests, or to discuss custom pricing for multiple groups, get in touch.
          </p>
          <a
            href="mailto:support@groupwatchplatform.com"
            className="inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            support@groupwatchplatform.com
          </a>
        </div>
      </div>
    </GroupSettingsLayout>
  );
}
