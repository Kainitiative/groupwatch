import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useGetGroup } from "@workspace/api-client-react";
import { useGetMe } from "@workspace/api-client-react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Key, Copy, Code2, CheckCircle2, Plus, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import GroupSettingsLayout from "@/components/layout/GroupSettingsLayout";

type ApiKey = {
  id: string;
  label: string | null;
  keyPrefix: string;
  isActive: boolean;
  lastUsedAt: string | null;
  createdAt: string;
};

export default function GroupSettingsApiKeys() {
  const [, params] = useRoute("/g/:slug/settings/api-keys");
  const slug = params?.slug ?? "";
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: group, isLoading } = useGetGroup(slug);
  const { data: user, isLoading: userLoading, isError: userError } = useGetMe();

  const [showCreate, setShowCreate] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);

  const { data: keys = [], isLoading: keysLoading } = useQuery<ApiKey[]>({
    queryKey: ["api-keys", slug],
    queryFn: async () => {
      const res = await fetch(`/api/groups/${slug}/api-keys`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load API keys");
      return res.json();
    },
    enabled: !!group,
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
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unknown error occurred";
      toast({ title: "Error", description: message, variant: "destructive" });
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
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unknown error occurred";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setRevoking(null);
    }
  };

  if (isLoading) {
    return (
      <GroupSettingsLayout groupSlug={slug}>
        <div className="flex items-center justify-center h-64">
          <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </GroupSettingsLayout>
    );
  }

  if (!userLoading && (userError || !user)) {
    navigate(`/login?next=/g/${slug}/settings/api-keys`);
    return null;
  }

  if (!group) {
    return (
      <GroupSettingsLayout groupSlug={slug}>
        <div className="text-slate-400 p-8">Group not found.</div>
      </GroupSettingsLayout>
    );
  }

  const baseUrl = typeof window !== "undefined" ? `${window.location.origin}/api/v1` : "https://groupwatchplatform.com/api/v1";

  return (
    <GroupSettingsLayout groupSlug={slug} groupName={group.name}>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white">API Keys</h2>
        <p className="text-sm text-slate-400 mt-1">
          The GroupWatch REST API lets you read and write incident data programmatically. Use it to build integrations, push data to your own systems, or automate workflows. API keys are scoped to this group — a key can only access data within <strong className="text-slate-300">{group.name}</strong>.
        </p>
      </div>

      <div className="space-y-6">
        {/* What is the API? */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Code2 className="w-4 h-4 text-emerald-400" />
            <h3 className="font-semibold text-white text-sm">What can you do with the API?</h3>
          </div>
          <ul className="space-y-2">
            {[
              "Pull all incidents into your own spreadsheet, CMS, or database",
              "Create incidents programmatically from external systems or IoT sensors",
              "List incident types to build custom reporting forms",
              "Integrate with tools like Zapier, Make (Integromat), or n8n",
              "Build your own dashboard or mobile app on top of GroupWatch data",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-slate-300">
                <span className="text-emerald-500 mt-1 shrink-0">•</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Authentication example */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="font-semibold text-white mb-3 text-sm">How to authenticate</h3>
          <p className="text-xs text-slate-400 mb-3">
            Include your API key in the <code className="text-slate-200 bg-slate-800 px-1.5 py-0.5 rounded">Authorization</code> header of every request:
          </p>
          <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-emerald-300 overflow-x-auto font-mono leading-relaxed">{`fetch("${baseUrl}/groups/${slug}/incidents", {
  headers: {
    "Authorization": "Bearer YOUR_API_KEY"
  }
})`}</pre>
          <div className="flex items-center justify-between mt-3">
            <p className="text-xs text-slate-500">Replace <code className="text-slate-300">YOUR_API_KEY</code> with the key you create below.</p>
            <a
              href="https://groupwatchplatform.com/help#api"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors shrink-0"
            >
              <ExternalLink className="w-3 h-3" />
              View API docs
            </a>
          </div>
        </div>

        {/* REST API reference */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="font-semibold text-white mb-4 text-sm">Available Endpoints</h3>
          <div className="space-y-2 font-mono text-xs">
            {[
              { method: "GET",  path: `/groups/${slug}/incident-types`, note: "List incident types" },
              { method: "GET",  path: `/groups/${slug}/incidents`,      note: "List incidents" },
              { method: "POST", path: `/groups/${slug}/incidents`,      note: "Create an incident" },
            ].map(({ method, path, note }) => (
              <div key={path} className="flex items-center gap-3 bg-slate-800 rounded-lg px-3 py-2.5">
                <span className={`shrink-0 w-10 text-center text-xs font-bold ${method === "GET" ? "text-blue-400" : "text-emerald-400"}`}>{method}</span>
                <span className="text-slate-300 flex-1 truncate">/api/v1{path}</span>
                <span className="text-slate-500 shrink-0 hidden sm:block">{note}</span>
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

        {/* Manage keys */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h3 className="font-semibold text-white">Your API Keys</h3>
              <p className="text-sm text-slate-400 mt-0.5">Create a key for each integration or system you connect. Revoke keys you no longer use.</p>
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

          {keysLoading ? (
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
                <p className="text-sm text-emerald-400/80">This key will only be shown once. Store it somewhere safe (e.g. a password manager).</p>
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
      </div>
    </GroupSettingsLayout>
  );
}
