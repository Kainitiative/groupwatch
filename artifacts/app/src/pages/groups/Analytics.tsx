import { useState } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import SidebarLayout from "@/components/layout/SidebarLayout";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { TrendingUp, Clock, CheckCircle2, BarChart2, Download, Loader2, AlertTriangle } from "lucide-react";

type Period = "week" | "month" | "year" | "all";

const SEVERITY_COLOURS: Record<string, string> = {
  low: "#38bdf8",
  medium: "#fb923c",
  high: "#f97316",
  emergency: "#ef4444",
};

const STATUS_COLOURS: Record<string, string> = {
  open: "#38bdf8",
  in_progress: "#a78bfa",
  escalated: "#fb923c",
  resolved: "#34d399",
};

const TYPE_COLOURS = [
  "#10b981","#38bdf8","#a78bfa","#fb923c","#f43f5e",
  "#facc15","#34d399","#818cf8","#f97316","#06b6d4",
];

function fmtMinutes(mins: number | null): string {
  if (mins === null) return "—";
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function StatCard({ label, value, sub, icon: Icon, colour }: { label: string; value: string; sub?: string; icon: any; colour: string }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${colour}`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
      <h3 className="text-sm font-semibold text-white mb-4">{title}</h3>
      {children}
    </div>
  );
}

export default function Analytics() {
  const [, params] = useRoute("/g/:slug/analytics");
  const slug = params?.slug ?? "";
  const [period, setPeriod] = useState<Period>("month");

  const { data, isLoading, error } = useQuery<any>({
    queryKey: [`/api/groups/${slug}/analytics`, period],
    queryFn: async () => {
      const res = await fetch(`/api/groups/${slug}/analytics?period=${period}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load analytics");
      return res.json();
    },
  });

  const handleCsvExport = () => {
    window.open(`/api/groups/${slug}/reports/export/csv`, "_blank");
  };

  const periods: { id: Period; label: string }[] = [
    { id: "week", label: "This Week" },
    { id: "month", label: "30 Days" },
    { id: "year", label: "12 Months" },
    { id: "all", label: "All Time" },
  ];

  return (
    <SidebarLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Analytics</h1>
            <p className="text-slate-400 text-sm mt-1">Incident trends and response performance</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Period filter */}
            <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1">
              {periods.map(p => (
                <button
                  key={p.id}
                  onClick={() => setPeriod(p.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    period === p.id
                      ? "bg-emerald-600 text-white shadow"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <button
              onClick={handleCsvExport}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-sm font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 bg-red-950/30 border border-red-700/40 rounded-2xl p-6">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <p className="text-red-300 text-sm">Failed to load analytics data.</p>
          </div>
        )}

        {data && (
          <div className="space-y-6">
            {/* KPI cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Total Reports"
                value={String(data.total)}
                icon={BarChart2}
                colour="bg-emerald-500/20 text-emerald-400"
              />
              <StatCard
                label="Resolved"
                value={String(data.byStatus?.find((s: any) => s.status === "resolved")?.count ?? 0)}
                sub={data.total > 0 ? `${Math.round((data.byStatus?.find((s: any) => s.status === "resolved")?.count ?? 0) / data.total * 100)}% resolution rate` : undefined}
                icon={CheckCircle2}
                colour="bg-emerald-500/20 text-emerald-400"
              />
              <StatCard
                label="Avg Response Time"
                value={fmtMinutes(data.avgResponseMinutes)}
                sub="Submission to claim"
                icon={Clock}
                colour="bg-blue-500/20 text-blue-400"
              />
              <StatCard
                label="Avg Resolution Time"
                value={fmtMinutes(data.avgResolutionMinutes)}
                sub="Claim to resolved"
                icon={TrendingUp}
                colour="bg-violet-500/20 text-violet-400"
              />
            </div>

            {/* Reports over time */}
            {data.reportsOverTime?.length > 0 && (
              <ChartCard title="Reports Over Time">
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={data.reportsOverTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "#64748b", fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      interval={data.reportsOverTime.length > 14 ? Math.floor(data.reportsOverTime.length / 7) : 0}
                    />
                    <YAxis tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "12px", color: "#f8fafc" }}
                      cursor={{ stroke: "#334155" }}
                    />
                    <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: "#10b981" }} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* By incident type */}
              {data.byType?.length > 0 && (
                <ChartCard title="By Incident Type">
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={data.byType} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                      <XAxis type="number" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                      <YAxis type="category" dataKey="type" tick={{ fill: "#94a3b8", fontSize: 11 }} tickLine={false} axisLine={false} width={110} />
                      <Tooltip
                        contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "12px", color: "#f8fafc" }}
                        cursor={{ fill: "#1e293b" }}
                      />
                      <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                        {data.byType.map((_: any, i: number) => (
                          <Cell key={i} fill={TYPE_COLOURS[i % TYPE_COLOURS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}

              {/* By severity */}
              {data.bySeverity?.length > 0 && (
                <ChartCard title="By Severity">
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={data.bySeverity}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="severity" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "12px", color: "#f8fafc" }}
                        cursor={{ fill: "#1e293b" }}
                      />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                        {data.bySeverity.map((item: any) => (
                          <Cell key={item.severity} fill={SEVERITY_COLOURS[item.severity] ?? "#64748b"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}

              {/* Day of week heatmap */}
              {data.byDayOfWeek?.length > 0 && (
                <ChartCard title="Reports by Day of Week">
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={data.byDayOfWeek}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="day" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "12px", color: "#f8fafc" }}
                        cursor={{ fill: "#1e293b" }}
                      />
                      <Bar dataKey="count" fill="#a78bfa" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}

              {/* By status */}
              {data.byStatus?.some((s: any) => s.count > 0) && (
                <ChartCard title="Current Status Breakdown">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={data.byStatus.filter((s: any) => s.count > 0)}
                        dataKey="count"
                        nameKey="status"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ status, percent }) =>
                          percent > 0.04 ? `${status.replace("_", " ")} ${(percent * 100).toFixed(0)}%` : ""
                        }
                        labelLine={false}
                      >
                        {data.byStatus.filter((s: any) => s.count > 0).map((item: any) => (
                          <Cell key={item.status} fill={STATUS_COLOURS[item.status] ?? "#64748b"} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "12px", color: "#f8fafc" }}
                        formatter={(val: any, name: any) => [val, String(name).replace("_", " ")]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}
            </div>

            {data.total === 0 && (
              <div className="text-center py-16 text-slate-500">
                <BarChart2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>No reports in this period yet.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
