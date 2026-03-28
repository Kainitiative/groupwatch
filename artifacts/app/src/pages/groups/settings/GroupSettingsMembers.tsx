import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useGetGroup, useListMembers, useUpdateMember, UpdateMemberRequestRole } from "@workspace/api-client-react";
import { useGetMe } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, Bell, Eye, Wrench, Shield, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import GroupSettingsLayout from "@/components/layout/GroupSettingsLayout";

type MemberData = {
  userId: string;
  name: string;
  email: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  role: string;
  roleTitle?: string | null;
  permissions: {
    canReceiveNotifications: boolean;
    canViewDashboard: boolean;
    canActionReports: boolean;
    canFileReports: boolean;
  };
};

function MemberRow({ member, groupSlug, currentUserId }: { member: MemberData; groupSlug: string; currentUserId?: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const updateMember = useUpdateMember();
  const [expanded, setExpanded] = useState(false);
  const [role, setRole] = useState(member.role as UpdateMemberRequestRole);
  const [roleTitle, setRoleTitle] = useState(member.roleTitle ?? "");
  const [perms, setPerms] = useState({ ...member.permissions });
  const isMe = member.userId === currentUserId;

  const handleSave = async () => {
    try {
      await updateMember.mutateAsync({
        groupSlug,
        userId: member.userId,
        data: { role, roleTitle: roleTitle || undefined, permissions: perms },
      });
      queryClient.invalidateQueries({ queryKey: [`/api/groups/${groupSlug}/members`] });
      toast({ title: "Saved", description: `${member.displayName || member.name} updated` });
      setExpanded(false);
    } catch {
      toast({ title: "Error", description: "Failed to update member", variant: "destructive" });
    }
  };

  const roleBadge = (r: string) => {
    if (r === "admin") return "bg-purple-500/20 text-purple-300";
    if (r === "responder") return "bg-blue-500/20 text-blue-300";
    return "bg-slate-700 text-slate-300";
  };

  return (
    <div className="border-b border-slate-800 last:border-0">
      <div className="px-5 py-4 flex items-center gap-4">
        <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-sm font-medium text-white flex-shrink-0">
          {(member.displayName || member.name).charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-white truncate">{member.displayName || member.name}</p>
            {isMe && <span className="text-xs bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-medium">You</span>}
          </div>
          <p className="text-xs text-slate-400 truncate">{member.email}</p>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${roleBadge(member.role)}`}>
          {member.roleTitle || member.role}
        </span>
        <button onClick={() => setExpanded(!expanded)} className="text-slate-500 hover:text-white transition-colors flex-shrink-0">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {expanded && (
        <div className="px-5 pb-5 space-y-4 bg-slate-950/40">
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block font-medium">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UpdateMemberRequestRole)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="member">Member</option>
                <option value="responder">Responder</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block font-medium">Role Title <span className="text-slate-600">(optional)</span></label>
              <input
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                placeholder="e.g. River Warden, Section Officer"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {role !== "member" && (
            <div>
              <p className="text-xs text-slate-400 mb-2 font-medium">Notification &amp; Access Permissions</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: "canReceiveNotifications", icon: Bell, label: "Receive push notifications" },
                  { key: "canViewDashboard", icon: Eye, label: "View reports dashboard" },
                  { key: "canActionReports", icon: Wrench, label: "Action & update reports" },
                  { key: "canFileReports", icon: Shield, label: "File reports" },
                ].map(({ key, icon: Icon, label }) => (
                  <label key={key} className="flex items-center gap-2.5 bg-slate-800 rounded-lg px-3 py-2.5 cursor-pointer hover:bg-slate-700 transition-colors">
                    <input
                      type="checkbox"
                      checked={perms[key as keyof typeof perms]}
                      onChange={(e) => setPerms(p => ({ ...p, [key]: e.target.checked }))}
                      className="w-4 h-4 rounded accent-emerald-500"
                    />
                    <Icon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="text-xs text-slate-300">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={updateMember.isPending}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {updateMember.isPending ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GroupSettingsMembers() {
  const [, params] = useRoute("/g/:slug/settings/members");
  const slug = params?.slug ?? "";
  const [, navigate] = useLocation();

  const { data: group, isLoading } = useGetGroup(slug);
  const { data: user, isLoading: userLoading, isError: userError } = useGetMe();
  const { data: members = [] } = useListMembers(slug);

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
    navigate(`/login?next=/g/${slug}/settings/members`);
    return null;
  }

  if (!group) {
    return (
      <GroupSettingsLayout groupSlug={slug}>
        <div className="text-slate-400 p-8">Group not found.</div>
      </GroupSettingsLayout>
    );
  }

  return (
    <GroupSettingsLayout groupSlug={slug} groupName={group.name}>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white">Members</h2>
        <p className="text-sm text-slate-400 mt-1">
          Manage who belongs to your group and what they can do. Assign roles — Member, Responder, or Admin — and fine-tune individual notification and access permissions. Expand any member row to edit their settings.
        </p>
      </div>

      <div className="space-y-4">
        {/* Role guide */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { role: "Member", colour: "bg-slate-700 text-slate-300", desc: "Can file reports. No dashboard access." },
            { role: "Responder", colour: "bg-blue-500/20 text-blue-300", desc: "Can view and action reports. Receives notifications." },
            { role: "Admin", colour: "bg-purple-500/20 text-purple-300", desc: "Full access. Can manage all settings." },
          ].map(({ role, colour, desc }) => (
            <div key={role} className="bg-slate-900 border border-slate-800 rounded-xl p-3">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colour}`}>{role}</span>
              <p className="text-xs text-slate-500 mt-2">{desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            <h3 className="font-semibold text-white">Members ({members.length})</h3>
            <p className="text-xs text-slate-400 ml-2">Click the arrow on any member to edit their role and permissions</p>
          </div>
          <div>
            {members.map((member) => (
              <MemberRow
                key={member.userId}
                member={member as MemberData}
                groupSlug={slug}
                currentUserId={user?.id}
              />
            ))}
            {members.length === 0 && (
              <div className="px-5 py-8 text-center text-slate-500 text-sm">
                No members yet. Share your join link to invite people.
              </div>
            )}
          </div>
        </div>
      </div>
    </GroupSettingsLayout>
  );
}
