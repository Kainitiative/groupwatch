import { useState } from "react";
import { format, differenceInDays, isPast, formatDistanceToNow } from "date-fns";
import {
  ShieldCheck, Activity, Users, CreditCard, CheckCircle2, Search,
  ExternalLink, ToggleLeft, ToggleRight, AlertTriangle, Settings,
  TrendingUp, Clock, Globe, X, AlertCircle, Trash2, RefreshCw,
} from "lucide-react";
import { useGetMe } from "@workspace/api-client-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import SidebarLayout from "@/components/layout/SidebarLayout";
import { useToast } from "@/hooks/use-toast";

type AdminTab = "overview" | "groups" | "users" | "settings" | "errors";

type AdminGroup = {
  id: string;
  name: string;
  slug: string;
  groupType: string;
  subscriptionStatus: string;
  trialEndsAt: string | null;
  memberCount: number;
  reportCount: number;
  createdAt: string;
  adminEmail: string;
};

type AdminUser = {
  id: string;
  name: string | null;
  email: string;
  isSuperAdmin: boolean;
  createdAt: string;
  groupCount: number;
};

type Revenue = {
  activeMonthly: number;
  activeAnnual: number;
  trialGroups: number;
  estimatedMrrEuros: number;
  totalGroups: number;
};

type PlatformSettings = {
  reportingEnabled: boolean;
  maintenanceMode: boolean;
  updatedAt: string;
};

type ErrorLog = {
  id: string;
  level: string;
  message: string;
  stack: string | null;
  path: string | null;
  method: string | null;
  statusCode: number | null;
  userId: string | null;
  meta: string | null;
  createdAt: string;
};

async function adminFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-emerald-500/15 text-emerald-600 border border-emerald-500/30",
    trial: "bg-amber-500/15 text-amber-600 border border-amber-500/30",
    past_due: "bg-red-500/15 text-red-600 border border-red-500/30",
    cancelled: "bg-slate-200 text-slate-500 border border-slate-300",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${map[status] ?? map.cancelled}`}>
      {status.replace("_", " ")}
    </span>
  );
}

function KpiCard({ icon: Icon, label, value, sub, colour }: {
  icon: any; label: string; value: string | number; sub?: string; colour: string;
}) {
  return (
    <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${colour}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
      <p className="text-3xl font-bold text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

export default function SuperAdmin() {
  const { data: user, isLoading: userLoading } = useGetMe();
  const qc = useQueryClient();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [groupSearch, setGroupSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");

  const { data: revenue, isLoading: revLoading } = useQuery<Revenue>({
    queryKey: ["admin-revenue"],
    queryFn: () => adminFetch("/admin/revenue"),
    enabled: !!user?.isSuperAdmin,
  });

  const { data: groupsData, isLoading: groupsLoading } = useQuery<{ groups: AdminGroup[]; total: number }>({
    queryKey: ["admin-groups"],
    queryFn: () => adminFetch("/admin/groups?limit=100&page=1"),
    enabled: !!user?.isSuperAdmin,
  });

  const { data: usersData, isLoading: usersLoading } = useQuery<{ users: AdminUser[]; total: number }>({
    queryKey: ["admin-users"],
    queryFn: () => adminFetch("/admin/users?limit=200"),
    enabled: !!user?.isSuperAdmin && activeTab === "users",
  });

  const { data: platformSettings, isLoading: settingsLoading } = useQuery<PlatformSettings>({
    queryKey: ["admin-platform-settings"],
    queryFn: () => adminFetch("/admin/platform-settings"),
    enabled: !!user?.isSuperAdmin && activeTab === "settings",
  });

  const [expandedError, setExpandedError] = useState<string | null>(null);

  const { data: errorsData, isLoading: errorsLoading, refetch: refetchErrors } = useQuery<{ errors: ErrorLog[]; total: number }>({
    queryKey: ["admin-errors"],
    queryFn: () => adminFetch("/admin/errors?limit=100"),
    enabled: !!user?.isSuperAdmin && activeTab === "errors",
    refetchInterval: activeTab === "errors" ? 15000 : false,
  });

  const deleteOneError = useMutation({
    mutationFn: (id: string) => adminFetch(`/admin/errors/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-errors"] }),
    onError: (e: any) => toast({ variant: "destructive", title: "Delete failed", description: e.message }),
  });

  const clearAllErrors = useMutation({
    mutationFn: () => adminFetch("/admin/errors", { method: "DELETE" }),
    onSuccess: () => {
      toast({ title: "All error logs cleared" });
      qc.invalidateQueries({ queryKey: ["admin-errors"] });
    },
    onError: (e: any) => toast({ variant: "destructive", title: "Failed", description: e.message }),
  });

  const activateMutation = useMutation({
    mutationFn: (slug: string) =>
      adminFetch(`/admin/groups/${slug}/activate`, { method: "POST" }),
    onSuccess: (_data, slug) => {
      const g = groupsData?.groups.find(g => g.slug === slug);
      toast({ title: `${g?.name ?? slug} set to active` });
      qc.invalidateQueries({ queryKey: ["admin-groups"] });
      qc.invalidateQueries({ queryKey: ["admin-revenue"] });
    },
    onError: (e: any) => toast({ variant: "destructive", title: "Failed", description: e.message }),
  });

  const toggleSuperAdmin = useMutation({
    mutationFn: ({ userId, isSuperAdmin }: { userId: string; isSuperAdmin: boolean }) =>
      adminFetch(`/admin/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify({ isSuperAdmin }),
      }),
    onSuccess: (_data, { isSuperAdmin, userId }) => {
      const u = usersData?.users.find(u => u.id === userId);
      toast({ title: `${u?.email ?? userId} ${isSuperAdmin ? "granted" : "removed"} super admin` });
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: any) => toast({ variant: "destructive", title: "Failed", description: e.message }),
  });

  const toggleSetting = useMutation({
    mutationFn: (data: Partial<PlatformSettings>) =>
      adminFetch("/admin/platform-settings", { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-platform-settings"] }),
    onError: (e: any) => toast({ variant: "destructive", title: "Failed", description: e.message }),
  });

  const filteredGroups = (groupsData?.groups ?? []).filter(g => {
    if (!groupSearch) return true;
    const q = groupSearch.toLowerCase();
    return g.name.toLowerCase().includes(q) || g.slug.includes(q) || g.adminEmail?.toLowerCase().includes(q);
  });

  const filteredUsers = (usersData?.users ?? []).filter(u => {
    if (!userSearch) return true;
    const q = userSearch.toLowerCase();
    return u.email.toLowerCase().includes(q) || (u.name ?? "").toLowerCase().includes(q);
  });

  const expiringGroups = (groupsData?.groups ?? []).filter(g => {
    if (g.subscriptionStatus !== "trial" || !g.trialEndsAt) return false;
    const days = differenceInDays(new Date(g.trialEndsAt), new Date());
    return days >= 0 && days <= 7;
  });

  const pastDueGroups = (groupsData?.groups ?? []).filter(g => g.subscriptionStatus === "past_due");

  if (userLoading) {
    return (
      <SidebarLayout>
        <div className="animate-pulse space-y-4 p-8">
          <div className="h-8 bg-muted rounded-xl w-48" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-muted rounded-2xl" />)}
          </div>
        </div>
      </SidebarLayout>
    );
  }

  if (!user?.isSuperAdmin) {
    return (
      <SidebarLayout>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ShieldCheck className="w-14 h-14 text-destructive/40 mb-4" />
          <h2 className="text-2xl font-bold text-foreground">Access Denied</h2>
          <p className="text-muted-foreground mt-2">You don't have super-admin privileges.</p>
        </div>
      </SidebarLayout>
    );
  }

  const tabs: { id: AdminTab; label: string; icon: any; badge?: number }[] = [
    { id: "overview", label: "Overview", icon: TrendingUp },
    { id: "groups", label: "Groups", icon: Globe },
    { id: "users", label: "Users", icon: Users },
    { id: "settings", label: "Platform", icon: Settings },
    { id: "errors", label: "Errors", icon: AlertCircle, badge: errorsData?.total && errorsData.total > 0 ? errorsData.total : undefined },
  ];

  return (
    <SidebarLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Super Admin</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Platform Dashboard</h1>
          <p className="text-muted-foreground text-sm">Full platform view — {user.email}</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-900 rounded-xl p-1 mb-8 w-fit">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === t.id ? "bg-emerald-600 text-white shadow-sm" : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
              {t.badge !== undefined && (
                <span className="ml-0.5 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                  {t.badge > 99 ? "99+" : t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {revLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-36 bg-muted rounded-2xl" />)}
              </div>
            ) : revenue && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KpiCard icon={CreditCard} label="Est. MRR" value={`€${revenue.estimatedMrrEuros}`} colour="bg-primary/10 text-primary" />
                <KpiCard icon={Activity} label="Paying groups" value={revenue.activeMonthly + revenue.activeAnnual}
                  sub={`${revenue.activeMonthly} monthly · ${revenue.activeAnnual} annual`} colour="bg-emerald-500/10 text-emerald-600" />
                <KpiCard icon={Clock} label="In trial" value={revenue.trialGroups} colour="bg-amber-500/10 text-amber-600" />
                <KpiCard icon={Globe} label="Total groups" value={revenue.totalGroups} colour="bg-blue-500/10 text-blue-600" />
              </div>
            )}

            {/* Attention items */}
            {(expiringGroups.length > 0 || pastDueGroups.length > 0) && (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Needs Attention</h2>
                {pastDueGroups.map(g => (
                  <div key={g.id} className="flex items-center justify-between bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-red-800">{g.name} — payment past due</p>
                        <p className="text-xs text-red-500">/{g.slug} · {g.adminEmail}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {expiringGroups.map(g => {
                  const days = differenceInDays(new Date(g.trialEndsAt!), new Date());
                  return (
                    <div key={g.id} className="flex items-center justify-between bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-amber-800">{g.name} — trial expires in {days} day{days !== 1 ? "s" : ""}</p>
                          <p className="text-xs text-amber-600">/{g.slug} · {g.adminEmail}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => activateMutation.mutate(g.slug)}
                        disabled={activateMutation.isPending}
                        className="text-xs font-medium text-amber-700 hover:text-amber-900 border border-amber-300 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition-colors disabled:opacity-50"
                      >
                        Force active
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Recent groups */}
            <div>
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">Most Recent Groups</h2>
              <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
                {groupsLoading ? (
                  <div className="animate-pulse p-6 space-y-3">
                    {[1, 2, 3].map(i => <div key={i} className="h-10 bg-muted rounded-lg" />)}
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 border-b border-border/50">
                      <tr>
                        {["Group", "Status", "Members", "Reports", "Joined"].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {(groupsData?.groups ?? []).slice(0, 5).map(g => (
                        <tr key={g.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-medium text-foreground">{g.name}</p>
                            <p className="text-xs text-muted-foreground">/{g.slug}</p>
                          </td>
                          <td className="px-4 py-3"><StatusBadge status={g.subscriptionStatus} /></td>
                          <td className="px-4 py-3 text-muted-foreground">{g.memberCount}</td>
                          <td className="px-4 py-3 text-muted-foreground">{g.reportCount}</td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">{format(new Date(g.createdAt), "dd MMM yyyy")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── GROUPS ── */}
        {activeTab === "groups" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by name, slug, or email…"
                  value={groupSearch}
                  onChange={e => setGroupSearch(e.target.value)}
                  className="w-full pl-9 pr-9 py-2.5 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                {groupSearch && (
                  <button onClick={() => setGroupSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{filteredGroups.length} group{filteredGroups.length !== 1 ? "s" : ""}</p>
            </div>

            <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 border-b border-border/50">
                    <tr>
                      {["Group", "Admin", "Status", "Trial", "Members", "Reports", "Actions"].map((h, i) => (
                        <th key={h} className={`px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider ${i >= 4 ? "text-right" : "text-left"}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {groupsLoading ? (
                      <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">Loading…</td></tr>
                    ) : filteredGroups.length === 0 ? (
                      <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">No groups found</td></tr>
                    ) : filteredGroups.map(g => {
                      const daysLeft = g.trialEndsAt ? differenceInDays(new Date(g.trialEndsAt), new Date()) : null;
                      const isUrgent = daysLeft !== null && daysLeft <= 3 && daysLeft >= 0;
                      const isExpired = g.trialEndsAt && isPast(new Date(g.trialEndsAt)) && g.subscriptionStatus === "trial";
                      return (
                        <tr key={g.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-medium text-foreground">{g.name}</p>
                            <p className="text-xs text-muted-foreground">/{g.slug}</p>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground max-w-[140px] truncate">{g.adminEmail || "—"}</td>
                          <td className="px-4 py-3"><StatusBadge status={g.subscriptionStatus} /></td>
                          <td className="px-4 py-3 text-xs">
                            {g.trialEndsAt ? (
                              <span className={isExpired ? "text-red-500 font-medium" : isUrgent ? "text-amber-600 font-medium" : "text-muted-foreground"}>
                                {isExpired ? "Expired" : daysLeft === 0 ? "Today" : `${daysLeft}d`}
                              </span>
                            ) : "—"}
                          </td>
                          <td className="px-4 py-3 text-right text-muted-foreground">{g.memberCount}</td>
                          <td className="px-4 py-3 text-right text-muted-foreground">{g.reportCount}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <a
                                href={`/g/${g.slug}/settings`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors"
                              >
                                <ExternalLink className="w-3 h-3" /> Settings
                              </a>
                              {g.subscriptionStatus !== "active" && (
                                <button
                                  onClick={() => activateMutation.mutate(g.slug)}
                                  disabled={activateMutation.isPending}
                                  className="text-xs font-medium text-emerald-700 px-2.5 py-1.5 rounded-lg border border-emerald-300 hover:bg-emerald-50 transition-colors disabled:opacity-50"
                                >
                                  <CheckCircle2 className="w-3 h-3 inline mr-1" />Activate
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── USERS ── */}
        {activeTab === "users" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by name or email…"
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  className="w-full pl-9 pr-9 py-2.5 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                {userSearch && (
                  <button onClick={() => setUserSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{usersData?.total ?? "…"} user{(usersData?.total ?? 0) !== 1 ? "s" : ""}</p>
            </div>

            <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 border-b border-border/50">
                  <tr>
                    {["User", "Groups", "Joined", "Role"].map((h, i) => (
                      <th key={h} className={`px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider ${i === 3 ? "text-right" : "text-left"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {usersLoading ? (
                    <tr><td colSpan={4} className="text-center py-8 text-muted-foreground">Loading…</td></tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr><td colSpan={4} className="text-center py-8 text-muted-foreground">No users found</td></tr>
                  ) : filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{u.name || <span className="text-muted-foreground italic">No name</span>}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{u.groupCount}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{format(new Date(u.createdAt), "dd MMM yyyy")}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => toggleSuperAdmin.mutate({ userId: u.id, isSuperAdmin: !u.isSuperAdmin })}
                          disabled={toggleSuperAdmin.isPending || u.id === user.id}
                          title={u.id === user.id ? "Can't change your own access" : ""}
                          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          style={u.isSuperAdmin
                            ? { borderColor: "#10b981", background: "#10b98115", color: "#059669" }
                            : { borderColor: "#e2e8f0", color: "#94a3b8" }}
                        >
                          {u.isSuperAdmin
                            ? <><ToggleRight className="w-4 h-4" /> Super Admin</>
                            : <><ToggleLeft className="w-4 h-4" /> Standard</>}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── SETTINGS ── */}
        {activeTab === "settings" && (
          <div className="space-y-4 max-w-xl">
            <div className="bg-card border border-border/50 rounded-2xl divide-y divide-border/50">
              <div className="px-6 py-4">
                <h3 className="font-semibold text-foreground">Platform Controls</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Changes take effect immediately for all users.</p>
              </div>

              {settingsLoading ? (
                <div className="px-6 py-6 text-sm text-muted-foreground animate-pulse">Loading settings…</div>
              ) : platformSettings && (
                <>
                  <div className="px-6 py-5 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">New Registrations</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Allow new users to sign up on the platform</p>
                    </div>
                    <button
                      onClick={() => toggleSetting.mutate({ reportingEnabled: !platformSettings.reportingEnabled })}
                      disabled={toggleSetting.isPending}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all disabled:opacity-60"
                      style={platformSettings.reportingEnabled
                        ? { background: "#10b981", borderColor: "#10b981", color: "white" }
                        : { borderColor: "#e2e8f0", color: "#94a3b8", background: "transparent" }}
                    >
                      {platformSettings.reportingEnabled
                        ? <><ToggleRight className="w-4 h-4" /> Enabled</>
                        : <><ToggleLeft className="w-4 h-4" /> Disabled</>}
                    </button>
                  </div>

                  <div className="px-6 py-5 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Maintenance Mode</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Displays a maintenance notice to all users</p>
                    </div>
                    <button
                      onClick={() => toggleSetting.mutate({ maintenanceMode: !platformSettings.maintenanceMode })}
                      disabled={toggleSetting.isPending}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all disabled:opacity-60"
                      style={platformSettings.maintenanceMode
                        ? { background: "#f59e0b", borderColor: "#f59e0b", color: "white" }
                        : { borderColor: "#e2e8f0", color: "#94a3b8", background: "transparent" }}
                    >
                      {platformSettings.maintenanceMode
                        ? <><AlertTriangle className="w-4 h-4" /> Active</>
                        : <><ToggleLeft className="w-4 h-4" /> Off</>}
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="bg-card border border-border/50 rounded-2xl divide-y divide-border/50">
              <div className="px-6 py-4">
                <h3 className="font-semibold text-foreground">Platform Summary</h3>
              </div>
              <div className="px-6 py-4 space-y-3 text-sm">
                {[
                  ["Total groups", revenue?.totalGroups ?? "—"],
                  ["Total users", usersData?.total ?? "—"],
                  ["Paying groups", revenue ? revenue.activeMonthly + revenue.activeAnnual : "—"],
                  ["Groups in trial", revenue?.trialGroups ?? "—"],
                  ["Estimated MRR", revenue ? `€${revenue.estimatedMrrEuros}` : "—"],
                ].map(([label, val]) => (
                  <div key={label as string} className="flex justify-between">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium text-foreground">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── ERRORS ── */}
        {activeTab === "errors" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Server Error Log</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {errorsData?.total ?? 0} entr{(errorsData?.total ?? 0) === 1 ? "y" : "ies"} — auto-refreshes every 15 seconds
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => refetchErrors()}
                  disabled={errorsLoading}
                  className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${errorsLoading ? "animate-spin" : ""}`} /> Refresh
                </button>
                {(errorsData?.total ?? 0) > 0 && (
                  <button
                    onClick={() => { if (confirm("Clear all error logs?")) clearAllErrors.mutate(); }}
                    disabled={clearAllErrors.isPending}
                    className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Clear all
                  </button>
                )}
              </div>
            </div>

            {errorsLoading ? (
              <div className="animate-pulse space-y-2">
                {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted rounded-xl" />)}
              </div>
            ) : !errorsData?.errors.length ? (
              <div className="bg-card border border-border/50 rounded-2xl p-12 text-center">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ShieldCheck className="w-6 h-6 text-emerald-500" />
                </div>
                <p className="text-sm font-medium text-foreground">No errors logged</p>
                <p className="text-xs text-muted-foreground mt-1">Server errors will appear here automatically</p>
              </div>
            ) : (
              <div className="space-y-2">
                {errorsData.errors.map(err => (
                  <div
                    key={err.id}
                    className={`bg-card border rounded-xl overflow-hidden transition-all ${
                      err.level === "error" ? "border-red-100" : err.level === "warn" ? "border-amber-100" : "border-border/50"
                    }`}
                  >
                    {/* Row */}
                    <button
                      className="w-full text-left px-4 py-3 hover:bg-muted/20 transition-colors"
                      onClick={() => setExpandedError(expandedError === err.id ? null : err.id)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <span className={`shrink-0 mt-0.5 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            err.level === "error" ? "bg-red-500/15 text-red-600" :
                            err.level === "warn" ? "bg-amber-500/15 text-amber-600" :
                            "bg-blue-500/15 text-blue-600"
                          }`}>
                            {err.level}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{err.message}</p>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground flex-wrap">
                              {err.method && err.path && (
                                <span className="font-mono bg-muted px-1.5 py-0.5 rounded">{err.method} {err.path}</span>
                              )}
                              {err.statusCode && (
                                <span className={`font-mono px-1.5 py-0.5 rounded ${
                                  err.statusCode >= 500 ? "bg-red-100 text-red-600" : "bg-muted"
                                }`}>{err.statusCode}</span>
                              )}
                              <span>{formatDistanceToNow(new Date(err.createdAt), { addSuffix: true })}</span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={e => { e.stopPropagation(); deleteOneError.mutate(err.id); }}
                          disabled={deleteOneError.isPending}
                          className="shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete this entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </button>

                    {/* Expanded stack trace */}
                    {expandedError === err.id && (err.stack || err.meta) && (
                      <div className="border-t border-border/50 bg-slate-950 px-4 py-3">
                        {err.stack && (
                          <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap overflow-x-auto leading-relaxed max-h-64 overflow-y-auto">
                            {err.stack}
                          </pre>
                        )}
                        {err.meta && (
                          <div className="mt-2 pt-2 border-t border-slate-800">
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Meta</p>
                            <pre className="text-xs text-slate-400 font-mono whitespace-pre-wrap">
                              {JSON.stringify(JSON.parse(err.meta), null, 2)}
                            </pre>
                          </div>
                        )}
                        <p className="text-[10px] text-slate-500 mt-2">
                          {format(new Date(err.createdAt), "dd MMM yyyy HH:mm:ss")}
                          {err.userId && ` · user ${err.userId}`}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
