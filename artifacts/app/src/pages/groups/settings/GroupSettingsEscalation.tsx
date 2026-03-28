import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useGetGroup } from "@workspace/api-client-react";
import { useGetMe } from "@workspace/api-client-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PhoneCall, Pencil, Trash2, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import GroupSettingsLayout from "@/components/layout/GroupSettingsLayout";

type EscalationContact = {
  id: string;
  name: string;
  organisation?: string | null;
  role?: string | null;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
};

const emptyContact = { name: "", organisation: "", role: "", phone: "", email: "", notes: "" };

export default function GroupSettingsEscalation() {
  const [, params] = useRoute("/g/:slug/settings/escalation");
  const slug = params?.slug ?? "";
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: group, isLoading } = useGetGroup(slug);
  const { data: user, isLoading: userLoading, isError: userError } = useGetMe();

  const { data: escalationContacts = [], refetch: refetchContacts } = useQuery<EscalationContact[]>({
    queryKey: [`/api/groups/${slug}/escalation-contacts`],
    queryFn: async () => {
      const res = await fetch(`/api/groups/${slug}/escalation-contacts`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const [newContact, setNewContact] = useState(emptyContact);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [editContact, setEditContact] = useState(emptyContact);

  const createContact = useMutation({
    mutationFn: async (data: typeof emptyContact) => {
      const res = await fetch(`/api/groups/${slug}/escalation-contacts`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create contact");
      return res.json();
    },
    onSuccess: () => { refetchContacts(); setNewContact(emptyContact); toast({ title: "Contact added" }); },
    onError: () => toast({ title: "Error", description: "Failed to add contact", variant: "destructive" }),
  });

  const updateContact = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof emptyContact> }) => {
      const res = await fetch(`/api/groups/${slug}/escalation-contacts/${id}`, {
        method: "PATCH", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update contact");
      return res.json();
    },
    onSuccess: () => { refetchContacts(); setEditingContactId(null); toast({ title: "Contact updated" }); },
    onError: () => toast({ title: "Error", description: "Failed to update contact", variant: "destructive" }),
  });

  const deleteContact = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/groups/${slug}/escalation-contacts/${id}`, {
        method: "DELETE", credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete contact");
    },
    onSuccess: () => { refetchContacts(); toast({ title: "Contact removed" }); },
    onError: () => toast({ title: "Error", description: "Failed to remove contact", variant: "destructive" }),
  });

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
    navigate(`/login?next=/g/${slug}/settings/escalation`);
    return null;
  }

  if (!group) {
    return (
      <GroupSettingsLayout groupSlug={slug}>
        <div className="text-slate-400 p-8">Group not found.</div>
      </GroupSettingsLayout>
    );
  }

  const inputClass = "bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500";

  return (
    <GroupSettingsLayout groupSlug={slug} groupName={group.name}>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white">Escalation Contacts</h2>
        <p className="text-sm text-slate-400 mt-1">
          When a member escalates an incident, they choose from this list to indicate who needs to be contacted or notified. Add wardens, rangers, council officers, emergency services, or any other relevant contacts your group may need to involve.
        </p>
      </div>

      <div className="space-y-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-slate-800">
            <h3 className="font-semibold text-white">Contacts ({escalationContacts.length})</h3>
            <p className="text-xs text-slate-400 mt-1">Members can select from this list when escalating a report.</p>
          </div>

          {escalationContacts.length === 0 ? (
            <div className="px-5 py-10 text-center text-slate-500 text-sm">
              <PhoneCall className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p>No escalation contacts yet.</p>
              <p className="text-xs mt-1">Add contacts below — e.g. wardens, rangers, emergency services, council officers.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {escalationContacts.map((c) => (
                <div key={c.id} className="px-5 py-4">
                  {editingContactId === c.id ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <input value={editContact.name} onChange={e => setEditContact(p => ({ ...p, name: e.target.value }))} placeholder="Name *" className={inputClass} />
                        <input value={editContact.organisation} onChange={e => setEditContact(p => ({ ...p, organisation: e.target.value }))} placeholder="Organisation" className={inputClass} />
                        <input value={editContact.role} onChange={e => setEditContact(p => ({ ...p, role: e.target.value }))} placeholder="Role / Title" className={inputClass} />
                        <input value={editContact.phone} onChange={e => setEditContact(p => ({ ...p, phone: e.target.value }))} placeholder="Phone" className={inputClass} />
                        <input value={editContact.email} onChange={e => setEditContact(p => ({ ...p, email: e.target.value }))} placeholder="Email" className={inputClass} />
                        <input value={editContact.notes} onChange={e => setEditContact(p => ({ ...p, notes: e.target.value }))} placeholder="Notes" className={inputClass} />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => updateContact.mutate({ id: c.id, data: editContact })} disabled={updateContact.isPending || !editContact.name.trim()} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50">
                          <Check className="w-3.5 h-3.5" /> Save
                        </button>
                        <button onClick={() => setEditingContactId(null)} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-medium transition-colors">
                          <X className="w-3.5 h-3.5" /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <PhoneCall className="w-4 h-4 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-white text-sm">{c.name}</span>
                          {c.role && <span className="text-xs text-slate-400">{c.role}</span>}
                          {c.organisation && <span className="text-xs text-slate-500">· {c.organisation}</span>}
                        </div>
                        <div className="flex items-center gap-4 mt-1 flex-wrap">
                          {c.phone && <a href={`tel:${c.phone}`} className="text-xs text-emerald-400 hover:text-emerald-300">{c.phone}</a>}
                          {c.email && <a href={`mailto:${c.email}`} className="text-xs text-slate-400 hover:text-white">{c.email}</a>}
                          {c.notes && <span className="text-xs text-slate-500 italic">{c.notes}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => { setEditingContactId(c.id); setEditContact({ name: c.name ?? "", organisation: c.organisation ?? "", role: c.role ?? "", phone: c.phone ?? "", email: c.email ?? "", notes: c.notes ?? "" }); }} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => { if (confirm(`Remove ${c.name}?`)) deleteContact.mutate(c.id); }} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add new contact form */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h4 className="text-sm font-semibold text-white mb-1">Add Contact</h4>
          <p className="text-xs text-slate-500 mb-3">Only Name is required. Fill in as much detail as you have.</p>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input value={newContact.name} onChange={e => setNewContact(p => ({ ...p, name: e.target.value }))} placeholder="Name *" className={inputClass} />
              <input value={newContact.organisation} onChange={e => setNewContact(p => ({ ...p, organisation: e.target.value }))} placeholder="Organisation" className={inputClass} />
              <input value={newContact.role} onChange={e => setNewContact(p => ({ ...p, role: e.target.value }))} placeholder="Role / Title" className={inputClass} />
              <input value={newContact.phone} onChange={e => setNewContact(p => ({ ...p, phone: e.target.value }))} placeholder="Phone" className={inputClass} />
              <input value={newContact.email} onChange={e => setNewContact(p => ({ ...p, email: e.target.value }))} placeholder="Email" className={inputClass} />
              <input value={newContact.notes} onChange={e => setNewContact(p => ({ ...p, notes: e.target.value }))} placeholder="Notes" className={inputClass} />
            </div>
            <button
              onClick={() => createContact.mutate(newContact)}
              disabled={createContact.isPending || !newContact.name.trim()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
            >
              {createContact.isPending ? "Adding..." : "Add Contact"}
            </button>
          </div>
        </div>
      </div>
    </GroupSettingsLayout>
  );
}
