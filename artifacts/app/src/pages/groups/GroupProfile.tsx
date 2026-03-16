import { useRoute, useLocation } from "wouter";
import { useGetGroup, useListIncidentTypes, useGetMe } from "@workspace/api-client-react";
import { Shield, ExternalLink, FileText, Users, Map } from "lucide-react";
import { motion } from "framer-motion";
import PublicLayout from "@/components/layout/PublicLayout";

export default function GroupProfile() {
  const [, params] = useRoute("/g/:slug");
  const [, navigate] = useLocation();
  const slug = params?.slug ?? "";

  const { data: group, isLoading } = useGetGroup(slug);
  const { data: types = [] } = useListIncidentTypes(slug);
  const { data: user } = useGetMe();

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </PublicLayout>
    );
  }

  if (!group) {
    return (
      <PublicLayout>
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Group not found</h2>
            <p className="text-slate-400">This group may not exist or is not yet public.</p>
          </div>
        </div>
      </PublicLayout>
    );
  }

  const accentColor = group.brandColour || "#10b981";

  return (
    <PublicLayout>
      <div className="min-h-screen bg-slate-950">
        {/* Cover */}
        <div
          className="h-40 relative"
          style={{
            background: group.coverImageUrl
              ? `url(${group.coverImageUrl}) center/cover no-repeat`
              : `linear-gradient(135deg, ${accentColor}20 0%, ${accentColor}05 100%)`,
            borderBottom: `1px solid ${accentColor}30`,
          }}
        />

        <div className="max-w-4xl mx-auto px-4 -mt-12 pb-16">
          {/* Group header */}
          <div className="flex items-end gap-4 mb-6">
            <div
              className="w-20 h-20 rounded-2xl border-4 border-slate-950 flex items-center justify-center overflow-hidden bg-slate-800"
              style={{ borderColor: accentColor + "30" }}
            >
              {group.logoUrl ? (
                <img src={group.logoUrl} alt={group.name} className="w-full h-full object-cover" />
              ) : (
                <Shield className="w-8 h-8 text-emerald-400" />
              )}
            </div>
            <div className="flex-1 pb-2">
              <h1 className="text-2xl font-bold text-white">{group.name}</h1>
              <p className="text-slate-400 text-sm mt-0.5">{group.groupType} · {group.memberCount} members</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main column */}
            <div className="lg:col-span-2 space-y-6">
              {group.description && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                  <h2 className="font-semibold text-white mb-3">About</h2>
                  <p className="text-slate-300 text-sm leading-relaxed">{group.description}</p>
                </div>
              )}

              {types.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                  <h2 className="font-semibold text-white mb-3">What we track</h2>
                  <div className="flex flex-wrap gap-2">
                    {types.map((t) => (
                      <span
                        key={t.id}
                        className="px-3 py-1 rounded-full text-sm border"
                        style={{
                          borderColor: t.colour || accentColor + "50",
                          color: t.colour || accentColor,
                          backgroundColor: (t.colour || accentColor) + "15",
                        }}
                      >
                        {t.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Report button */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(`/report/${slug}`)}
                className="w-full py-4 rounded-xl font-semibold text-white text-base flex items-center justify-center gap-2 shadow-lg transition-all hover:opacity-90"
                style={{ backgroundColor: accentColor }}
              >
                <FileText className="w-4 h-4" />
                Submit an Incident Report
              </motion.button>

              {/* Links */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                {group.website && (
                  <a
                    href={group.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 text-slate-500" />
                    {group.website.replace(/^https?:\/\//, "")}
                  </a>
                )}
                {group.contactEmail && (
                  <a
                    href={`mailto:${group.contactEmail}`}
                    className="flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors"
                  >
                    <FileText className="w-4 h-4 text-slate-500" />
                    {group.contactEmail}
                  </a>
                )}
              </div>

              {/* Member CTA */}
              {!user && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                  <h3 className="text-sm font-semibold text-white mb-1">Are you a member?</h3>
                  <p className="text-xs text-slate-400 mb-3">Sign in to track your reports and receive notifications.</p>
                  <button
                    onClick={() => navigate(`/login`)}
                    className="w-full py-2 text-sm font-medium text-white bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                  >
                    Sign In
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
