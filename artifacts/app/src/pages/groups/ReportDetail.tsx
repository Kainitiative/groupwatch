import { useState, useRef, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { useGetReport, useAddReportUpdate, useGetMe } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetReportQueryKey } from "@workspace/api-client-react";
import SidebarLayout from "@/components/layout/SidebarLayout";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, MapPin, Camera, User, Shield, Clock, CheckCircle2,
  ArrowUpRight, MessageSquare, Loader2, Lock, Mic, MicOff, AlertTriangle, Flag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

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

function Badge({ value, map }: { value: string; map: Record<string, string> }) {
  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border capitalize",
      map[value] ?? "bg-muted text-muted-foreground border-border"
    )}>
      {statusLabel[value] ?? value.replace(/_/g, " ")}
    </span>
  );
}

function TimelineEntry({ update }: { update: any }) {
  const icons: Record<string, any> = {
    claim: Shield,
    auto_claim: Shield,
    status_change: Flag,
    note: MessageSquare,
    photo_added: Camera,
    escalation: ArrowUpRight,
  };
  const Icon = icons[update.updateType] ?? MessageSquare;

  const label: Record<string, string> = {
    claim: "Claimed report",
    auto_claim: "Auto-claimed on submission",
    status_change: `Status changed to "${statusLabel[update.newStatus] ?? update.newStatus}"`,
    note: "Added a note",
    photo_added: "Attached a photo",
    escalation: update.escalatedTo ? `Escalated to ${update.escalatedTo}` : "Escalated",
  };

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center shrink-0 z-10">
          <Icon className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
        <div className="w-px flex-1 bg-border mt-1" />
      </div>
      <div className="pb-6 flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-foreground">{update.actorName}</span>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground">{label[update.updateType] ?? update.updateType}</span>
        </div>
        {update.note && (
          <p className="mt-1.5 text-sm text-muted-foreground bg-muted/50 rounded-xl p-3 border border-border">
            {update.note}
          </p>
        )}
        <span className="text-xs text-muted-foreground/60 mt-1 block">
          {new Date(update.createdAt).toLocaleString("en-IE", {
            day: "numeric", month: "short", year: "numeric",
            hour: "2-digit", minute: "2-digit"
          })}
        </span>
      </div>
    </div>
  );
}

export default function ReportDetail() {
  const [, params] = useRoute("/g/:slug/reports/:ref");
  const slug = params?.slug ?? "";
  const ref = params?.ref ?? "";

  const { data: detail, isLoading, error } = useGetReport(slug, ref);
  const { data: me } = useGetMe();
  const addUpdate = useAddReportUpdate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [noteText, setNoteText] = useState("");
  const [newStatus, setNewStatus] = useState<string>("");
  const [activePanel, setActivePanel] = useState<"note" | "status" | null>(null);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const report = detail?.report;
  const updates = detail?.updates ?? [];
  const photos = detail?.photos ?? [];
  const reporter = detail?.reporter;

  const isClaimed = !!report?.claimedByUserId;
  const isMyReport = report?.claimedByUserId === me?.id;

  const hasVoice = typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const toggleVoice = () => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = "en-IE";
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (e: any) => {
      const transcript = Array.from(e.results)
        .map((r: any) => r[0].transcript)
        .join(" ");
      setNoteText(p => (p ? p + " " + transcript : transcript));
    };
    rec.onend = () => setListening(false);
    rec.start();
    recognitionRef.current = rec;
    setListening(true);
  };

  useEffect(() => () => recognitionRef.current?.stop(), []);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getGetReportQueryKey(slug, ref) });
  };

  const handleClaim = async () => {
    try {
      await addUpdate.mutateAsync({ groupSlug: slug, referenceNumber: ref, data: { updateType: "claim" } });
      invalidate();
      toast({ title: "Report claimed", description: "You are now the assigned responder." });
    } catch (e: any) {
      toast({ title: "Error", description: e?.message ?? "Could not claim report", variant: "destructive" });
    }
  };

  const handleStatusChange = async () => {
    if (!newStatus) return;
    try {
      await addUpdate.mutateAsync({
        groupSlug: slug, referenceNumber: ref,
        data: { updateType: "status_change", newStatus: newStatus as any },
      });
      invalidate();
      setNewStatus("");
      setActivePanel(null);
      toast({ title: "Status updated", description: `Report marked as ${statusLabel[newStatus] ?? newStatus}` });
    } catch (e: any) {
      toast({ title: "Error", description: e?.message ?? "Could not update status", variant: "destructive" });
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    try {
      await addUpdate.mutateAsync({
        groupSlug: slug, referenceNumber: ref,
        data: { updateType: "note", note: noteText.trim() },
      });
      invalidate();
      setNoteText("");
      setActivePanel(null);
      toast({ title: "Note added" });
    } catch (e: any) {
      toast({ title: "Error", description: e?.message ?? "Could not add note", variant: "destructive" });
    }
  };

  if (isLoading) return (
    <SidebarLayout>
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    </SidebarLayout>
  );

  if (error || !report) return (
    <SidebarLayout>
      <div className="text-center py-32">
        <AlertTriangle className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Report not found or you don't have access.</p>
        <Link href={`/g/${slug}/reports`}>
          <Button variant="ghost" size="sm" className="mt-4">← Back to reports</Button>
        </Link>
      </div>
    </SidebarLayout>
  );

  return (
    <SidebarLayout>
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Back + header */}
        <div>
          <Link href={`/g/${slug}/reports`}>
            <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
              <ArrowLeft className="w-4 h-4" /> All Reports
            </button>
          </Link>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="font-mono text-lg font-bold text-foreground">{report.referenceNumber}</h1>
                <Badge value={report.severity} map={severityColour} />
                <Badge value={report.status} map={statusColour} />
              </div>
              <p className="text-muted-foreground text-sm mt-1">{report.incidentTypeName}</p>
            </div>
            <div className="text-xs text-muted-foreground text-right">
              <p>Submitted {new Date(report.submittedAt).toLocaleString("en-IE", {
                day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
              })}</p>
              {report.claimedByName && (
                <p className="mt-0.5">Claimed by <span className="text-foreground font-medium">{report.claimedByName}</span></p>
              )}
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex flex-wrap gap-2">
            {!isClaimed && (
              <Button
                size="sm"
                className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl"
                onClick={handleClaim}
                disabled={addUpdate.isPending}
              >
                <Shield className="w-4 h-4 mr-1.5" />
                Claim Report
              </Button>
            )}
            <Button
              size="sm" variant="outline" className="rounded-xl"
              onClick={() => setActivePanel(activePanel === "status" ? null : "status")}
            >
              <Flag className="w-4 h-4 mr-1.5" />
              Change Status
            </Button>
            <Button
              size="sm" variant="outline" className="rounded-xl"
              onClick={() => setActivePanel(activePanel === "note" ? null : "note")}
            >
              <MessageSquare className="w-4 h-4 mr-1.5" />
              Add Note
            </Button>
          </div>

          {/* Status panel */}
          {activePanel === "status" && (
            <div className="mt-4 pt-4 border-t border-border flex flex-wrap items-center gap-3">
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="w-44 h-9 text-sm">
                  <SelectValue placeholder="Select new status..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="escalated">Escalated</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
              <Button
                size="sm" onClick={handleStatusChange}
                disabled={!newStatus || addUpdate.isPending}
                className="rounded-xl"
              >
                {addUpdate.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update Status"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setActivePanel(null)}>Cancel</Button>
            </div>
          )}

          {/* Note panel */}
          {activePanel === "note" && (
            <div className="mt-4 pt-4 border-t border-border space-y-3">
              <div className="relative">
                <Textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Add a note to this report…"
                  className="min-h-[90px] pr-12 resize-none text-sm"
                />
                {hasVoice && (
                  <button
                    onClick={toggleVoice}
                    className={cn(
                      "absolute bottom-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                      listening ? "bg-red-500 text-white animate-pulse" : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                    title={listening ? "Stop recording" : "Voice to text"}
                  >
                    {listening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm" onClick={handleAddNote}
                  disabled={!noteText.trim() || addUpdate.isPending}
                  className="rounded-xl"
                >
                  {addUpdate.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Note"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setActivePanel(null); setNoteText(""); }}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Original Submission — locked */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-border bg-muted/30">
            <Lock className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Original Submission — Locked Record
            </span>
          </div>
          <div className="p-5 space-y-5">
            {/* Reporter */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Reported by</p>
                <p className="text-sm font-medium text-foreground">
                  {report.isAnonymous ? "Anonymous" : reporter?.name ?? "Unknown"}
                </p>
              </div>
            </div>

            {/* Description */}
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Description</p>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap bg-muted/30 p-4 rounded-xl border border-border">
                {report.description}
              </p>
            </div>

            {/* Location */}
            {(report.latitude || report.longitude) && (
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Location</p>
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <MapPin className="w-4 h-4 text-accent" />
                  <span className="font-mono">{report.latitude?.toFixed(6)}, {report.longitude?.toFixed(6)}</span>
                  <a
                    href={`https://www.google.com/maps?q=${report.latitude},${report.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-accent hover:underline ml-1"
                  >
                    Open in Maps ↗
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Photos */}
        {photos.length > 0 && (
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
              <Camera className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">Photos ({photos.length})</span>
            </div>
            <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {photos.map((photo) => (
                <div key={photo.id} className="group relative">
                  <a href={photo.url} target="_blank" rel="noopener noreferrer">
                    <img
                      src={photo.url}
                      alt="Incident photo"
                      className="w-full aspect-square object-cover rounded-xl border border-border group-hover:opacity-90 transition-opacity"
                    />
                  </a>
                  {(photo.exifTakenAt || photo.exifLatitude) && (
                    <div className="absolute bottom-2 left-2 right-2 bg-black/70 backdrop-blur-sm rounded-lg px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-xs text-white/90">
                        {photo.exifTakenAt && new Date(photo.exifTakenAt).toLocaleDateString("en-IE")}
                        {photo.exifLatitude && <> · GPS: {photo.exifLatitude.toFixed(4)}, {photo.exifLongitude?.toFixed(4)}</>}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Activity Timeline */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">Activity Timeline</span>
            <span className="text-xs text-muted-foreground ml-auto">{updates.length} events</span>
          </div>
          <div className="p-5">
            {updates.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No activity yet</p>
            ) : (
              <div>
                {[...updates].reverse().map((u, i) => (
                  <div key={u.id} className={i === updates.length - 1 ? "" : undefined}>
                    <TimelineEntry update={u} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Immutability footer */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground/60 px-1 pb-4">
          <Lock className="w-3 h-3" />
          Original submission is a permanent, locked record. All changes are appended to the activity timeline above.
        </div>
      </div>
    </SidebarLayout>
  );
}
