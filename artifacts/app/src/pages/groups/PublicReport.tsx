import { useState, useEffect, useCallback } from "react";
import { useRoute } from "wouter";
import { MapPin, Camera, X, CheckCircle2, Loader2, AlertTriangle, Shield } from "lucide-react";

const SEVERITY_OPTS = [
  { value: "low", label: "Low", desc: "Minor, non-urgent", colour: "border-blue-400 bg-blue-50 text-blue-800" },
  { value: "medium", label: "Medium", desc: "Needs attention", colour: "border-yellow-400 bg-yellow-50 text-yellow-800" },
  { value: "high", label: "High", desc: "Urgent response needed", colour: "border-orange-400 bg-orange-50 text-orange-800" },
  { value: "emergency", label: "Emergency", desc: "Immediate action required", colour: "border-red-500 bg-red-50 text-red-800" },
];

type WidgetInfo = {
  groupName: string;
  groupType: string;
  brandColour: string | null;
  logoUrl: string | null;
  incidentTypes: { id: string; name: string; colour: string | null }[];
};

async function compressImage(file: File, maxBytes = 900_000): Promise<File> {
  if (file.size <= maxBytes) return file;
  return new Promise((resolve) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let { width, height } = img;
      const scale = Math.sqrt(maxBytes / file.size);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url);
        resolve(blob ? new File([blob], file.name, { type: "image/jpeg" }) : file);
      }, "image/jpeg", 0.82);
    };
    img.src = url;
  });
}

export default function PublicReport() {
  const [, params] = useRoute("/r/:slug");
  const slug = params?.slug ?? "";

  const [widgetInfo, setWidgetInfo] = useState<WidgetInfo | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [incidentTypeId, setIncidentTypeId] = useState("");
  const [severity, setSeverity] = useState("medium");
  const [description, setDescription] = useState("");
  const [reporterName, setReporterName] = useState("");
  const [reporterEmail, setReporterEmail] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<string | null>(null); // reference number

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/widget/${slug}`, { credentials: "omit" })
      .then(async (r) => {
        if (!r.ok) {
          const err = await r.json().catch(() => ({ error: "Failed to load" }));
          throw new Error(err.error || "Failed to load form");
        }
        return r.json();
      })
      .then((data) => { setWidgetInfo(data); setLoading(false); })
      .catch((e) => { setLoadError(e.message); setLoading(false); });
  }, [slug]);

  const handleGps = useCallback(() => {
    if (!navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setGpsLoading(false);
      },
      () => setGpsLoading(false),
      { timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  const handlePhotos = useCallback(async (files: FileList | null) => {
    if (!files) return;
    const newFiles: File[] = [];
    const newPreviews: string[] = [];
    for (const f of Array.from(files).slice(0, 4 - photos.length)) {
      const compressed = await compressImage(f);
      newFiles.push(compressed);
      newPreviews.push(URL.createObjectURL(compressed));
    }
    setPhotos(p => [...p, ...newFiles]);
    setPreviews(p => [...p, ...newPreviews]);
  }, [photos.length]);

  const removePhoto = (i: number) => {
    URL.revokeObjectURL(previews[i]);
    setPhotos(p => p.filter((_, idx) => idx !== i));
    setPreviews(p => p.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!incidentTypeId) { setSubmitError("Please select an incident type."); return; }
    if (description.trim().length < 10) { setSubmitError("Description must be at least 10 characters."); return; }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("incidentTypeId", incidentTypeId);
      fd.append("severity", severity);
      fd.append("description", description.trim());
      if (reporterName.trim()) fd.append("reporterName", reporterName.trim());
      if (reporterEmail.trim()) fd.append("reporterEmail", reporterEmail.trim());
      if (latitude !== null) fd.append("latitude", String(latitude));
      if (longitude !== null) fd.append("longitude", String(longitude));
      photos.forEach(p => fd.append("photos", p));

      const res = await fetch(`/api/widget/${slug}/report`, {
        method: "POST",
        body: fd,
        credentials: "omit",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");
      setSubmitted(data.referenceNumber);
    } catch (err: any) {
      setSubmitError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const accentColour = widgetInfo?.brandColour || "#10b981";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-sm">
          <AlertTriangle className="w-10 h-10 text-orange-400 mx-auto mb-3" />
          <h2 className="font-semibold text-gray-800 mb-1">Form unavailable</h2>
          <p className="text-sm text-gray-500">{loadError}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-md p-8 max-w-sm w-full text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: accentColour + "20" }}
          >
            <CheckCircle2 className="w-8 h-8" style={{ color: accentColour }} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Report submitted</h2>
          <p className="text-sm text-gray-500 mb-4">
            Thank you. Your report has been received and your group's responders have been notified.
          </p>
          <div className="bg-gray-50 rounded-xl px-4 py-3 mb-6">
            <p className="text-xs text-gray-400 mb-0.5">Your reference number</p>
            <p className="text-lg font-bold font-mono text-gray-800">{submitted}</p>
          </div>
          <p className="text-xs text-gray-400">
            Keep this reference number for your records.
          </p>
        </div>
        <div className="absolute bottom-4 left-0 right-0 text-center">
          <p className="text-xs text-gray-300">Powered by <span className="font-semibold">IncidentIQ</span></p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 shadow-sm">
        {widgetInfo?.logoUrl ? (
          <img src={widgetInfo.logoUrl} alt={widgetInfo.groupName} className="h-8 w-8 rounded-lg object-cover" />
        ) : (
          <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: accentColour + "20" }}>
            <Shield className="w-4 h-4" style={{ color: accentColour }} />
          </div>
        )}
        <div>
          <p className="font-semibold text-gray-900 text-sm leading-tight">{widgetInfo?.groupName}</p>
          <p className="text-xs text-gray-400">Submit an incident report</p>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto p-4">
        <form onSubmit={handleSubmit} className="max-w-lg mx-auto space-y-4">
          {/* Incident Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Incident type <span className="text-red-500">*</span>
            </label>
            <select
              value={incidentTypeId}
              onChange={e => setIncidentTypeId(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 text-gray-800"
              style={{ "--tw-ring-color": accentColour } as any}
              required
            >
              <option value="">Select incident type…</option>
              {widgetInfo?.incidentTypes.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Severity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Severity <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {SEVERITY_OPTS.map(s => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setSeverity(s.value)}
                  className={`px-3 py-2.5 rounded-xl border-2 text-left transition-all ${
                    severity === s.value ? s.colour + " border-2" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <span className="block text-sm font-semibold">{s.label}</span>
                  <span className="block text-xs opacity-70">{s.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              placeholder="Describe what you saw — where, when, what was happening…"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 resize-none text-gray-800 placeholder-gray-400"
              style={{ "--tw-ring-color": accentColour } as any}
              required
              minLength={10}
            />
          </div>

          {/* Your details (optional) */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3">
            <p className="text-sm font-medium text-gray-700">Your details <span className="text-gray-400 font-normal">(optional)</span></p>
            <input
              type="text"
              value={reporterName}
              onChange={e => setReporterName(e.target.value)}
              placeholder="Your name"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 text-gray-800 placeholder-gray-400"
            />
            <input
              type="email"
              value={reporterEmail}
              onChange={e => setReporterEmail(e.target.value)}
              placeholder="Your email (for follow-up)"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 text-gray-800 placeholder-gray-400"
            />
          </div>

          {/* Location */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Location</p>
                {latitude !== null ? (
                  <p className="text-xs text-gray-400 mt-0.5">{latitude.toFixed(5)}, {longitude?.toFixed(5)} ✓</p>
                ) : (
                  <p className="text-xs text-gray-400 mt-0.5">Tap to capture your current GPS location</p>
                )}
              </div>
              <button
                type="button"
                onClick={handleGps}
                disabled={gpsLoading}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-colors"
                style={{
                  borderColor: latitude !== null ? accentColour : "#e5e7eb",
                  backgroundColor: latitude !== null ? accentColour + "15" : "transparent",
                  color: latitude !== null ? accentColour : "#6b7280",
                }}
              >
                {gpsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                {latitude !== null ? "Update" : "Get GPS"}
              </button>
            </div>
          </div>

          {/* Photos */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4">
            <p className="text-sm font-medium text-gray-700 mb-3">Photos <span className="text-gray-400 font-normal">(optional, up to 4)</span></p>
            {previews.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mb-3">
                {previews.map((src, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {photos.length < 4 && (
              <label className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-gray-300 transition-colors">
                <Camera className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500">Add photo</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  multiple
                  className="hidden"
                  onChange={e => handlePhotos(e.target.files)}
                />
              </label>
            )}
          </div>

          {submitError && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl p-3">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{submitError}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl text-white font-semibold text-sm transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ backgroundColor: accentColour }}
          >
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : "Submit Report"}
          </button>
        </form>
      </div>

      {/* Footer */}
      <div className="text-center py-3 border-t border-gray-100 bg-white">
        <p className="text-xs text-gray-300">Powered by <span className="font-semibold text-gray-400">IncidentIQ</span></p>
      </div>
    </div>
  );
}
