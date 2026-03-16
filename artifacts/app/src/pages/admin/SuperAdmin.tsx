import { useState } from "react";
import { format } from "date-fns";
import { ShieldCheck, Activity, Users, CreditCard, ChevronRight, CheckCircle2 } from "lucide-react";
import { useGetMe, useAdminListGroups, useGetRevenueOverview, useAdminActivateGroup } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import SidebarLayout from "@/components/layout/SidebarLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function SuperAdmin() {
  const { data: user, isLoading: userLoading } = useGetMe();
  const { data: groupsData, isLoading: groupsLoading } = useAdminListGroups({ limit: 50, page: 1 });
  const { data: revenue, isLoading: revLoading } = useGetRevenueOverview();
  const activateMutation = useAdminActivateGroup();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleActivate = async (slug: string) => {
    try {
      await activateMutation.mutateAsync({ groupSlug: slug });
      toast({ title: "Group activated manually" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/revenue"] });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Activation failed", description: error.message });
    }
  };

  if (userLoading || groupsLoading || revLoading) {
    return (
      <SidebarLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64 rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
          </div>
          <Skeleton className="h-96 rounded-2xl mt-8" />
        </div>
      </SidebarLayout>
    );
  }

  if (!user?.isSuperAdmin) {
    return (
      <SidebarLayout>
        <Card className="border-destructive/20 bg-destructive/5 shadow-none">
          <CardContent className="flex flex-col items-center py-12 text-center text-destructive">
            <ShieldCheck className="w-12 h-12 mb-4 opacity-80" />
            <h2 className="text-2xl font-bold">Access Denied</h2>
            <p className="mt-2">You do not have super-admin privileges.</p>
          </CardContent>
        </Card>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-extrabold text-foreground tracking-tight">Super Admin</h1>
        <p className="text-muted-foreground mt-1">Platform overview and management.</p>
      </div>

      {revenue && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10">
          <Card className="rounded-2xl shadow-md border-border/50 bg-gradient-to-br from-card to-card/50">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-primary/10 p-2.5 rounded-xl">
                  <CreditCard className="w-5 h-5 text-primary" />
                </div>
              </div>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">Estimated MRR</p>
              <h3 className="text-3xl font-bold font-display">€{revenue.estimatedMrrEuros}</h3>
            </CardContent>
          </Card>
          
          <Card className="rounded-2xl shadow-md border-border/50">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-emerald-500/10 p-2.5 rounded-xl">
                  <Activity className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">Active Groups</p>
              <h3 className="text-3xl font-bold font-display">{revenue.activeMonthly + revenue.activeAnnual}</h3>
              <p className="text-xs text-muted-foreground mt-2">{revenue.activeMonthly} Mo / {revenue.activeAnnual} Yr</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-md border-border/50">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-amber-500/10 p-2.5 rounded-xl">
                  <Activity className="w-5 h-5 text-amber-600" />
                </div>
              </div>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">In Trial</p>
              <h3 className="text-3xl font-bold font-display">{revenue.trialGroups}</h3>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-md border-border/50">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-blue-500/10 p-2.5 rounded-xl">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">Total Groups</p>
              <h3 className="text-3xl font-bold font-display">{revenue.totalGroups}</h3>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="rounded-2xl shadow-xl shadow-black/5 border-border/50 overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border/50">
          <CardTitle>All Groups</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Group Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Reports</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupsData?.groups.map((group) => (
                  <TableRow key={group.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{group.name}</span>
                        <span className="text-xs text-muted-foreground font-normal">/{group.slug}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`
                        ${group.subscriptionStatus === 'active' ? 'border-emerald-500 text-emerald-600 bg-emerald-500/10' : ''}
                        ${group.subscriptionStatus === 'trial' ? 'border-amber-500 text-amber-600 bg-amber-500/10' : ''}
                        ${group.subscriptionStatus === 'past_due' ? 'border-destructive text-destructive bg-destructive/10' : ''}
                        ${group.subscriptionStatus === 'cancelled' ? 'border-muted-foreground text-muted-foreground bg-muted' : ''}
                      `}>
                        {group.subscriptionStatus.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>{group.memberCount}</TableCell>
                    <TableCell>{group.reportCount}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(group.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      {group.subscriptionStatus !== 'active' && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="rounded-lg hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200"
                          onClick={() => handleActivate(group.slug)}
                          disabled={activateMutation.isPending}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" /> Force Active
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {!groupsData?.groups.length && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No groups found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </SidebarLayout>
  );
}
