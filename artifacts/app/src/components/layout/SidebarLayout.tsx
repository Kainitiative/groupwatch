import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  FileText, 
  Settings, 
  Menu, 
  LogOut, 
  ShieldAlert,
  Users,
  Building,
  Plus,
  BarChart2,
  Map
} from "lucide-react";
import { useGetMe, useGetMyGroups, useLogout } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface SidebarLayoutProps {
  children: ReactNode;
}

export default function SidebarLayout({ children }: SidebarLayoutProps) {
  const [location] = useLocation();
  const { data: user } = useGetMe();
  const { data: groups } = useGetMyGroups();
  const { mutate: logout } = useLogout();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout(undefined, {
      onSuccess: () => {
        queryClient.clear();
        window.location.href = "/login";
      }
    });
  };

  const NavLinks = () => (
    <div className="space-y-6">
      <div>
        <div className="px-3 mb-2 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
          Overview
        </div>
        <div className="space-y-1">
          <Link href="/dashboard" className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
            location === "/dashboard" 
              ? "bg-accent text-accent-foreground shadow-md shadow-accent/20" 
              : "text-sidebar-foreground/80 hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground"
          )}>
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Link>
          <Link href="/my-reports" className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
            location === "/my-reports" 
              ? "bg-accent text-accent-foreground shadow-md shadow-accent/20" 
              : "text-sidebar-foreground/80 hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground"
          )}>
            <FileText className="w-4 h-4" />
            My Reports
          </Link>
        </div>
      </div>

      {groups && groups.length > 0 && (
        <div>
          <div className="px-3 mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
              My Groups
            </span>
            {!groups?.some(g => g.myRole === "admin") && (
              <Link href="/groups/new" className="text-sidebar-foreground/50 hover:text-accent transition-colors">
                <Plus className="w-4 h-4" />
              </Link>
            )}
          </div>
          <div className="space-y-4 mt-3">
            {groups.map((group) => (
              <div key={group.id} className="space-y-1">
                <Link href={`/g/${group.slug}`} className="flex items-center gap-2 px-3 py-1 text-sm font-semibold text-sidebar-foreground truncate hover:text-accent transition-colors">
                  <div className="w-6 h-6 rounded-md bg-sidebar-foreground/10 flex items-center justify-center overflow-hidden shrink-0">
                    {group.logoUrl ? (
                      <img src={group.logoUrl} alt={group.name} className="w-full h-full object-cover" />
                    ) : (
                      <Building className="w-3 h-3 text-sidebar-foreground/70" />
                    )}
                  </div>
                  <span className="truncate">{group.name}</span>
                </Link>
                <div className="pl-11 space-y-1">
                  {(group.myRole === 'admin' || group.myPermissions.canViewDashboard) && (
                    <Link href={`/g/${group.slug}/reports`} className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors",
                      location === `/g/${group.slug}/reports` || location.startsWith(`/g/${group.slug}/reports/`)
                        ? "text-accent bg-accent/10 font-medium" 
                        : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-foreground/5"
                    )}>
                      <FileText className="w-3.5 h-3.5" />
                      Reports
                    </Link>
                  )}
                  {(group.myRole === 'admin' || group.myPermissions.canViewDashboard) && (
                    <Link href={`/g/${group.slug}/analytics`} className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors",
                      location === `/g/${group.slug}/analytics`
                        ? "text-accent bg-accent/10 font-medium" 
                        : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-foreground/5"
                    )}>
                      <BarChart2 className="w-3.5 h-3.5" />
                      Analytics
                    </Link>
                  )}
                  {group.myRole === 'admin' && (
                    <Link href={`/g/${group.slug}/map`} className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors",
                      location === `/g/${group.slug}/map`
                        ? "text-accent bg-accent/10 font-medium" 
                        : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-foreground/5"
                    )}>
                      <Map className="w-3.5 h-3.5" />
                      Map Boundaries
                    </Link>
                  )}
                  {group.myRole === 'admin' && (
                    <Link href={`/g/${group.slug}/settings`} className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors",
                      location.startsWith(`/g/${group.slug}/settings`)
                        ? "text-accent bg-accent/10 font-medium" 
                        : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-foreground/5"
                    )}>
                      <Settings className="w-3.5 h-3.5" />
                      Settings
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {user?.isSuperAdmin && (
        <div>
          <div className="px-3 mb-2 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
            Platform
          </div>
          <div className="space-y-1">
            <Link href="/admin" className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
              location === "/admin" 
                ? "bg-accent text-accent-foreground shadow-md shadow-accent/20" 
                : "text-sidebar-foreground/80 hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground"
            )}>
              <ShieldAlert className="w-4 h-4" />
              Super Admin
            </Link>
          </div>
        </div>
      )}
    </div>
  );

  const UserFooter = () => (
    <div className="p-4 border-t border-sidebar-border bg-sidebar-foreground/5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <Avatar className="h-9 w-9 border border-sidebar-border">
            <AvatarImage src={user?.avatarUrl || ""} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {user?.name?.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="truncate">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.name}</p>
            <p className="text-xs text-sidebar-foreground/60 truncate">{user?.email}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={handleLogout} className="text-sidebar-foreground/60 hover:text-destructive hover:bg-destructive/10 shrink-0">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 flex-col bg-sidebar border-r border-sidebar-border shadow-xl shadow-black/5 shrink-0 z-10">
        <div className="p-6">
          <Link href="/dashboard" className="flex items-center">
            <img src={`${import.meta.env.BASE_URL}images/logo-transparent.png`} alt="GroupWatch Platform" className="h-9 w-auto object-contain" />
          </Link>
        </div>
        
        <div className="flex-1 overflow-y-auto px-4 py-2 scrollbar-hide">
          <NavLinks />
        </div>
        
        <UserFooter />
      </aside>

      {/* Mobile Wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-card border-b border-border z-20">
          <Link href="/dashboard" className="flex items-center">
            <img src={`${import.meta.env.BASE_URL}images/logo-banner.png`} alt="GroupWatch Platform" className="h-8 w-auto object-contain rounded-md" />
          </Link>
          
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="border-border">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[80vw] max-w-sm p-0 bg-sidebar border-r-sidebar-border flex flex-col">
              <div className="p-6">
                <div className="flex items-center">
                  <img src={`${import.meta.env.BASE_URL}images/logo-transparent.png`} alt="GroupWatch Platform" className="h-9 w-auto object-contain" />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-2">
                <NavLinks />
              </div>
              <UserFooter />
            </SheetContent>
          </Sheet>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto relative">
          <div className="max-w-6xl mx-auto w-full p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
