import { Link } from "wouter";
import { Plus, ShieldAlert, Users, Calendar, ArrowRight } from "lucide-react";
import { useGetMe, useGetMyGroups, useGetMyReports } from "@workspace/api-client-react";
import SidebarLayout from "@/components/layout/SidebarLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";

export default function Dashboard() {
  const { data: user, isLoading: userLoading } = useGetMe();
  const { data: groups, isLoading: groupsLoading } = useGetMyGroups();
  const { data: reports, isLoading: reportsLoading } = useGetMyReports();

  if (userLoading || groupsLoading || reportsLoading) {
    return (
      <SidebarLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64 rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton className="h-48 rounded-2xl" />
            <Skeleton className="h-48 rounded-2xl" />
          </div>
        </div>
      </SidebarLayout>
    );
  }

  // Ensure user is authenticated, otherwise redirect (could be handled in a wrapper, but safe here)
  if (!user) {
    window.location.href = "/login";
    return null;
  }

  return (
    <SidebarLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-extrabold text-foreground tracking-tight">
            Welcome back, {user.name.split(' ')[0]}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Here's an overview of your groups and recent activity.</p>
        </div>
        {!groups?.some(g => g.myRole === "admin") && (
          <Link href="/groups/new">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-xl font-semibold">
              <Plus className="w-4 h-4 mr-2" /> Create Group
            </Button>
          </Link>
        )}
      </div>

      <div className="mb-10">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-accent" />
          Your Groups
        </h2>
        
        {!groups || groups.length === 0 ? (
          <Card className="border-dashed border-2 bg-transparent shadow-none">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-2">You aren't in any groups yet</h3>
              <p className="text-muted-foreground max-w-sm mb-6">
                Create a group to start managing incident reports for your community, or ask an admin for a join link.
              </p>
              {!groups?.some(g => g.myRole === "admin") && (
                <Link href="/groups/new">
                  <Button className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-xl shadow-lg">
                    Create a New Group
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => (
              <Card key={group.id} className="rounded-2xl overflow-hidden shadow-lg shadow-black/5 border-border/50 hover:shadow-xl hover:border-border transition-all group/card">
                {group.logoUrl ? (
                  <div className="h-24 w-full relative">
                    <img src={group.logoUrl} alt={group.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>
                ) : (
                  <div className="h-24 w-full bg-gradient-to-r from-primary to-primary/80 relative">
                    <img 
                      src={`${import.meta.env.BASE_URL}images/placeholder-group.png`} 
                      alt="Placeholder" 
                      className="w-full h-full object-cover opacity-30 mix-blend-overlay"
                    />
                  </div>
                )}
                
                <CardContent className="p-5 relative">
                  <div className="absolute -top-12 left-5 w-16 h-16 bg-card rounded-xl border-2 border-card shadow-md flex items-center justify-center overflow-hidden">
                    {group.logoUrl ? (
                      <img src={group.logoUrl} className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-display font-bold text-2xl text-primary">{group.name.substring(0,2).toUpperCase()}</span>
                    )}
                  </div>
                  
                  <div className="mt-6">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-lg leading-tight truncate pr-2">{group.name}</h3>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shrink-0 ${
                        group.myRole === 'admin' ? 'bg-primary/10 text-primary' :
                        group.myRole === 'responder' ? 'bg-accent/10 text-accent' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {group.myRole}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{group.groupType}</p>
                    
                    <div className="flex gap-2">
                      <Link href={`/g/${group.slug}`} className="flex-1">
                        <Button variant="outline" className="w-full rounded-xl text-xs font-semibold h-9">
                          View Page
                        </Button>
                      </Link>
                      {(group.myRole === 'admin' || group.myPermissions.canViewDashboard) && (
                        <Link href={`/g/${group.slug}/reports`} className="flex-1">
                          <Button className="w-full bg-primary hover:bg-primary/90 rounded-xl text-xs font-semibold h-9">
                            Dashboard
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Your Recent Submissions
          </h2>
          {reports && reports.length > 0 && (
            <Link href="/my-reports" className="text-sm font-semibold text-accent flex items-center hover:underline">
              View all <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          )}
        </div>

        {!reports || reports.length === 0 ? (
          <Card className="bg-card/50 shadow-none border-border/50">
            <CardContent className="p-8 text-center text-muted-foreground">
              You haven't submitted any reports yet.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {reports.slice(0, 5).map(report => (
              <Link key={report.id} href={`/g/${report.groupSlug}/reports/${report.referenceNumber}`}>
                <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm hover:shadow-md hover:border-border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                        {report.referenceNumber}
                      </span>
                      <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        report.status === 'open' ? 'bg-destructive/10 text-destructive' :
                        report.status === 'in_progress' ? 'bg-blue-500/10 text-blue-600' :
                        report.status === 'escalated' ? 'bg-amber-500/10 text-amber-600' :
                        'bg-emerald-500/10 text-emerald-600'
                      }`}>
                        {report.status.replace('_', ' ')}
                      </span>
                    </div>
                    <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {report.incidentTypeName}
                    </h4>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <span>{report.groupName}</span>
                      <span>•</span>
                      <span>{formatDate(report.submittedAt)}</span>
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" className="hidden sm:flex self-center">
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
