import { useRoute, useLocation } from "wouter";
import { useGetGroup } from "@workspace/api-client-react";
import { useGetMe } from "@workspace/api-client-react";
import { Share2, Facebook, ExternalLink } from "lucide-react";
import GroupSettingsLayout from "@/components/layout/GroupSettingsLayout";

function ComingSoonBadge() {
  return (
    <span className="text-xs bg-slate-700 text-slate-300 px-2.5 py-0.5 rounded-full font-medium">Coming Soon</span>
  );
}

export default function GroupSettingsSocial() {
  const [, params] = useRoute("/g/:slug/settings/social");
  const slug = params?.slug ?? "";
  const [, navigate] = useLocation();

  const { data: group, isLoading } = useGetGroup(slug);
  const { data: user, isLoading: userLoading, isError: userError } = useGetMe();

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
    navigate(`/login?next=/g/${slug}/settings/social`);
    return null;
  }

  if (!group) {
    return (
      <GroupSettingsLayout groupSlug={slug}>
        <div className="text-slate-400 p-8">Group not found.</div>
      </GroupSettingsLayout>
    );
  }

  const publicUrl = `${window.location.origin}/r/${slug}`;

  return (
    <GroupSettingsLayout groupSlug={slug} groupName={group.name}>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white">Social Media</h2>
        <p className="text-sm text-slate-400 mt-1">
          Connect your group's reporting activity to social media platforms to raise awareness and encourage your community to report incidents.
        </p>
      </div>

      <div className="space-y-6">
        {/* Current: Facebook share */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-2">
            <Facebook className="w-4 h-4 text-blue-400" />
            <h3 className="font-semibold text-white">Facebook Share Button</h3>
            <span className="text-xs bg-emerald-600/20 text-emerald-400 border border-emerald-700/40 px-2.5 py-0.5 rounded-full font-medium">Active</span>
          </div>
          <p className="text-sm text-slate-400 mb-4 leading-relaxed">
            Every public incident report on your group already includes a Facebook Share button. When a member or member of the public views a public report, they can share it directly to their Facebook timeline, page, or group — bringing wider visibility to incidents in your area.
          </p>
          <div className="bg-slate-800/60 rounded-xl p-4">
            <p className="text-xs text-slate-400 mb-1.5 font-medium">How it works</p>
            <ul className="space-y-1.5">
              {[
                "Public reports automatically include a 'Share on Facebook' button.",
                "Clicking it opens a pre-filled Facebook share dialog with the report link.",
                "The link directs people to the public report page — they can read the details without creating a GroupWatch account.",
                "No setup required — this works out of the box for all groups with public reporting enabled.",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                  <span className="text-emerald-500 mt-0.5 shrink-0">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          {group.publicReportingEnabled ? (
            <div className="mt-4 flex items-center gap-3">
              <a
                href={publicUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                <ExternalLink className="w-3 h-3" /> Preview your public report page
              </a>
            </div>
          ) : (
            <div className="mt-4 bg-slate-800/50 rounded-xl p-3">
              <p className="text-xs text-slate-500">
                Enable public reporting in the{" "}
                <a href={`/g/${slug}/settings/widget`} className="text-emerald-400 hover:text-emerald-300">Public Widget settings</a>{" "}
                to activate share buttons on your public report pages.
              </p>
            </div>
          )}
        </div>

        {/* Coming soon integrations */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Planned Integrations</h3>
          </div>
          <p className="text-sm text-slate-400 mb-5">
            We're building deeper social media integrations. The features below are on our roadmap — they'll allow you to automatically post incident activity updates to your group's social channels without leaving GroupWatch.
          </p>

          <div className="space-y-3">
            {[
              {
                name: "Facebook Page Auto-Post",
                icon: "📘",
                description: "Automatically post a summary when a new incident is filed or resolved to your group's Facebook Page.",
              },
              {
                name: "Facebook Group Notifications",
                icon: "👥",
                description: "Send incident alerts directly to a Facebook Group your members already use.",
              },
              {
                name: "Instagram Stories",
                icon: "📸",
                description: "Push incident highlights as Instagram Stories to your organisation's account.",
              },
              {
                name: "X / Twitter",
                icon: "𝕏",
                description: "Tweet incident alerts automatically to your organisation's X account.",
              },
            ].map(({ name, icon, description }) => (
              <div key={name} className="flex items-start gap-3 bg-slate-800/50 rounded-xl p-4">
                <span className="text-2xl shrink-0">{icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-white">{name}</p>
                    <ComingSoonBadge />
                  </div>
                  <p className="text-xs text-slate-400">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Request features */}
        <div className="bg-emerald-950/30 border border-emerald-700/30 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <Share2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-emerald-300 mb-1">Have a suggestion?</h3>
              <p className="text-sm text-emerald-400/80 mb-3">
                If there's a platform or integration you'd like to see, let us know. We prioritise features based on what our users need most.
              </p>
              <a
                href="mailto:support@groupwatchplatform.com?subject=Social Media Integration Request"
                className="inline-flex items-center gap-1.5 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Contact us with your request
              </a>
            </div>
          </div>
        </div>
      </div>
    </GroupSettingsLayout>
  );
}
