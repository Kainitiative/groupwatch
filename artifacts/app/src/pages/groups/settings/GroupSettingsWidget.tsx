import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useGetGroup, useUpdateGroup, getGetGroupQueryKey } from "@workspace/api-client-react";
import { useGetMe } from "@workspace/api-client-react";
import { Globe, Copy, ExternalLink, ToggleLeft, ToggleRight, Code2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useToast } from "@/hooks/use-toast";
import GroupSettingsLayout from "@/components/layout/GroupSettingsLayout";

function StepBadge({ n }: { n: number }) {
  return (
    <span className="w-6 h-6 rounded-full bg-emerald-600/30 border border-emerald-600/50 text-emerald-400 text-xs font-bold flex items-center justify-center shrink-0">
      {n}
    </span>
  );
}

export default function GroupSettingsWidget() {
  const [, params] = useRoute("/g/:slug/settings/widget");
  const slug = params?.slug ?? "";
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const queryClient = useQueryClient();
  const { data: group, isLoading } = useGetGroup(slug);
  const { data: user, isLoading: userLoading, isError: userError } = useGetMe();
  const updateGroup = useUpdateGroup();

  const [toggling, setToggling] = useState(false);

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
    navigate(`/login?next=/g/${slug}/settings/widget`);
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
  const embedCode = `<iframe\n  src="${publicUrl}"\n  width="100%"\n  height="600"\n  frameborder="0"\n  style="border-radius:16px;border:1px solid #e5e7eb;"\n  title="Report an Incident"\n></iframe>`;

  const handleToggle = async () => {
    setToggling(true);
    try {
      const enabling = !group.publicReportingEnabled;
      await updateGroup.mutateAsync(
        { groupSlug: slug, data: { publicReportingEnabled: enabling } }
      );
      await queryClient.invalidateQueries({ queryKey: getGetGroupQueryKey(slug) });
      toast({ title: enabling ? "Public reporting enabled" : "Public reporting disabled" });
    } finally {
      setToggling(false);
    }
  };

  return (
    <GroupSettingsLayout groupSlug={slug} groupName={group.name}>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white">Public Reporting Widget</h2>
        <p className="text-sm text-slate-400 mt-1">
          Let anyone submit an incident report to your group — no account required. Perfect for embedding on your club website, sharing on social media, or printing as a QR code at your venue. Once enabled, you get a shareable link and an iframe snippet you can drop into any website.
        </p>
      </div>

      <div className="space-y-6">
        {/* What is this? */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="font-semibold text-white mb-3">How it works</h3>
          <div className="space-y-3">
            {[
              "Enable public reporting below to generate your unique reporting link.",
              "Share the link directly, embed it on your website using the iframe code, or display the QR code at your venue.",
              "Anyone who visits the link can submit an incident — they don't need to create an account.",
              "Reports submitted publicly appear in your group's dashboard alongside member-filed reports. You can action, escalate, or dismiss them like any other report.",
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <StepBadge n={i + 1} />
                <p className="text-sm text-slate-300 leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Enable toggle */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-semibold text-white mb-1">Public Reporting</h3>
              <p className="text-sm text-slate-400">
                {group.publicReportingEnabled
                  ? "Currently enabled — anyone with the link can submit a report."
                  : "Currently disabled — only members can file reports."}
              </p>
            </div>
            <button
              onClick={handleToggle}
              disabled={toggling}
              className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-700 text-sm font-medium transition-colors disabled:opacity-50"
              style={group.publicReportingEnabled ? { background: "#10b981", borderColor: "#10b981", color: "white" } : {}}
            >
              {group.publicReportingEnabled
                ? <><ToggleRight className="w-4 h-4" /> Enabled</>
                : <><ToggleLeft className="w-4 h-4 text-slate-400" /> <span className="text-slate-300">Disabled</span></>
              }
            </button>
          </div>
        </div>

        {group.publicReportingEnabled && (
          <>
            {/* Direct link + QR */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Globe className="w-4 h-4 text-emerald-400" />
                <h3 className="font-semibold text-white text-sm">Your Public Report Link</h3>
              </div>
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5">
                    <span className="text-sm text-slate-300 truncate flex-1">{publicUrl}</span>
                    <button
                      onClick={() => { navigator.clipboard.writeText(publicUrl); toast({ title: "Link copied!" }); }}
                      className="text-slate-400 hover:text-white transition-colors shrink-0"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Share this link directly — no account needed to submit a report.</p>
                  <a href={publicUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 mt-2">
                    <ExternalLink className="w-3 h-3" /> Preview the form
                  </a>
                </div>
                <div className="shrink-0">
                  <div className="bg-white p-3 rounded-xl">
                    <QRCodeSVG value={publicUrl} size={100} level="H" />
                  </div>
                  <p className="text-xs text-slate-500 text-center mt-1.5">Scan to report</p>
                </div>
              </div>
            </div>

            {/* Live inline preview */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Globe className="w-4 h-4 text-emerald-400" />
                <h3 className="font-semibold text-white text-sm">Live Preview</h3>
                <span className="text-xs text-slate-500 ml-1">— how the form looks to the public</span>
              </div>
              <div className="rounded-xl overflow-hidden border border-slate-700 bg-slate-950">
                <iframe
                  src={publicUrl}
                  title="Public Report Form Preview"
                  className="w-full"
                  style={{ height: "480px", border: "none" }}
                  loading="lazy"
                />
              </div>
              <p className="text-xs text-slate-500 mt-2">This is exactly what visitors see when they follow your public reporting link.</p>
            </div>

            {/* Embed code */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-semibold text-white text-sm">Embed Code</h3>
                </div>
                <button
                  onClick={() => { navigator.clipboard.writeText(embedCode); toast({ title: "Embed code copied!" }); }}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors px-3 py-1.5 bg-slate-800 rounded-lg"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy code
                </button>
              </div>
              <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-emerald-300 overflow-x-auto font-mono leading-relaxed">
                {embedCode}
              </pre>
              <p className="text-xs text-slate-500 mt-3">
                Paste this snippet into any page on your website. The form adjusts to fit the iframe width automatically.
              </p>
            </div>

            {/* Platform walkthroughs */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="font-semibold text-white mb-1">How to embed on your website</h3>
              <p className="text-xs text-slate-400 mb-5">Follow the guide for your website platform below.</p>

              <div className="space-y-6">
                {/* WordPress */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-bold text-white bg-slate-700 px-2.5 py-1 rounded-lg">WordPress</span>
                  </div>
                  <ol className="space-y-2">
                    {[
                      'In your WordPress dashboard, go to Pages and open or create the page where you want the form.',
                      'Click the + icon to add a new block, then search for and select "Custom HTML".',
                      "Paste the embed code (copied above) into the HTML block.",
                      'Click "Update" or "Publish" to save the page. The reporting form will now appear on your site.',
                    ].map((step, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
                        <span className="text-emerald-500 font-bold shrink-0">{i + 1}.</span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="border-t border-slate-800" />

                {/* Squarespace */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-bold text-white bg-slate-700 px-2.5 py-1 rounded-lg">Squarespace</span>
                  </div>
                  <ol className="space-y-2">
                    {[
                      "Open the page editor and click where you want to add the form.",
                      'Click the + icon to add a block, then choose "Embed" from the block list.',
                      'In the embed editor, click "Insert Code" and paste the embed code.',
                      'Click Apply, then save the page.',
                    ].map((step, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
                        <span className="text-emerald-500 font-bold shrink-0">{i + 1}.</span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="border-t border-slate-800" />

                {/* Plain HTML */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-bold text-white bg-slate-700 px-2.5 py-1 rounded-lg">Plain HTML site</span>
                  </div>
                  <ol className="space-y-2">
                    {[
                      "Open your HTML file in a text editor.",
                      "Find the place in the page body where you want the form to appear.",
                      "Paste the embed code directly into the HTML at that location.",
                      "Save the file and upload it to your web server.",
                    ].map((step, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
                        <span className="text-emerald-500 font-bold shrink-0">{i + 1}.</span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="bg-slate-800/50 rounded-xl p-4 mt-2">
                  <p className="text-xs text-slate-400">
                    <strong className="text-slate-300">Tip:</strong> The form automatically inherits the width of the container it's placed in. A minimum height of 600px is recommended for a good experience.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {!group.publicReportingEnabled && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center">
            <Globe className="w-10 h-10 text-slate-700 mx-auto mb-3" />
            <p className="text-sm text-slate-400">Enable public reporting above to access your embed code and QR code.</p>
          </div>
        )}
      </div>
    </GroupSettingsLayout>
  );
}
