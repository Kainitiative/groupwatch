import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Settings, Users, List, CreditCard, Globe, Key, PhoneCall, Share2 } from "lucide-react";
import SidebarLayout from "@/components/layout/SidebarLayout";
import { cn } from "@/lib/utils";

interface GroupSettingsLayoutProps {
  children: ReactNode;
  groupSlug: string;
  groupName?: string;
}

const settingsNav = [
  { id: "profile", label: "Profile & Branding", icon: Settings, path: "profile" },
  { id: "members", label: "Members", icon: Users, path: "members" },
  { id: "incident-types", label: "Incident Types", icon: List, path: "incident-types" },
  { id: "escalation", label: "Escalation Contacts", icon: PhoneCall, path: "escalation" },
  { id: "widget", label: "Public Widget", icon: Globe, path: "widget" },
  { id: "api-keys", label: "API Keys", icon: Key, path: "api-keys" },
  { id: "billing", label: "Billing", icon: CreditCard, path: "billing" },
  { id: "social", label: "Social Media", icon: Share2, path: "social" },
];

export default function GroupSettingsLayout({ children, groupSlug, groupName }: GroupSettingsLayoutProps) {
  const [location] = useLocation();

  return (
    <SidebarLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">{groupName ? `${groupName} — ` : ""}Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">Configure your group's profile, members, integrations and billing.</p>
        </div>

        <div className="flex gap-8 items-start">
          {/* Settings sub-nav */}
          <aside className="w-52 shrink-0 sticky top-8">
            <nav className="space-y-0.5">
              {settingsNav.map(({ id, label, icon: Icon, path }) => {
                const href = `/g/${groupSlug}/settings/${path}`;
                const active = location === href;
                return (
                  <Link
                    key={id}
                    href={href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                      active
                        ? "bg-emerald-600/20 text-emerald-400 border border-emerald-700/40"
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                    )}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {label}
                  </Link>
                );
              })}
            </nav>
          </aside>

          {/* Page content */}
          <div className="flex-1 min-w-0">
            {children}
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
