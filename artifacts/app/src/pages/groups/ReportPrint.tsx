import { useEffect } from "react";
import { useRoute, Link } from "wouter";
import { useGetReport, useGetGroup } from "@workspace/api-client-react";
import { Loader2, AlertTriangle, ArrowLeft } from "lucide-react";

export default function ReportPrint() {
  const [, params] = useRoute("/g/:slug/reports/:ref/print");
  const slug = params?.slug ?? "";
  const ref = params?.ref ?? "";

  const { data: detail, isLoading, error } = useGetReport(slug, ref);
  const { data: group } = useGetGroup(slug);

  useEffect(() => {
    if (detail) {
      setTimeout(() => window.print(), 800);
    }
  }, [detail]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !detail?.report) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <AlertTriangle className="w-8 h-8 text-gray-400" />
        <p className="text-gray-500">Report not found.</p>
        <Link href={`/g/${slug}/reports`}>
          <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4" /> Back to reports
          </button>
        </Link>
      </div>
    );
  }

  const report = detail.report;
  const updates = detail.updates ?? [];
  const photos = detail.photos ?? [];

  const fmtDate = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleString("en-IE", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

  const severityLabel: Record<string, string> = {
    low: "Low", medium: "Medium", high: "High", emergency: "EMERGENCY",
  };
  const statusLabel: Record<string, string> = {
    open: "Open", in_progress: "In Progress", escalated: "Escalated", resolved: "Resolved",
  };
  const updateTypeLabel: Record<string, string> = {
    claim: "Report Claimed",
    auto_claim: "Auto-Claimed",
    status_change: "Status Changed",
    note: "Note Added",
    photo_added: "Photo Added",
    escalation: "Escalated",
  };

  return (
    <>
      <style>{`
        @media print {
          body { margin: 0; font-family: Georgia, serif; }
          .no-print { display: none !important; }
          .page-break { page-break-before: always; }
        }
        body { font-family: Georgia, 'Times New Roman', serif; color: #111; background: white; }
        * { box-sizing: border-box; }
      `}</style>

      {/* Back button (screen only) */}
      <div className="no-print fixed top-4 left-4 z-50 flex gap-2">
        <Link href={`/g/${slug}/reports/${ref}`}>
          <button className="flex items-center gap-2 px-3 py-2 bg-white border rounded-lg shadow text-sm text-gray-700 hover:bg-gray-50">
            <ArrowLeft className="w-4 h-4" /> Back to Report
          </button>
        </Link>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-3 py-2 bg-black text-white border rounded-lg shadow text-sm hover:bg-gray-900"
        >
          Print / Save PDF
        </button>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 32px", fontSize: 14, lineHeight: 1.6 }}>

        {/* Header */}
        <div style={{ borderBottom: "3px solid #111", paddingBottom: 20, marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "#666", marginBottom: 4 }}>
                Incident Report — Official Record
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.5 }}>
                {report.referenceNumber}
              </div>
              <div style={{ fontSize: 14, color: "#444", marginTop: 4 }}>
                {group?.name ?? slug}
              </div>
            </div>
            <div style={{ textAlign: "right", fontSize: 11, color: "#666" }}>
              <div>Printed: {fmtDate(new Date().toISOString())}</div>
              <div style={{ marginTop: 4, padding: "3px 10px", background: "#f0f0f0", borderRadius: 4, display: "inline-block" }}>
                Status: {statusLabel[report.status] ?? report.status}
              </div>
              <div style={{ marginTop: 4, padding: "3px 10px", background: "#f0f0f0", borderRadius: 4, display: "inline-block" }}>
                Severity: {severityLabel[report.severity] ?? report.severity}
              </div>
            </div>
          </div>
        </div>

        {/* Core details */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 12, letterSpacing: 1.5, textTransform: "uppercase", color: "#888", marginBottom: 12, fontFamily: "sans-serif" }}>
            Original Submission — Locked Record
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <tbody>
              {[
                ["Incident Type", report.incidentTypeName],
                ["Severity", severityLabel[report.severity]],
                ["Submitted At", fmtDate(report.submittedAt)],
                ["Reporter", report.isAnonymous ? "Anonymous" : (detail.reporter?.name ?? "Unknown")],
                ["Location", report.latitude && report.longitude ? `${report.latitude.toFixed(6)}, ${report.longitude.toFixed(6)}` : "Not provided"],
                ["Claimed By", report.claimedByName ?? "Unclaimed"],
                ["Claimed At", fmtDate(report.claimedAt)],
                ["Resolved At", fmtDate(report.resolvedAt)],
              ].map(([label, value]) => (
                <tr key={label} style={{ borderBottom: "1px solid #e5e5e5" }}>
                  <td style={{ padding: "8px 12px 8px 0", color: "#555", fontWeight: 600, width: 160, fontFamily: "sans-serif", fontSize: 12, verticalAlign: "top" }}>{label}</td>
                  <td style={{ padding: "8px 0" }}>{value || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Description */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 12, letterSpacing: 1.5, textTransform: "uppercase", color: "#888", marginBottom: 8, fontFamily: "sans-serif" }}>
            Description
          </div>
          <div style={{ background: "#f9f9f9", border: "1px solid #e0e0e0", borderRadius: 6, padding: "14px 16px", whiteSpace: "pre-wrap", fontSize: 13 }}>
            {report.description}
          </div>
        </div>

        {/* Photos */}
        {photos.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 12, letterSpacing: 1.5, textTransform: "uppercase", color: "#888", marginBottom: 12, fontFamily: "sans-serif" }}>
              Evidence Photos ({photos.length})
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {photos.map((p: any) => (
                <div key={p.id}>
                  <img
                    src={p.url}
                    alt="Incident photo"
                    style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 4, border: "1px solid #ddd" }}
                  />
                  {(p.exifTakenAt || p.exifLatitude) && (
                    <div style={{ fontSize: 10, color: "#888", marginTop: 3, fontFamily: "sans-serif" }}>
                      {p.exifTakenAt && <span>📷 {fmtDate(p.exifTakenAt)} </span>}
                      {p.exifLatitude && <span>📍 {p.exifLatitude?.toFixed(5)}, {p.exifLongitude?.toFixed(5)}</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Activity timeline */}
        {updates.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 12, letterSpacing: 1.5, textTransform: "uppercase", color: "#888", marginBottom: 12, fontFamily: "sans-serif" }}>
              Activity Timeline ({updates.length} entries)
            </div>
            <div style={{ borderLeft: "2px solid #e0e0e0", paddingLeft: 18 }}>
              {updates.map((u: any, i: number) => (
                <div key={u.id} style={{ marginBottom: i < updates.length - 1 ? 16 : 0, position: "relative" }}>
                  <div style={{ position: "absolute", left: -24, top: 4, width: 10, height: 10, borderRadius: "50%", background: "#666", border: "2px solid white", outline: "1px solid #e0e0e0" }} />
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "sans-serif", fontSize: 12, fontWeight: 600 }}>
                        {updateTypeLabel[u.updateType] ?? u.updateType}
                        {u.newStatus && <span style={{ color: "#888", fontWeight: 400 }}> → {statusLabel[u.newStatus] ?? u.newStatus}</span>}
                        {u.escalatedTo && <span style={{ color: "#888", fontWeight: 400 }}> → {u.escalatedTo}</span>}
                      </div>
                      <div style={{ fontSize: 11, color: "#888", fontFamily: "sans-serif" }}>
                        {u.actorName} · {fmtDate(u.createdAt)}
                      </div>
                      {u.note && (
                        <div style={{ marginTop: 4, background: "#f9f9f9", border: "1px solid #e8e8e8", borderRadius: 4, padding: "6px 10px", fontSize: 13, whiteSpace: "pre-wrap" }}>
                          {u.note}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Immutability footer */}
        <div style={{ borderTop: "2px solid #111", paddingTop: 16, marginTop: 32 }}>
          <div style={{ fontSize: 11, color: "#555", fontFamily: "sans-serif", lineHeight: 1.7 }}>
            <strong>Immutability Declaration</strong><br />
            This document is an official record generated by IncidentIQ. The original submission fields (incident type, severity, description, location, reporter identity, and submission timestamp) are permanently locked in the system and cannot be altered after creation. All subsequent actions are recorded in the immutable activity timeline above with full timestamps and actor identity. This document may be submitted as evidence in legal, regulatory, or funding contexts.
          </div>
          <div style={{ marginTop: 12, fontSize: 11, color: "#888", fontFamily: "sans-serif" }}>
            Generated by IncidentIQ · {new Date().toISOString()} · {report.referenceNumber}
          </div>
        </div>

      </div>
    </>
  );
}
