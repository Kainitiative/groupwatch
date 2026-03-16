import { Link } from "wouter";
import { format } from "date-fns";
import { FileText, MapPin, ShieldAlert, ArrowRight } from "lucide-react";
import { useGetMe, useGetMyReports } from "@workspace/api-client-react";
import SidebarLayout from "@/components/layout/SidebarLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function MyReports() {
  const { data: user, isLoading: userLoading } = useGetMe();
  const { data: reports, isLoading: reportsLoading } = useGetMyReports();

  if (userLoading || reportsLoading) {
    return (
      <SidebarLayout>
        <div className="space-y-4">
          <Skeleton className="h-10 w-48 rounded-xl mb-8" />
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
        </div>
      </SidebarLayout>
    );
  }

  if (!user) {
    window.location.href = "/login";
    return null;
  }

  return (
    <SidebarLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-extrabold text-foreground tracking-tight">My Reports</h1>
        <p className="text-muted-foreground mt-2">Track the status of incidents you've reported.</p>
      </div>

      {!reports || reports.length === 0 ? (
        <Card className="border-dashed border-2 bg-transparent shadow-none">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No reports yet</h3>
            <p className="text-muted-foreground max-w-sm mb-6">
              When you submit an incident report, it will appear here so you can track its progress.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <Link key={report.id} href={`/g/${report.groupSlug}/reports/${report.referenceNumber}`}>
              <Card className="rounded-2xl shadow-sm border-border/50 hover:shadow-md hover:border-border transition-all cursor-pointer overflow-hidden group">
                <div className="flex flex-col md:flex-row md:items-center">
                  <div className="p-5 flex-1">
                    <div className="flex flex-wrap items-center gap-2 md:gap-4 mb-3">
                      <span className="font-mono text-xs font-bold text-muted-foreground bg-muted px-2.5 py-1 rounded-md">
                        {report.referenceNumber}
                      </span>
                      <span className={`text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-md ${
                        report.status === 'open' ? 'bg-destructive/10 text-destructive' :
                        report.status === 'in_progress' ? 'bg-blue-500/10 text-blue-600' :
                        report.status === 'escalated' ? 'bg-amber-500/10 text-amber-600' :
                        'bg-emerald-500/10 text-emerald-600'
                      }`}>
                        {report.status.replace('_', ' ')}
                      </span>
                      <span className={`text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-md border ${
                        report.severity === 'emergency' ? 'border-destructive text-destructive' :
                        report.severity === 'high' ? 'border-orange-500 text-orange-600' :
                        report.severity === 'medium' ? 'border-amber-500 text-amber-600' :
                        'border-blue-500 text-blue-600'
                      }`}>
                        {report.severity}
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                      {report.incidentTypeName}
                    </h3>
                    
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground mt-3">
                      <div className="flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4" />
                        {report.groupName}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" />
                        {format(new Date(report.submittedAt), "MMM d, yyyy • h:mm a")}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-muted/30 p-5 md:p-6 border-t md:border-t-0 md:border-l border-border/50 flex items-center justify-end md:justify-center">
                    <span className="text-sm font-semibold text-accent group-hover:text-accent flex items-center gap-1 mr-2 md:mr-0 md:group-hover:translate-x-1 transition-transform">
                      View details <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </SidebarLayout>
  );
}
