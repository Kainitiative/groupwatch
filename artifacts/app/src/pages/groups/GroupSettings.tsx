import { useState, useCallback } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { useGetGroup, useUpdateGroup, useGetSetupProgress, useListMembers, useUpdateMember, useListIncidentTypes, useCreateIncidentType, useGetBillingStatus, useCreateCheckoutSession, useGetJoinLink, getGetJoinLinkQueryKey, UpdateMemberRequestRole } from "@workspace/api-client-react";
import { useGetMe } from "@workspace/api-client-react";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import SidebarLayout from "@/components/layout/SidebarLayout";
import { Settings, Users, List, CreditCard, Share2, CheckCircle2, Circle, Copy, ExternalLink, ChevronDown, ChevronUp, Shield, Bell, Eye, Wrench, Download, PhoneCall, Trash2, Pencil, X, Check, Globe, Code2, ToggleLeft, ToggleRight, Key, Plus, AlertCircle } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useToast } from "@/hooks/use-toast";

type Tab = "profile" | "members" | "incident-types" | "escalation" | "billing" | "widget" | "api-keys";

function SetupChecklist({ groupSlug }: { groupSlug: string }) {
  const { data: progress } = useGetSetupProgress(groupSlug);
  if (!progress || progress.dismissed || progress.completedSteps === progress.totalSteps) return null;

  const steps = [
    { key: "profileComplete", label: "Complete group profile", href: `/g/${groupSlug}/settings?tab=profile` },
    { key: "incidentTypesAdded", label: "Add incident types", href: `/g/${groupSlug}/settings?tab=incident-types` },
    { key: "responderAssigned", label: "Assign a responder", href: `/g/${groupSlug}/settings?tab=members` },
    { key: "mapBoundariesDrawn", label: "Draw map boundaries", href: `/g/${groupSlug}/map` },
    { key: "escalationContactsAdded", label: "Add escalation contacts", href: `/g/${groupSlug}/settings?tab=escalation` },
    { key: "shareLinkViewed", label: "Share your join link", href: `/g/${groupSlug}/settings?tab=profile` },
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

  const handleQuickResponder = async () => {
    try {
      await updateMember.mutateAsync({
        groupSlug,
        userId: member.userId,
        data: {
          role: "responder",
          permissions: { canReceiveNotifications: true, canViewDashboard: true, canActionReports: true, canFileReports: true },
        },
      });
      queryClient.invalidateQueries({ queryKey: [`/api/groups/${groupSlug}/members`] });
      toast({ title: "Done", description: "You are now a responder with full permissions" });
    } catch {
      toast({ title: "Error", description: "Failed to update role", variant: "destructive" });
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
              <p className="text-xs text-slate-400 mb-2 font-medium">Notification & Access Permissions</p>
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

type ApiKey = {
  id: string;
  label: string | null;
  keyPrefix: string;
  isActive: boolean;
  lastUsedAt: string | null;
  createdAt: string;
};

function ApiKeysTab({ slug }: { slug: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showCreate, setShowCreate] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);

  const { data: keys = [], isLoading } = useQuery<ApiKey[]>({
    queryKey: ["api-keys", slug],
    queryFn: async () => {
      const res = await fetch(`/api/groups/${slug}/api-keys`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load API keys");
      return res.json();
    },
  });

  const handleCreate = async () => {
    if (!newKeyName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch(`/api/groups/${slug}/api-keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: newKeyName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create key");
      setCreatedKey(data.key);
      setNewKeyName("");
      setShowCreate(false);
      queryClient.invalidateQueries({ queryKey: ["api-keys", slug] });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (keyId: string) => {
    setRevoking(keyId);
    try {
      const res = await fetch(`/api/groups/${slug}/api-keys/${keyId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to revoke key");
      queryClient.invalidateQueries({ queryKey: ["api-keys", slug] });
      toast({ title: "API key revoked" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setRevoking(null);
    }
  };

  const baseUrl = typeof window !== "undefined" ? `${window.location.origin}/api/v1` : "https://groupwatchplatform.com/api/v1";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 className="font-semibold text-white mb-1">API Keys</h3>
            <p className="text-sm text-slate-400">
              Use API keys to access GroupWatch data programmatically from your own systems or integrations.
              Keys are scoped to this group only.
            </p>
          </div>
          {!showCreate && (
            <button
              onClick={() => setShowCreate(true)}
              className="shrink-0 flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" /> New Key
            </button>
          )}
        </div>

        {showCreate && (
          <div className="bg-slate-800 rounded-xl p-4 mb-4 flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-xs text-slate-400 mb-1.5">Key name</label>
              <input
                type="text"
                value={newKeyName}
                onChange={e => setNewKeyName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleCreate()}
                placeholder="e.g. My Integration, Zapier, Webhook"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setShowCreate(false); setNewKeyName(""); }}
                className="px-3 py-2 text-slate-400 hover:text-white text-sm transition-colors"
              >Cancel</button>
              <button
                onClick={handleCreate}
                disabled={creating || !newKeyName.trim()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >{creating ? "Creating…" : "Create"}</button>
            </div>
          </div>
        )}

        {isLoading ? (
          <p className="text-sm text-slate-500 py-2">Loading keys…</p>
        ) : keys.length === 0 ? (
          <div className="text-center py-8">
            <Key className="w-8 h-8 text-slate-700 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No API keys yet. Create one to get started.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {keys.map(k => (
              <div key={k.id} className="flex items-center justify-between gap-3 bg-slate-800 rounded-xl px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{k.label || "Unnamed key"}</p>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{k.keyPrefix}••••••••••••••••</p>
                </div>
                <div className="text-right text-xs text-slate-500 shrink-0">
                  <p>Created {new Date(k.createdAt).toLocaleDateString("en-IE")}</p>
                  <p>{k.lastUsedAt ? `Last used ${new Date(k.lastUsedAt).toLocaleDateString("en-IE")}` : "Never used"}</p>
                </div>
                <button
                  onClick={() => handleRevoke(k.id)}
                  disabled={revoking === k.id}
                  className="shrink-0 px-3 py-1.5 text-xs text-red-400 hover:text-white hover:bg-red-500/20 border border-red-500/30 rounded-lg transition-colors disabled:opacity-50"
                >
                  {revoking === k.id ? "…" : "Revoke"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Created key one-time display */}
      {createdKey && (
        <div className="bg-emerald-950/40 border border-emerald-700/50 rounded-2xl p-6">
          <div className="flex items-start gap-3 mb-4">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-emerald-300 mb-0.5">API key created — copy it now</h4>
              <p className="text-sm text-emerald-400/80">This key will only be shown once. Store it somewhere safe.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-slate-950 rounded-xl px-4 py-3 font-mono text-sm">
            <span className="text-emerald-300 flex-1 break-all">{createdKey}</span>
            <button
              onClick={() => { navigator.clipboard.writeText(createdKey); toast({ title: "Copied!" }); }}
              className="text-slate-400 hover:text-white transition-colors shrink-0 ml-2"
            ><Copy className="w-4 h-4" /></button>
          </div>
          <button
            onClick={() => setCreatedKey(null)}
            className="mt-3 text-xs text-slate-500 hover:text-slate-400 transition-colors"
          >I've copied it, dismiss</button>
        </div>
      )}

      {/* REST API reference */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Code2 className="w-4 h-4 text-emerald-400" />
          <h3 className="font-semibold text-white text-sm">REST API Quick Reference</h3>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Authenticate requests with the header: <span className="font-mono text-slate-200">Authorization: Bearer {"<your_key>"}</span>
        </p>
        <div className="space-y-2 font-mono text-xs">
          {[
            { method: "GET",  path: `/v1/groups/${slug}/incident-types`, note: "List incident types" },
            { method: "GET",  path: `/v1/groups/${slug}/incidents`,      note: "List incidents" },
            { method: "POST", path: `/v1/groups/${slug}/incidents`,      note: "Create an incident" },
          ].map(({ method, path, note }) => (
            <div key={path} className="flex items-center gap-3 bg-slate-800 rounded-lg px-3 py-2.5">
              <span className={`shrink-0 w-10 text-center text-xs font-bold ${method === "GET" ? "text-blue-400" : "text-emerald-400"}`}>{method}</span>
              <span className="text-slate-300 flex-1 truncate">/api{path}</span>
              <span className="text-slate-500 shrink-0">{note}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 bg-slate-800/50 rounded-xl p-3">
          <p className="text-xs text-slate-400">
            <strong className="text-slate-300">Base URL:</strong>{" "}
            <span className="font-mono text-slate-300">{baseUrl}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function GroupSettings() {
  const [, params] = useRoute("/g/:slug/settings");
  const slug = params?.slug ?? "";
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    const search = new URLSearchParams(window.location.search);
    const t = search.get("tab") as Tab;
    return ["profile", "members", "incident-types", "escalation", "billing", "widget", "api-keys"].includes(t) ? t : "profile";
  });
  const { toast } = useToast();

  const { data: group, isLoading } = useGetGroup(slug);
  const { data: user, isLoading: userLoading, isError: userError } = useGetMe();
  const updateGroup = useUpdateGroup();

  const [profileForm, setProfileForm] = useState({
    name: group?.name ?? "",
    description: group?.description ?? "",
    website: group?.website ?? "",
    contactEmail: group?.contactEmail ?? "",
    brandColour: group?.brandColour ?? "#10b981",
  });

  const { data: members = [] } = useListMembers(slug);
  const { data: types = [] } = useListIncidentTypes(slug);
  const queryClient = useQueryClient();
  const createIncidentType = useCreateIncidentType();
  const { data: billing } = useGetBillingStatus(slug);
  const checkout = useCreateCheckoutSession();
  const { data: joinLink } = useGetJoinLink(slug, { query: { queryKey: getGetJoinLinkQueryKey(slug), enabled: activeTab === "profile" } });

  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeColour, setNewTypeColour] = useState("#10b981");

  // Escalation contacts
  const { data: escalationContacts = [], refetch: refetchContacts } = useQuery<any[]>({
    queryKey: [`/api/groups/${slug}/escalation-contacts`],
    queryFn: async () => {
      const res = await fetch(`/api/groups/${slug}/escalation-contacts`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: activeTab === "escalation",
  });

  const emptyContact = { name: "", organisation: "", role: "", phone: "", email: "", notes: "" };
  const [newContact, setNewContact] = useState(emptyContact);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [editContact, setEditContact] = useState(emptyContact);

  const createContact = useMutation({
    mutationFn: async (data: typeof emptyContact) => {
      const res = await fetch(`/api/groups/${slug}/escalation-contacts`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create contact");
      return res.json();
    },
    onSuccess: () => { refetchContacts(); setNewContact(emptyContact); toast({ title: "Contact added" }); },
    onError: () => toast({ title: "Error", description: "Failed to add contact", variant: "destructive" }),
  });

  const updateContact = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof emptyContact> }) => {
      const res = await fetch(`/api/groups/${slug}/escalation-contacts/${id}`, {
        method: "PATCH", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update contact");
      return res.json();
    },
    onSuccess: () => { refetchContacts(); setEditingContactId(null); toast({ title: "Contact updated" }); },
    onError: () => toast({ title: "Error", description: "Failed to update contact", variant: "destructive" }),
  });

  const deleteContact = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/groups/${slug}/escalation-contacts/${id}`, {
        method: "DELETE", credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete contact");
    },
    onSuccess: () => { refetchContacts(); toast({ title: "Contact removed" }); },
    onError: () => toast({ title: "Error", description: "Failed to remove contact", variant: "destructive" }),
  });

  const [, navigate] = useLocation();

  if (isLoading) {
    return <SidebarLayout><div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div></SidebarLayout>;
  }

  if (!userLoading && (userError || !user)) {
    navigate(`/login?next=/g/${slug}/settings`);
    return null;
  }

  if (!group) {
    return <SidebarLayout><div className="text-slate-400 p-8">Group not found.</div></SidebarLayout>;
  }

  const handleSaveProfile = async () => {
    try {
      await updateGroup.mutateAsync({ groupSlug: slug, data: profileForm });
      toast({ title: "Saved", description: "Group profile updated" });
    } catch {
      toast({ title: "Error", description: "Failed to save changes", variant: "destructive" });
    }
  };

  const handleAddType = async () => {
    if (!newTypeName.trim()) return;
    try {
      await createIncidentType.mutateAsync({
        groupSlug: slug,
        data: { name: newTypeName.trim(), colour: newTypeColour },
      });
      setNewTypeName("");
      queryClient.invalidateQueries({ queryKey: [`/api/groups/${slug}/incident-types`] });
      queryClient.invalidateQueries({ queryKey: [`/api/groups/${slug}/setup-progress`] });
      toast({ title: "Added", description: `Incident type "${newTypeName}" added` });
    } catch (err: any) {
      console.error("[handleAddType] error:", err);
      const status = err?.status ?? err?.response?.status;
      const msg = err?.data?.error ?? err?.message ?? "Unknown error";
      toast({ title: `Error${status ? ` (${status})` : ""}`, description: msg || "Failed to add incident type", variant: "destructive" });
    }
  };

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "profile", label: "Profile & Branding", icon: Settings },
    { id: "members", label: "Members", icon: Users },
    { id: "incident-types", label: "Incident Types", icon: List },
    { id: "escalation", label: "Escalation", icon: PhoneCall },
    { id: "widget", label: "Public Widget", icon: Globe },
    { id: "api-keys", label: "API Keys", icon: Key },
    { id: "billing", label: "Billing", icon: CreditCard },
  ];

  return (
    <SidebarLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">{group.name} Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your group's configuration</p>
        </div>

        <SetupChecklist groupSlug={slug} />

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-900 rounded-xl p-1 mb-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "bg-emerald-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="font-semibold text-white mb-4">Group Profile</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Group Name</label>
                  <input
                    type="text"
                    value={profileForm.name || group.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={profileForm.description || group.description || ""}
                    onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Website</label>
                    <input
                      type="url"
                      value={profileForm.website || group.website || ""}
                      onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                      placeholder="https://..."
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Contact Email</label>
                    <input
                      type="email"
                      value={profileForm.contactEmail || group.contactEmail || ""}
                      onChange={(e) => setProfileForm({ ...profileForm, contactEmail: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Brand Colour</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={profileForm.brandColour || group.brandColour || "#10b981"}
                      onChange={(e) => setProfileForm({ ...profileForm, brandColour: e.target.value })}
                      className="w-12 h-10 rounded-lg cursor-pointer bg-slate-800 border border-slate-700"
                    />
                    <span className="text-sm text-slate-400 font-mono">{profileForm.brandColour || group.brandColour || "#10b981"}</span>
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

            {/* Join Link */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Share2 className="w-4 h-4 text-emerald-400" />
                <h3 className="font-semibold text-white">Share & Join Link</h3>
              </div>
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
        )}

        {/* Members Tab */}
        {activeTab === "members" && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-slate-800">
                <h3 className="font-semibold text-white">Members ({members.length})</h3>
                <p className="text-xs text-slate-400 mt-1">Click the arrow on any member to change their role and permissions</p>
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
                  <div className="px-5 py-8 text-center text-slate-500 text-sm">No members yet. Share your join link to invite people.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Incident Types Tab */}
        {activeTab === "incident-types" && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-slate-800">
                <h3 className="font-semibold text-white">Incident Types</h3>
                <p className="text-xs text-slate-400 mt-1">Define what types of incidents your members can report</p>
              </div>
              <div className="divide-y divide-slate-800">
                {types.map((type) => (
                  <div key={type.id} className="px-5 py-3.5 flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: type.colour || "#10b981" }} />
                    <span className="text-sm text-white">{type.name}</span>
                    {type.description && <span className="text-xs text-slate-500">— {type.description}</span>}
                  </div>
                ))}
                {types.length === 0 && (
                  <div className="px-5 py-6 text-center text-slate-500 text-sm">No incident types yet. Add one below.</div>
                )}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <h4 className="text-sm font-semibold text-white mb-3">Add Incident Type</h4>
              <div className="flex gap-3">
                <input
                  type="color"
                  value={newTypeColour}
                  onChange={(e) => setNewTypeColour(e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer bg-slate-800 border border-slate-700"
                />
                <input
                  type="text"
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  placeholder="e.g. Poaching, Fly-tipping, Trespass..."
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  onKeyDown={(e) => e.key === "Enter" && handleAddType()}
                />
                <button
                  onClick={handleAddType}
                  disabled={createIncidentType.isPending || !newTypeName.trim()}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Escalation Tab */}
        {activeTab === "escalation" && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-slate-800">
                <h3 className="font-semibold text-white">Escalation Contacts</h3>
                <p className="text-xs text-slate-400 mt-1">People to notify or contact when an incident is escalated. Members can select from this list when escalating a report.</p>
              </div>

              {escalationContacts.length === 0 ? (
                <div className="px-5 py-10 text-center text-slate-500 text-sm">
                  <PhoneCall className="w-8 h-8 mx-auto mb-3 opacity-30" />
                  <p>No escalation contacts yet.</p>
                  <p className="text-xs mt-1">Add contacts below — e.g. wardens, rangers, emergency services, council officers.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-800">
                  {escalationContacts.map((c: any) => (
                    <div key={c.id} className="px-5 py-4">
                      {editingContactId === c.id ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <input value={editContact.name} onChange={e => setEditContact(p => ({ ...p, name: e.target.value }))} placeholder="Name *" className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                            <input value={editContact.organisation} onChange={e => setEditContact(p => ({ ...p, organisation: e.target.value }))} placeholder="Organisation" className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                            <input value={editContact.role} onChange={e => setEditContact(p => ({ ...p, role: e.target.value }))} placeholder="Role / Title" className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                            <input value={editContact.phone} onChange={e => setEditContact(p => ({ ...p, phone: e.target.value }))} placeholder="Phone" className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                            <input value={editContact.email} onChange={e => setEditContact(p => ({ ...p, email: e.target.value }))} placeholder="Email" className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                            <input value={editContact.notes} onChange={e => setEditContact(p => ({ ...p, notes: e.target.value }))} placeholder="Notes" className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => updateContact.mutate({ id: c.id, data: editContact })} disabled={updateContact.isPending || !editContact.name.trim()} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50">
                              <Check className="w-3.5 h-3.5" /> Save
                            </button>
                            <button onClick={() => setEditingContactId(null)} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-medium transition-colors">
                              <X className="w-3.5 h-3.5" /> Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <PhoneCall className="w-4 h-4 text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-white text-sm">{c.name}</span>
                              {c.role && <span className="text-xs text-slate-400">{c.role}</span>}
                              {c.organisation && <span className="text-xs text-slate-500">· {c.organisation}</span>}
                            </div>
                            <div className="flex items-center gap-4 mt-1 flex-wrap">
                              {c.phone && <a href={`tel:${c.phone}`} className="text-xs text-emerald-400 hover:text-emerald-300">{c.phone}</a>}
                              {c.email && <a href={`mailto:${c.email}`} className="text-xs text-slate-400 hover:text-white">{c.email}</a>}
                              {c.notes && <span className="text-xs text-slate-500 italic">{c.notes}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button onClick={() => { setEditingContactId(c.id); setEditContact({ name: c.name ?? "", organisation: c.organisation ?? "", role: c.role ?? "", phone: c.phone ?? "", email: c.email ?? "", notes: c.notes ?? "" }); }} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => { if (confirm(`Remove ${c.name}?`)) deleteContact.mutate(c.id); }} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add new contact form */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <h4 className="text-sm font-semibold text-white mb-3">Add Contact</h4>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input value={newContact.name} onChange={e => setNewContact(p => ({ ...p, name: e.target.value }))} placeholder="Name *" className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  <input value={newContact.organisation} onChange={e => setNewContact(p => ({ ...p, organisation: e.target.value }))} placeholder="Organisation" className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  <input value={newContact.role} onChange={e => setNewContact(p => ({ ...p, role: e.target.value }))} placeholder="Role / Title" className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  <input value={newContact.phone} onChange={e => setNewContact(p => ({ ...p, phone: e.target.value }))} placeholder="Phone" className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  <input value={newContact.email} onChange={e => setNewContact(p => ({ ...p, email: e.target.value }))} placeholder="Email" className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  <input value={newContact.notes} onChange={e => setNewContact(p => ({ ...p, notes: e.target.value }))} placeholder="Notes" className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <button
                  onClick={() => createContact.mutate(newContact)}
                  disabled={createContact.isPending || !newContact.name.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {createContact.isPending ? "Adding..." : "Add Contact"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Widget Tab */}
        {activeTab === "widget" && (
          <div className="space-y-6">
            {/* Enable toggle */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-white mb-1">Public Reporting Widget</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Allow anyone to submit a report to your group without creating an account. 
                    Ideal for embedding on your website or sharing a QR code with the public.
                  </p>
                </div>
                <button
                  onClick={() => {
                    updateGroup.mutate(
                      { groupSlug: slug, data: { publicReportingEnabled: !group.publicReportingEnabled } },
                      { onSuccess: () => toast({ title: group.publicReportingEnabled ? "Public reporting disabled" : "Public reporting enabled" }) }
                    );
                  }}
                  className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-700 text-sm font-medium transition-colors"
                  style={group.publicReportingEnabled ? { background: "#10b981", borderColor: "#10b981", color: "white" } : {}}
                >
                  {group.publicReportingEnabled
                    ? <><ToggleRight className="w-4 h-4" /> Enabled</>
                    : <><ToggleLeft className="w-4 h-4 text-slate-400" /> <span className="text-slate-300">Disabled</span></>
                  }
                </button>
              </div>

              {!group.publicReportingEnabled && (
                <div className="mt-4 bg-slate-800/50 rounded-xl p-4">
                  <p className="text-xs text-slate-500">Enable public reporting above to get your embed code and share link.</p>
                </div>
              )}
            </div>

            {group.publicReportingEnabled && (() => {
              const publicUrl = `${window.location.origin}/r/${slug}`;
              const embedCode = `<iframe\n  src="${publicUrl}"\n  width="100%"\n  height="600"\n  frameborder="0"\n  style="border-radius:16px;border:1px solid #e5e7eb;"\n  title="Report an Incident"\n></iframe>`;
              return (
                <>
                  {/* Direct link + QR */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Globe className="w-4 h-4 text-emerald-400" />
                      <h3 className="font-semibold text-white text-sm">Public Report Link</h3>
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
                        <p className="text-xs text-slate-500 mt-2">Share this link directly with members of the public — no account required.</p>
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

                  {/* Embed code */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Code2 className="w-4 h-4 text-emerald-400" />
                        <h3 className="font-semibold text-white text-sm">Embed on Your Website</h3>
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
                </>
              );
            })()}
          </div>
        )}

        {/* API Keys Tab */}
        {activeTab === "api-keys" && (
          <ApiKeysTab slug={slug} />
        )}

        {/* Billing Tab */}
        {activeTab === "billing" && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="font-semibold text-white mb-4">Subscription Status</h3>
              <div className="flex items-center gap-3 mb-6">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  billing?.status === "active" ? "bg-emerald-500/20 text-emerald-400"
                  : billing?.status === "trial" ? "bg-blue-500/20 text-blue-400"
                  : billing?.status === "past_due" ? "bg-yellow-500/20 text-yellow-400"
                  : "bg-slate-700 text-slate-400"
                }`}>
                  {billing?.status === "trial" ? "Free Trial"
                   : billing?.status === "active" ? "Active"
                   : billing?.status === "past_due" ? "Payment Due"
                   : "Cancelled"}
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

              {(billing?.status === "trial" || billing?.status === "cancelled") && (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => checkout.mutate({ groupSlug: slug, data: { plan: "monthly" } }, {
                      onSuccess: (data) => data.url && window.location.replace(data.url),
                    })}
                    className="p-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-left transition-colors"
                  >
                    <p className="font-bold text-white">€20 / month</p>
                    <p className="text-xs text-slate-400 mt-1">Billed monthly</p>
                  </button>
                  <button
                    onClick={() => checkout.mutate({ groupSlug: slug, data: { plan: "annual" } }, {
                      onSuccess: (data) => data.url && window.location.replace(data.url),
                    })}
                    className="p-4 bg-emerald-950/40 hover:bg-emerald-950/60 border border-emerald-700/50 rounded-xl text-left transition-colors relative"
                  >
                    <span className="absolute top-2 right-2 text-xs bg-emerald-600 text-white px-2 py-0.5 rounded-full">Best value</span>
                    <p className="font-bold text-white">€200 / year</p>
                    <p className="text-xs text-emerald-400 mt-1">Saves 2 months</p>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
