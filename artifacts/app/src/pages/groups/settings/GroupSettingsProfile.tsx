import { useState, useEffect } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { useGetGroup, useUpdateGroup, useGetSetupProgress, useGetJoinLink, getGetJoinLinkQueryKey } from "@workspace/api-client-react";
import { useGetMe } from "@workspace/api-client-react";
import { Share2, Copy, ExternalLink, Download, CheckCircle2, Circle } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useToast } from "@/hooks/use-toast";
import GroupSettingsLayout from "@/components/layout/GroupSettingsLayout";

function SetupChecklist({ groupSlug }: { groupSlug: string }) {
  const { data: progress } = useGetSetupProgress(groupSlug);
  if (!progress || progress.dismissed || progress.completedSteps === progress.totalSteps) return null;

  const steps = [
    { key: "profileComplete", label: "Complete group profile", href: `/g/${groupSlug}/settings/profile` },
    { key: "incidentTypesAdded", label: "Add incident types", href: `/g/${groupSlug}/settings/incident-types` },
    { key: "responderAssigned", label: "Assign a responder", href: `/g/${groupSlug}/settings/members` },
    { key: "mapBoundariesDrawn", label: "Draw map boundaries", href: `/g/${groupSlug}/map` },
    { key: "escalationContactsAdded", label: "Add escalation contacts", href: `/g/${groupSlug}/settings/escalation` },
    { key: "shareLinkViewed", label: "Share your join link", href: `/g/${groupSlug}/settings/profile` },
  ];

  return (
    <div className="bg-emerald-950/40 border border-emerald-700/50 rounded-2xl p-5 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-white text-sm">Setup Checklist</h3>
        <span className="text-xs text-emerald-400">{progress.completedSteps}/{progress.totalSteps} complete</span>
      </div>
      <div className="w-full bg-slate-800 rounded-full h-1.5 mb-4">
        <div
          className="bg-emerald-500 h-1.5 rounded-full transition-all"
          style={{ width: `${(progress.completedSteps / progress.totalSteps) * 100}%` }}
        />
      </div>
      <div className="space-y-2">
        {steps.map((step) => {
          const done = (progress as unknown as Record<string, boolean>)[step.key];
          return (
            <Link key={step.key} href={done ? "#" : step.href}>
              <div className={`flex items-center gap-2 rounded-lg px-1 py-0.5 ${!done ? "hover:bg-emerald-800/30 cursor-pointer transition-colors" : ""}`}>
                {done
                  ? <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  : <Circle className="w-4 h-4 text-slate-500 flex-shrink-0" />
                }
                <span className={`text-sm ${done ? "text-slate-400 line-through" : "text-slate-200 hover:text-white"}`}>{step.label}</span>
                {!done && <span className="ml-auto text-xs text-emerald-500 opacity-70">→</span>}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function GroupSettingsProfile() {
  const [, params] = useRoute("/g/:slug/settings/profile");
  const slug = params?.slug ?? "";
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: group, isLoading } = useGetGroup(slug);
  const { data: user, isLoading: userLoading, isError: userError } = useGetMe();
  const updateGroup = useUpdateGroup();

  const [profileForm, setProfileForm] = useState({
    name: "",
    description: "",
    website: "",
    contactEmail: "",
    brandColour: "#10b981",
  });

  useEffect(() => {
    if (group) {
      setProfileForm({
        name: group.name ?? "",
        description: group.description ?? "",
        website: group.website ?? "",
        contactEmail: group.contactEmail ?? "",
        brandColour: group.brandColour ?? "#10b981",
      });
    }
  }, [group]);

  const { data: joinLink } = useGetJoinLink(slug, {
    query: { queryKey: getGetJoinLinkQueryKey(slug) },
  });

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
    navigate(`/login?next=/g/${slug}/settings/profile`);
    return null;
  }

  if (!group) {
    return (
      <GroupSettingsLayout groupSlug={slug}>
        <div className="text-slate-400 p-8">Group not found.</div>
      </GroupSettingsLayout>
    );
  }

  const handleSaveProfile = async () => {
    try {
      await updateGroup.mutateAsync({ groupSlug: slug, data: profileForm });
      toast({ title: "Saved", description: "Group profile updated" });
    } catch {
      toast({ title: "Error", description: "Failed to save changes", variant: "destructive" });
    }
  };

  return (
    <GroupSettingsLayout groupSlug={slug} groupName={group.name}>
      <SetupChecklist groupSlug={slug} />

      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white">Profile &amp; Branding</h2>
        <p className="text-sm text-slate-400 mt-1">
          Your group's public-facing name, description, contact details and brand colour. This information appears on your public reporting page and in emails sent to members.
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile form */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="font-semibold text-white mb-4">Group Details</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Group Name</label>
              <input
                type="text"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Description</label>
              <textarea
                rows={3}
                value={profileForm.description}
                onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Website</label>
                <input
                  type="url"
                  value={profileForm.website}
                  onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                  placeholder="https://..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Contact Email</label>
                <input
                  type="email"
                  value={profileForm.contactEmail}
                  onChange={(e) => setProfileForm({ ...profileForm, contactEmail: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Brand Colour</label>
              <p className="text-xs text-slate-500 mb-2">Used as the accent colour on your public reporting page.</p>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={profileForm.brandColour}
                  onChange={(e) => setProfileForm({ ...profileForm, brandColour: e.target.value })}
                  className="w-12 h-10 rounded-lg cursor-pointer bg-slate-800 border border-slate-700"
                />
                <span className="text-sm text-slate-400 font-mono">{profileForm.brandColour}</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleSaveProfile}
            disabled={updateGroup.isPending}
            className="mt-4 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
          >
            {updateGroup.isPending ? "Saving..." : "Save Profile"}
          </button>
        </div>

        {/* Join Link & QR */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-2">
            <Share2 className="w-4 h-4 text-emerald-400" />
            <h3 className="font-semibold text-white">Share &amp; Join Link</h3>
          </div>
          <p className="text-sm text-slate-400 mb-4">
            Share this link so people can request to join your group. Anyone with the link can apply — you still approve or decline each request.
          </p>
          {joinLink ? (
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-400 mb-1.5 font-medium">Join link</p>
                <div className="bg-slate-800 rounded-xl px-4 py-3 flex items-center gap-3">
                  <span className="text-sm text-slate-300 flex-1 truncate font-mono">{joinLink.url}</span>
                  <button
                    onClick={() => { navigator.clipboard.writeText(joinLink.url); toast({ title: "Copied!" }); }}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <a href={joinLink.url} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
                <p className="text-xs text-slate-500 mt-1.5">Share this with members so they can join your group.</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-2 font-medium">QR Code — print and display at your venue</p>
                <div className="flex items-start gap-4">
                  <div className="bg-white p-3 rounded-xl" id="group-qr-code">
                    <QRCodeSVG value={joinLink.url} size={120} level="H" />
                  </div>
                  <div className="flex flex-col gap-2 pt-1">
                    <button
                      onClick={() => {
                        const svg = document.querySelector("#group-qr-code svg") as SVGElement;
                        if (!svg) return;
                        const canvas = document.createElement("canvas");
                        canvas.width = 400; canvas.height = 400;
                        const ctx = canvas.getContext("2d")!;
                        ctx.fillStyle = "white";
                        ctx.fillRect(0, 0, 400, 400);
                        const img = new Image();
                        const svgData = new XMLSerializer().serializeToString(svg);
                        img.onload = () => {
                          ctx.drawImage(img, 20, 20, 360, 360);
                          const a = document.createElement("a");
                          a.download = `${slug}-join-qr.png`;
                          a.href = canvas.toDataURL("image/png");
                          a.click();
                        };
                        img.src = "data:image/svg+xml;base64," + btoa(svgData);
                      }}
                      className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-medium transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" /> Download PNG
                    </button>
                    <p className="text-xs text-slate-500">High-res PNG for printing</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400">Loading join link...</p>
          )}
        </div>
      </div>
    </GroupSettingsLayout>
  );
}
