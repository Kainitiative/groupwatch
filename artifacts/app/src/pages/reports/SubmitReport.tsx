import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useRoute } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useGetGroup, useListIncidentTypes, useCreateReport, useGetMe } from "@workspace/api-client-react";
import { useGroupTerminology } from "@/hooks/useGroupTerminology";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Camera, MapPin, Shield, CheckCircle2, ChevronDown, Mic, MicOff, X, Image, Map, Eye, EyeOff } from "lucide-react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const reportSchema = z.object({
  incidentTypeId: z.string().min(1, "Please select an incident type"),
  severity: z.enum(["low", "medium", "high", "emergency"]),
  description: z.string().min(10, "Description must be at least 10 characters"),
  isAnonymous: z.boolean().default(false),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

type ReportFormData = z.infer<typeof reportSchema>;

const SEVERITY_OPTS = [
  { value: "low", label: "Low", desc: "Minor, non-urgent", colour: "bg-blue-500" },
  { value: "medium", label: "Medium", desc: "Significant, needs attention", colour: "bg-yellow-500" },
  { value: "high", label: "High", desc: "Serious, urgent response needed", colour: "bg-orange-500" },
  { value: "emergency", label: "Emergency", desc: "Immediate action required", colour: "bg-red-600" },
];

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

function MapPicker({ lat, lng, onChange }: { lat?: number; lng?: number; onChange: (lat: number, lng: number) => void }) {
  function ClickHandler() {
    useMapEvents({ click: (e) => onChange(e.latlng.lat, e.latlng.lng) });
    return null;
  }
  return (
    <div className="rounded-xl overflow-hidden border border-slate-700 h-48 mt-2">
      <MapContainer
        center={lat && lng ? [lat, lng] : [53.35, -6.26]}
        zoom={lat && lng ? 14 : 7}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OSM" />
        <ClickHandler />
        {lat && lng && <Marker position={[lat, lng]} />}
      </MapContainer>
      <p className="text-xs text-slate-500 text-center py-1.5">Tap the map to place the incident location</p>
    </div>
  );
}

export default function SubmitReport() {
  const [, params] = useRoute("/report/:slug");
  const [, navigate] = useLocation();
  const slug = params?.slug ?? "";

  const { data: group, isLoading: groupLoading } = useGetGroup(slug);
  const { data: incidentTypes = [], isLoading: typesLoading } = useListIncidentTypes(slug);
  const { data: user } = useGetMe();
  const createReport = useCreateReport();
  const terms = useGroupTerminology((group as any)?.groupType);

  const [submitted, setSubmitted] = useState(false);
  const [submittedRef, setSubmittedRef] = useState("");
  const [locationStatus, setLocationStatus] = useState<"idle" | "requesting" | "granted" | "denied">("idle");
  const [showMap, setShowMap] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [speechAvailable] = useState(() => "SpeechRecognition" in window || "webkitSpeechRecognition" in window);
  const [assignToSelf, setAssignToSelf] = useState(true);
  const recognitionRef = useRef<any>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [authMode, setAuthMode] = useState<"register" | "login">("register");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState("");

  const { register, handleSubmit, watch, setValue, getValues, formState: { errors } } = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: { severity: "medium", isAnonymous: false },
  });

  const selectedSeverity = watch("severity");
  const lat = watch("latitude");
  const lng = watch("longitude");

  const requestLocation = () => {
    setLocationStatus("requesting");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setValue("latitude", pos.coords.latitude);
        setValue("longitude", pos.coords.longitude);
        setLocationStatus("granted");
        setShowMap(false);
      },
      () => {
        setLocationStatus("denied");
        setShowMap(true);
      },
      { timeout: 10000 }
    );
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const compressed = await Promise.all(files.map(f => compressImage(f)));
    const newPhotos = [...photos, ...compressed].slice(0, 10);
    setPhotos(newPhotos);
    const previews = newPhotos.map(f => URL.createObjectURL(f));
    setPhotoPreviews(previews);
  };

  const removePhoto = (i: number) => {
    const updated = photos.filter((_, idx) => idx !== i);
    setPhotos(updated);
    setPhotoPreviews(updated.map(f => URL.createObjectURL(f)));
  };

  const startListening = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = "en-IE";
    rec.onresult = (e: any) => {
      const transcript = Array.from(e.results as SpeechRecognitionResultList)
        .map((r: SpeechRecognitionResult) => r[0].transcript)
        .join(" ");
      const current = getValues("description");
      setValue("description", (current ? current + " " : "") + transcript);
    };
    rec.onend = () => setIsListening(false);
    rec.start();
    recognitionRef.current = rec;
    setIsListening(true);
  }, [getValues, setValue]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const authenticateAndGetSession = async (): Promise<boolean> => {
    setAuthError("");
    const endpoint = authMode === "register" ? "/api/auth/register" : "/api/auth/login";
    const body = authMode === "register"
      ? { name: authName, email: authEmail, password: authPassword }
      : { email: authEmail, password: authPassword };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setAuthError(err.error || (authMode === "register" ? "Registration failed" : "Login failed"));
      return false;
    }
    return true;
  };

  const onSubmit = async (data: ReportFormData) => {
    if (!user) {
      if (!authEmail || !authPassword || (authMode === "register" && !authName)) {
        setAuthError("Please fill in all fields above to " + (authMode === "register" ? "create your account" : "sign in"));
        return;
      }
      const ok = await authenticateAndGetSession();
      if (!ok) return;
    }

    try {
      const report = await createReport.mutateAsync({ groupSlug: slug, data: { ...data, assignToSelf } });

      if (photos.length > 0) {
        const fd = new FormData();
        photos.forEach(f => fd.append("photos", f));
        fetch(`/api/groups/${slug}/reports/${report.referenceNumber}/photos`, {
          method: "POST",
          credentials: "include",
          body: fd,
        }).catch(() => {});
      }

      setSubmittedRef(report.referenceNumber);
      setSubmitted(true);
    } catch (err: any) {
      console.error("Report submission failed:", err);
    }
  };

  if (groupLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold">Group not found</h2>
          <p className="text-slate-400 mt-2">This reporting link may be invalid or expired.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">{terms.reportNoun.charAt(0).toUpperCase() + terms.reportNoun.slice(1)} Submitted</h2>
          <p className="text-slate-400 mb-4">Your {terms.reportNoun} has been sent to {group.name}.</p>
          <div className="bg-slate-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-slate-400 mb-1">Reference Number</p>
            <p className="text-xl font-mono font-bold text-emerald-400">{submittedRef}</p>
            <p className="text-xs text-slate-500 mt-1">Keep this for your records</p>
          </div>
          {!user && (
            <div className="bg-blue-950/50 border border-blue-700 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-blue-300 font-medium mb-1">Track your report</p>
              <p className="text-xs text-blue-400">Log in to track the status of your report and receive updates.</p>
              <button
                onClick={() => navigate(`/login?redirect=/my-reports`)}
                className="mt-3 text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-md transition-colors"
              >
                Sign in →
              </button>
            </div>
          )}
          <button
            onClick={() => { setSubmitted(false); setSubmittedRef(""); setPhotos([]); setPhotoPreviews([]); }}
            className="text-slate-400 hover:text-white text-sm underline transition-colors"
          >
            Submit another report
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-12">
      <div
        className="py-6 px-4 border-b border-slate-800"
        style={group.brandColour ? { borderBottomColor: group.brandColour + "40" } : {}}
      >
        <div className="max-w-lg mx-auto flex items-center gap-3">
          {group.logoUrl ? (
            <img src={group.logoUrl} alt={group.name} className="w-10 h-10 rounded-lg object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
          )}
          <div>
            <h1 className="font-bold text-white text-sm">{group.name}</h1>
            <p className="text-xs text-slate-400">{terms.reportNoun.charAt(0).toUpperCase() + terms.reportNoun.slice(1)} Form</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

          {/* Incident Type */}
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2">
              {terms.reportNoun.charAt(0).toUpperCase() + terms.reportNoun.slice(1)} Type <span className="text-red-400">*</span>
            </label>
            {typesLoading ? (
              <div className="h-12 bg-slate-800 rounded-xl animate-pulse" />
            ) : (
              <div className="relative">
                <select
                  {...register("incidentTypeId")}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3.5 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Select incident type...</option>
                  {incidentTypes.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            )}
            {errors.incidentTypeId && <p className="text-red-400 text-xs mt-1">{errors.incidentTypeId.message}</p>}
          </div>

          {/* Severity */}
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2">
              Severity <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {SEVERITY_OPTS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setValue("severity", opt.value as any)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedSeverity === opt.value
                      ? "border-emerald-500 bg-emerald-500/10"
                      : "border-slate-700 bg-slate-800 hover:border-slate-600"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-2.5 h-2.5 rounded-full ${opt.colour}`} />
                    <span className="text-sm font-medium text-white">{opt.label}</span>
                  </div>
                  <span className="text-xs text-slate-400">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Description with voice-to-text */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-slate-200">
                Description <span className="text-red-400">*</span>
              </label>
              {speechAvailable && (
                <button
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isListening
                      ? "bg-red-600 hover:bg-red-500 text-white animate-pulse"
                      : "bg-slate-700 hover:bg-slate-600 text-slate-300"
                  }`}
                >
                  {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  {isListening ? "Stop" : "Dictate"}
                </button>
              )}
            </div>
            <textarea
              {...register("description")}
              rows={5}
              placeholder="Describe the incident in as much detail as possible. Include what happened, when, and any other relevant information..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
            {isListening && (
              <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
                Listening… speak clearly
              </p>
            )}
            {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description.message}</p>}
          </div>

          {/* Photos */}
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2">
              Photos <span className="text-slate-500 font-normal">(optional, up to 10)</span>
            </label>
            {photoPreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {photoPreviews.map((src, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-slate-800">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      className="absolute top-1 right-1 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center"
                    >
                      <X className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-slate-600 bg-slate-800/50 text-slate-300 hover:border-emerald-600 hover:bg-emerald-500/5 transition-all text-sm"
              >
                <Camera className="w-4 h-4" /> Take Photo
              </button>
              <button
                type="button"
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = "image/*";
                  input.multiple = true;
                  input.onchange = (e) => handlePhotoChange(e as any);
                  input.click();
                }}
                className="flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-slate-600 bg-slate-800/50 text-slate-300 hover:border-emerald-600 hover:bg-emerald-500/5 transition-all text-sm"
              >
                <Image className="w-4 h-4" /> Choose Files
              </button>
            </div>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              className="hidden"
              onChange={handlePhotoChange}
            />
            <p className="text-xs text-slate-500 mt-1.5">Photos are compressed automatically. GPS metadata is preserved for evidence.</p>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2">Location</label>
            <div className="space-y-2">
              <button
                type="button"
                onClick={requestLocation}
                disabled={locationStatus === "requesting" || locationStatus === "granted"}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all ${
                  locationStatus === "granted"
                    ? "border-emerald-600 bg-emerald-500/10 text-emerald-400"
                    : locationStatus === "denied"
                    ? "border-slate-600 bg-slate-800 text-slate-400"
                    : "border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600"
                }`}
              >
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">
                  {locationStatus === "idle" && "Use my current location"}
                  {locationStatus === "requesting" && "Getting location..."}
                  {locationStatus === "granted" && "Location detected ✓"}
                  {locationStatus === "denied" && "GPS unavailable"}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setShowMap(!showMap)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-700 bg-slate-800/50 text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-all text-sm"
              >
                <Map className="w-4 h-4" />
                {showMap ? "Hide map" : (lat && lng ? "Edit pin on map" : "Place on map manually")}
                {lat && lng && !showMap && <span className="ml-auto text-xs text-emerald-400">Pin set ✓</span>}
              </button>
            </div>
            {showMap && (
              <MapPicker
                lat={lat}
                lng={lng}
                onChange={(newLat, newLng) => {
                  setValue("latitude", newLat);
                  setValue("longitude", newLng);
                }}
              />
            )}
            <p className="text-xs text-slate-500 mt-1">Optional — helps responders locate the incident quickly</p>
          </div>

          {/* Anonymous */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                {...register("isAnonymous")}
                className="w-5 h-5 rounded bg-slate-700 border-slate-600 text-emerald-500 focus:ring-emerald-500"
              />
              <div>
                <span className="text-sm font-medium text-slate-200">Submit anonymously</span>
                <p className="text-xs text-slate-500 mt-0.5">Your name will not be visible to responders. Note: your IP address may still be logged for legal compliance.</p>
              </div>
            </label>
          </div>

          {/* Assign to self — only shown if already logged in (responders/admins) */}
          {user && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={assignToSelf}
                  onChange={e => setAssignToSelf(e.target.checked)}
                  className="w-5 h-5 rounded bg-slate-700 border-slate-600 text-emerald-500 focus:ring-emerald-500"
                />
                <div>
                  <span className="text-sm font-medium text-slate-200">Assign this report to me</span>
                  <p className="text-xs text-slate-500 mt-0.5">Uncheck to leave it open for another responder to claim.</p>
                </div>
              </label>
            </div>
          )}

          {/* Auth section — only shown if not logged in */}
          {!user && (
            <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-white">
                  {authMode === "register" ? "Create a free account" : "Sign in to your account"}
                </p>
                <button
                  type="button"
                  onClick={() => { setAuthMode(m => m === "register" ? "login" : "register"); setAuthError(""); }}
                  className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  {authMode === "register" ? "Already have an account?" : "Create new account"}
                </button>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                {authMode === "register"
                  ? "Register to track this report's progress and receive updates."
                  : "Sign in to link this report to your account."}
              </p>
              <div className="space-y-3">
                {authMode === "register" && (
                  <input
                    type="text"
                    value={authName}
                    onChange={e => setAuthName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                )}
                <input
                  type="email"
                  value={authEmail}
                  onChange={e => setAuthEmail(e.target.value)}
                  placeholder="Email address"
                  className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={authPassword}
                    onChange={e => setAuthPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 pr-10 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {authError && <p className="text-red-400 text-xs">{authError}</p>}
              </div>
            </div>
          )}

          {/* Submit error */}
          {createReport.error && (
            <div className="bg-red-950/50 border border-red-700 rounded-xl p-3 text-red-300 text-sm">
              Failed to submit report. Please check your connection and try again.
            </div>
          )}

          <button
            type="submit"
            disabled={createReport.isPending}
            className="w-full py-4 rounded-xl font-semibold text-white text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: group.brandColour || "#10b981" }}
          >
            {createReport.isPending ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting...
              </span>
            ) : terms.submitButtonLabel}
          </button>

          <p className="text-xs text-center text-slate-500">
            By submitting you confirm this is a genuine incident report.
          </p>
        </form>
      </div>
    </div>
  );
}
