import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useGetGroup, useListIncidentTypes, useCreateReport, useGetMe } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { AlertTriangle, Camera, MapPin, Shield, CheckCircle2, ChevronDown } from "lucide-react";

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

export default function SubmitReport() {
  const [, params] = useRoute("/report/:slug");
  const [, navigate] = useLocation();
  const slug = params?.slug ?? "";

  const { data: group, isLoading: groupLoading } = useGetGroup(slug);
  const { data: incidentTypes = [], isLoading: typesLoading } = useListIncidentTypes(slug);
  const { data: user } = useGetMe();
  const createReport = useCreateReport();

  const [submitted, setSubmitted] = useState(false);
  const [submittedRef, setSubmittedRef] = useState("");
  const [locationStatus, setLocationStatus] = useState<"idle" | "requesting" | "granted" | "denied">("idle");

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      severity: "medium",
      isAnonymous: false,
    },
  });

  const selectedSeverity = watch("severity");
  const isAnonymous = watch("isAnonymous");

  const requestLocation = () => {
    setLocationStatus("requesting");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setValue("latitude", pos.coords.latitude);
        setValue("longitude", pos.coords.longitude);
        setLocationStatus("granted");
      },
      () => setLocationStatus("denied"),
      { timeout: 10000 }
    );
  };

  const onSubmit = async (data: ReportFormData) => {
    try {
      const report = await createReport.mutateAsync({
        groupSlug: slug,
        data: data,
      });
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
          <h2 className="text-2xl font-bold text-white mb-2">Report Submitted</h2>
          <p className="text-slate-400 mb-4">Your incident has been reported to {group.name}.</p>
          <div className="bg-slate-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-slate-400 mb-1">Reference Number</p>
            <p className="text-xl font-mono font-bold text-emerald-400">{submittedRef}</p>
            <p className="text-xs text-slate-500 mt-1">Keep this for your records</p>
          </div>
          {!user && (
            <div className="bg-blue-950/50 border border-blue-700 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-blue-300 font-medium mb-1">Track your report</p>
              <p className="text-xs text-blue-400">Create a free account to track the status of your report and receive notifications.</p>
              <button
                onClick={() => navigate(`/register?redirect=/my-reports`)}
                className="mt-3 text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-md transition-colors"
              >
                Create account →
              </button>
            </div>
          )}
          <button
            onClick={() => { setSubmitted(false); setSubmittedRef(""); }}
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
      {/* Header */}
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
            <p className="text-xs text-slate-400">Incident Report</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

          {/* Incident Type */}
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2">
              Incident Type <span className="text-red-400">*</span>
            </label>
            {typesLoading ? (
              <div className="h-12 bg-slate-800 rounded-xl animate-pulse" />
            ) : (
              <div className="relative">
                <select
                  {...register("incidentTypeId")}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3.5 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="">Select incident type...</option>
                  {incidentTypes.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            )}
            {errors.incidentTypeId && (
              <p className="text-red-400 text-xs mt-1">{errors.incidentTypeId.message}</p>
            )}
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

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2">
              Description <span className="text-red-400">*</span>
            </label>
            <textarea
              {...register("description")}
              rows={5}
              placeholder="Describe the incident in as much detail as possible. Include what happened, when, and any other relevant information..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
            />
            {errors.description && (
              <p className="text-red-400 text-xs mt-1">{errors.description.message}</p>
            )}
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2">Location</label>
            <button
              type="button"
              onClick={requestLocation}
              disabled={locationStatus === "requesting" || locationStatus === "granted"}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all ${
                locationStatus === "granted"
                  ? "border-emerald-600 bg-emerald-500/10 text-emerald-400"
                  : locationStatus === "denied"
                  ? "border-red-600 bg-red-500/10 text-red-400"
                  : "border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600"
              }`}
            >
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">
                {locationStatus === "idle" && "Add my current location"}
                {locationStatus === "requesting" && "Getting location..."}
                {locationStatus === "granted" && "Location added ✓"}
                {locationStatus === "denied" && "Location access denied"}
              </span>
            </button>
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
                <p className="text-xs text-slate-500 mt-0.5">Your name will not be visible to responders</p>
              </div>
            </label>
          </div>

          {/* Submit */}
          {createReport.error && (
            <div className="bg-red-950/50 border border-red-700 rounded-xl p-3 text-red-300 text-sm">
              Failed to submit report. Please try again.
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
            ) : "Submit Report"}
          </button>

          <p className="text-xs text-center text-slate-500">
            By submitting you confirm this is a genuine incident report.
          </p>
        </form>
      </div>
    </div>
  );
}
