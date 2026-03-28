import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useGetGroup, useListIncidentTypes, useCreateIncidentType } from "@workspace/api-client-react";
import { useGetMe } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { List } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import GroupSettingsLayout from "@/components/layout/GroupSettingsLayout";

export default function GroupSettingsIncidentTypes() {
  const [, params] = useRoute("/g/:slug/settings/incident-types");
  const slug = params?.slug ?? "";
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: group, isLoading } = useGetGroup(slug);
  const { data: user, isLoading: userLoading, isError: userError } = useGetMe();
  const { data: types = [] } = useListIncidentTypes(slug);
  const queryClient = useQueryClient();
  const createIncidentType = useCreateIncidentType();

  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeColour, setNewTypeColour] = useState("#10b981");

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
    navigate(`/login?next=/g/${slug}/settings/incident-types`);
    return null;
  }

  if (!group) {
    return (
      <GroupSettingsLayout groupSlug={slug}>
        <div className="text-slate-400 p-8">Group not found.</div>
      </GroupSettingsLayout>
    );
  }

  const handleAddType = async () => {
    if (!newTypeName.trim()) return;
    try {
      await createIncidentType.mutateAsync({
        groupSlug: slug,
        data: { name: newTypeName.trim(), colour: newTypeColour },
      });
      setNewTypeName("");
      queryClient.invalidateQueries({ queryKey: [`/api/groups/${slug}/incident-types`] });
      queryClient.invalidateQueries({ queryKey: [`/api/groups/${slug}/setup-progress`] });
      toast({ title: "Added", description: `Incident type "${newTypeName}" added` });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to add incident type";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  return (
    <GroupSettingsLayout groupSlug={slug} groupName={group.name}>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white">Incident Types</h2>
        <p className="text-sm text-slate-400 mt-1">
          Define the categories of incidents your members can report. Each incident type gets a colour label, making it easy to filter and analyse reports at a glance. Common examples: Poaching, Fly-tipping, Trespass, Vandalism, Water Pollution.
        </p>
      </div>

      <div className="space-y-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex items-center gap-2">
            <List className="w-4 h-4 text-emerald-400" />
            <h3 className="font-semibold text-white">Incident Types ({types.length})</h3>
          </div>
          <div className="divide-y divide-slate-800">
            {types.map((type) => (
              <div key={type.id} className="px-5 py-3.5 flex items-center gap-3">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: type.colour || "#10b981" }} />
                <span className="text-sm text-white">{type.name}</span>
                {type.description && <span className="text-xs text-slate-500">— {type.description}</span>}
              </div>
            ))}
            {types.length === 0 && (
              <div className="px-5 py-8 text-center">
                <List className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No incident types yet. Add one below to get started.</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h4 className="text-sm font-semibold text-white mb-1">Add Incident Type</h4>
          <p className="text-xs text-slate-500 mb-3">Pick a colour and give the type a clear, concise name. Members will see this list when submitting a report.</p>
          <div className="flex gap-3">
            <input
              type="color"
              value={newTypeColour}
              onChange={(e) => setNewTypeColour(e.target.value)}
              title="Pick a colour"
              className="w-10 h-10 rounded-lg cursor-pointer bg-slate-800 border border-slate-700"
            />
            <input
              type="text"
              value={newTypeName}
              onChange={(e) => setNewTypeName(e.target.value)}
              placeholder="e.g. Poaching, Fly-tipping, Trespass..."
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              onKeyDown={(e) => e.key === "Enter" && handleAddType()}
            />
            <button
              onClick={handleAddType}
              disabled={createIncidentType.isPending || !newTypeName.trim()}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
            >
              {createIncidentType.isPending ? "Adding…" : "Add"}
            </button>
          </div>
        </div>
      </div>
    </GroupSettingsLayout>
  );
}
