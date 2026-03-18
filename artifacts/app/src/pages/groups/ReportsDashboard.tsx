import { useState } from "react";
import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useListReports, useGetGroup, useGetMe } from "@workspace/api-client-react";
import { useGroupTerminology } from "@/hooks/useGroupTerminology";
import SidebarLayout from "@/components/layout/SidebarLayout";
import {
  AlertTriangle, CheckCircle2, Clock, ArrowUpRight, Filter,
  ChevronLeft, ChevronRight, Loader2, FileText, Flame, TrendingUp, UserCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Period = "today" | "week" | "month" | "year" | "all";
type StatusFilter = "all" | "open" | "in_progress" | "escalated" | "resolved";
type SeverityFilter = "all" | "low" | "medium" | "high" | "emergency";

interface DashboardStats {
  total: number; open: number; inProgress: number;
  escalated: number; resolved: number; emergency: number;
}

function useGroupStats(groupSlug: string, period: Period) {
  return useQuery<DashboardStats>({
    queryKey: [`/api/groups/${groupSlug}/reports/stats`, period],
    queryFn: async () => {
      const url = period === "all"
        ? `/api/groups/${groupSlug}/reports/stats`
        : `/api/groups/${groupSlug}/reports/stats?period=${period}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load stats");
      return res.json();
    },
    enabled: !!groupSlug,
  });
}

const severityColour: Record<string, string> = {
  low: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  medium: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  high: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  emergency: "bg-red-500/15 text-red-400 border-red-500/30",
};

const statusColour: Record<string, string> = {
  open: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  in_progress: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  escalated: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  resolved: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
};

const statusLabel: Record<string, string> = {
  open: "Open", in_progress: "In Progress", escalated: "Escalated", resolved: "Resolved",
};

function Badge({ value, map, className }: { value: string; map: Record<string, string>; className?: string }) {
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border capitalize",
      map[value] ?? "bg-muted text-muted-foreground border-border",
      className
    )}>
      {statusLabel[value] ?? value.replace("_", " ")}
    </span>
  );
}

function StatCard({ label, value, icon: Icon, accent }: { label: string; value: number; icon: any; accent?: string }) {
  return (
    <div className={cn("bg-card border rounded-2xl p-5 flex flex-col gap-1", accent ?? "border-border")}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
        <Icon className={cn("w-4 h-4", accent ? "text-current" : "text-muted-foreground")} />
      </div>
      <span className="text-3xl font-bold text-foreground">{value}</span>
    </div>
  );
}

export default function ReportsDashboard() {
  const [, params] = useRoute("/g/:slug/reports");
  const slug = params?.slug ?? "";

  const { data: group } = useGetGroup(slug);
  const { data: me } = useGetMe();
  const terms = useGroupTerminology((group as any)?.groupType);

  const [period, setPeriod] = useState<Period>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");
  const [page, setPage] = useState(1);

  const { data: stats, isLoading: statsLoading } = useGroupStats(slug, period);

  const { data: reportData, isLoading: reportsLoading } = useListReports(slug, {
    ...(statusFilter !== "all" ? { status: statusFilter as any } : {}),
    ...(severityFilter !== "all" ? { severity: severityFilter as any } : {}),
    page,
    limit: 20,
  });

  const reports = reportData?.reports ?? [];
  const totalPages = reportData?.totalPages ?? 1;

  return (
    <SidebarLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{terms.dashboardHeading}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{group?.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={(v) => { setPeriod(v as Period); setPage(1); }}>
              <SelectTrigger className="w-36 h-9 text-sm bg-card border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 days</SelectItem>
                <SelectItem value="month">Last 30 days</SelectItem>
                <SelectItem value="year">Last year</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats Bar */}
        {statsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 animate-pulse">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-5 h-24" />
            ))}
          </div>
        ) : stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard label="Total" value={stats.total} icon={FileText} />
            <StatCard label="Open" value={stats.open} icon={Clock} accent="border-sky-500/40" />
            <StatCard label="In Progress" value={stats.inProgress} icon={TrendingUp} accent="border-violet-500/40" />
            <StatCard label="Escalated" value={stats.escalated} icon={ArrowUpRight} accent="border-orange-500/40" />
            <StatCard label="Resolved" value={stats.resolved} icon={CheckCircle2} accent="border-emerald-500/40" />
            <StatCard label="Emergency" value={stats.emergency} icon={Flame} accent="border-red-500/40" />
          </div>
        )}

        {/* Needs a Responder banner */}
        {stats && stats.open > 0 && statusFilter !== "open" && (
          <div className="flex items-center justify-between gap-4 bg-sky-500/10 border border-sky-500/30 rounded-2xl px-5 py-4">
            <div className="flex items-center gap-3">
              <UserCheck className="w-5 h-5 text-sky-400 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-sky-300">
                  {stats.open} open {stats.open === 1 ? `${terms.reportNoun} needs` : `${terms.reportNounPlural} need`} a responder
                </p>
                <p className="text-xs text-sky-400/70 mt-0.5">These reports have not been claimed yet.</p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="border-sky-500/40 text-sky-300 hover:bg-sky-500/10 hover:text-sky-200 shrink-0 text-xs"
              onClick={() => { setStatusFilter("open"); setPage(1); }}
            >
              View open reports
            </Button>
          </div>
        )}

        {/* Filters + Table */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {/* Filter bar */}
          <div className="flex flex-wrap items-center gap-3 p-4 border-b border-border">
            <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as StatusFilter); setPage(1); }}>
              <SelectTrigger className="w-36 h-8 text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="escalated">Escalated</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
            <Select value={severityFilter} onValueChange={(v) => { setSeverityFilter(v as SeverityFilter); setPage(1); }}>
              <SelectTrigger className="w-36 h-8 text-sm">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
              </SelectContent>
            </Select>
            {(statusFilter !== "all" || severityFilter !== "all") && (
              <Button
                variant="ghost" size="sm"
                className="h-8 text-xs text-muted-foreground"
                onClick={() => { setStatusFilter("all"); setSeverityFilter("all"); setPage(1); }}
              >
                Clear filters
              </Button>
            )}
          </div>

          {/* Table */}
          {reportsLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-20">
              <AlertTriangle className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">{statusFilter !== "all" || severityFilter !== "all" ? "No results match your filters" : terms.emptyState}</p>
              {(statusFilter !== "all" || severityFilter !== "all") && (
                <p className="text-xs text-muted-foreground mt-1">Try clearing the filters</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Ref #</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Severity</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Claimed By</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {reports.map((r) => (
                    <tr key={r.id} className="hover:bg-muted/20 transition-colors group">
                      <td className="px-4 py-3 font-mono text-xs text-foreground font-medium whitespace-nowrap">
                        {r.referenceNumber}
                      </td>
                      <td className="px-4 py-3 text-foreground max-w-[180px] truncate">
                        {r.incidentTypeName}
                      </td>
                      <td className="px-4 py-3">
                        <Badge value={r.severity} map={severityColour} />
                      </td>
                      <td className="px-4 py-3">
                        <Badge value={r.status} map={statusColour} />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                        {r.claimedByName ?? <span className="text-muted-foreground/50 italic">Unclaimed</span>}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                        {new Date(r.submittedAt).toLocaleDateString("en-IE", {
                          day: "numeric", month: "short", year: "numeric"
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/g/${slug}/reports/${r.referenceNumber}`}>
                          <Button variant="ghost" size="sm" className="h-7 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                            View →
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <span className="text-xs text-muted-foreground">
                Page {page} of {totalPages} · {reportData?.total ?? 0} reports
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline" size="icon"
                  className="h-7 w-7"
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline" size="icon"
                  className="h-7 w-7"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}
