import { useRoute, useLocation } from "wouter";
import { useGetGroup } from "@workspace/api-client-react";
import { useGetMe } from "@workspace/api-client-react";
import { Share2, Facebook, ExternalLink, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import GroupSettingsLayout from "@/components/layout/GroupSettingsLayout";

function ComingSoonBadge() {
  return (
    <span className="text-xs bg-slate-700 text-slate-300 px-2.5 py-0.5 rounded-full font-medium">Coming Soon</span>
  );
}

function StepNum({ n }: { n: number }) {
  return (
    <span className="w-5 h-5 rounded-full bg-emerald-600/30 border border-emerald-600/50 text-emerald-400 text-xs font-bold flex items-center justify-center shrink-0">
      {n}
    </span>
  );
}

export default function GroupSettingsSocial() {
  const [, params] = useRoute("/g/:slug/settings/social");
  const slug = params?.slug ?? "";
  const [, navigate] = useLocation();
  const { toast } = useToast();

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

        {/* How to: Facebook Page button */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">📘</span>
            <h3 className="font-semibold text-white">Add a Report Button to your Facebook Page</h3>
          </div>
          <p className="text-sm text-slate-400 mb-5 leading-relaxed">
            Facebook Pages let you add a call-to-action button that links anywhere. You can use this to put a "Report an Incident" button right at the top of your group's Facebook Page — visible to every visitor without them needing to search for the link.
          </p>

          {group.publicReportingEnabled ? (
            <>
              <div className="bg-slate-800/60 rounded-xl p-3 mb-5 flex items-center gap-3">
                <span className="text-xs text-slate-400">Your report link:</span>
                <span className="text-sm text-slate-200 font-mono flex-1 truncate">{publicUrl}</span>
                <button
                  onClick={() => { navigator.clipboard.writeText(publicUrl); toast({ title: "Link copied!" }); }}
                  className="text-slate-400 hover:text-white transition-colors shrink-0"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>

              <ol className="space-y-3">
                {[
                  { step: "Go to your Facebook Page and click Edit Page at the top." },
                  { step: 'Click the "Add a button" option (or "Edit button" if one already exists).' },
                  { step: 'Choose "Contact you" or "Learn More", then select "Link to Website".' },
                  { step: "Paste your report link (copied above) into the URL field." },
                  { step: 'Give the button a label like "Report an Incident" and save. The button now appears at the top of your page for everyone.' },
                ].map(({ step }, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <StepNum n={i + 1} />
                    <p className="text-sm text-slate-300 leading-relaxed">{step}</p>
                  </li>
                ))}
              </ol>

              <div className="mt-5 bg-blue-950/30 border border-blue-700/30 rounded-xl p-3">
                <p className="text-xs text-slate-400">
                  <strong className="text-slate-300">Tip:</strong> You can also pin a post to the top of your page with the report link and a short message explaining what it's for. Pinned posts stay visible to all visitors.
                </p>
              </div>
            </>
          ) : (
            <div className="bg-slate-800/50 rounded-xl p-4">
              <p className="text-sm text-slate-400">
                You'll need to enable public reporting first to get your report link.{" "}
                <a href={`/g/${slug}/settings/widget`} className="text-emerald-400 hover:text-emerald-300">Go to Public Widget settings →</a>
              </p>
            </div>
          )}
        </div>

        {/* How to: WhatsApp group */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">💬</span>
            <h3 className="font-semibold text-white">Share the Report Link in a WhatsApp Group</h3>
          </div>
          <p className="text-sm text-slate-400 mb-5 leading-relaxed">
            Most community groups already use a WhatsApp group for quick communication. Pinning your report link there means members always have it to hand when they need to report something — even before they think to open the GroupWatch app.
          </p>

          {group.publicReportingEnabled ? (
            <>
              <div className="bg-slate-800/60 rounded-xl p-3 mb-5 flex items-center gap-3">
                <span className="text-xs text-slate-400">Your report link:</span>
                <span className="text-sm text-slate-200 font-mono flex-1 truncate">{publicUrl}</span>
                <button
                  onClick={() => { navigator.clipboard.writeText(publicUrl); toast({ title: "Link copied!" }); }}
                  className="text-slate-400 hover:text-white transition-colors shrink-0"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>

              <ol className="space-y-3 mb-5">
                {[
                  { step: "Copy your report link above." },
                  { step: "Open your WhatsApp group and send a message with the link. Something like: \"Use this link to report an incident to the group: [link]. Reports go directly to our dashboard.\"" },
                  { step: "Long-press the message and tap \"Pin\" to pin it to the top of the chat so it's always visible to everyone." },
                  { step: "(Optional) Update the WhatsApp group description to include the link, so new members see it immediately when they join." },
                ].map(({ step }, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <StepNum n={i + 1} />
                    <p className="text-sm text-slate-300 leading-relaxed">{step}</p>
                  </li>
                ))}
              </ol>

              <div className="bg-slate-800/50 rounded-xl p-4 space-y-3">
                <p className="text-xs text-slate-400 font-medium">Suggested message to share:</p>
                <div className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 relative">
                  <p className="text-sm text-slate-300 leading-relaxed pr-8">
                    👀 See something suspicious? Report it directly to the group here: <span className="text-emerald-400 break-all">{publicUrl}</span>
                    {" "}— no app or account needed, just fill in the form and we'll see it on our dashboard straight away.
                  </p>
                  <button
                    onClick={() => {
                      const msg = `👀 See something suspicious? Report it directly to the group here: ${publicUrl} — no app or account needed, just fill in the form and we'll see it on our dashboard straight away.`;
                      navigator.clipboard.writeText(msg);
                      toast({ title: "Message copied!" });
                    }}
                    className="absolute top-3 right-3 text-slate-400 hover:text-white transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-slate-500">Click the copy icon to copy this message with your link already included.</p>
              </div>
            </>
          ) : (
            <div className="bg-slate-800/50 rounded-xl p-4">
              <p className="text-sm text-slate-400">
                You'll need to enable public reporting first to get your report link.{" "}
                <a href={`/g/${slug}/settings/widget`} className="text-emerald-400 hover:text-emerald-300">Go to Public Widget settings →</a>
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
