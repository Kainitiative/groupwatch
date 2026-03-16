import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ArrowLeft } from "lucide-react";
import { useCreateGroup, useGetMe } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

import SidebarLayout from "@/components/layout/SidebarLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const createGroupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  slug: z.string()
    .min(2, "URL slug must be at least 2 characters")
    .max(60)
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  groupType: z.string().min(2, "Group type is required").max(100),
  description: z.string().optional(),
  website: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  contactEmail: z.string().email("Must be a valid email").optional().or(z.literal("")),
});

type CreateGroupFormValues = z.infer<typeof createGroupSchema>;

export default function CreateGroup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createMutation = useCreateGroup();
  
  // ensure auth
  useGetMe({
    query: {
      retry: false,
    }
  });

  const form = useForm<CreateGroupFormValues>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      name: "",
      slug: "",
      groupType: "",
      description: "",
      website: "",
      contactEmail: "",
    },
  });

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    form.setValue("name", name);
    if (!form.formState.dirtyFields.slug) {
      form.setValue("slug", generateSlug(name), { shouldValidate: true });
    }
  };

  const onSubmit = async (data: CreateGroupFormValues) => {
    try {
      // clean empty strings to undefined
      const cleanData = {
        ...data,
        website: data.website || undefined,
        contactEmail: data.contactEmail || undefined,
        description: data.description || undefined,
      };

      const result = await createMutation.mutateAsync({ data: cleanData });
      
      toast({
        title: "Group created successfully!",
        description: "Your 1-month free trial has started.",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/users/me/groups"] });
      setLocation(`/g/${result.slug}/settings`);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Creation failed",
        description: error.message || "Failed to create group. The slug might already be taken.",
      });
    }
  };

  return (
    <SidebarLayout>
      <div className="max-w-2xl mx-auto">
        <Button variant="ghost" onClick={() => setLocation("/dashboard")} className="mb-6 -ml-4 text-muted-foreground">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground">Register your Group</h1>
          <p className="text-muted-foreground mt-2">
            Set up your organization's workspace. You'll get a 1-month free trial, no credit card required.
          </p>
        </div>

        <Card className="rounded-2xl border-border/50 shadow-xl shadow-black/5 overflow-hidden">
          <CardContent className="p-6 sm:p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">Group Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g. River Trust Ireland" 
                          {...field} 
                          onChange={handleNameChange}
                          className="h-12 rounded-xl bg-background" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">URL Slug</FormLabel>
                        <FormControl>
                          <div className="flex relative">
                            <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-input bg-muted text-muted-foreground sm:text-sm">
                              incidentiq.com/g/
                            </span>
                            <Input 
                              placeholder="river-trust" 
                              {...field} 
                              className="h-12 rounded-l-none rounded-r-xl bg-background" 
                            />
                          </div>
                        </FormControl>
                        <FormDescription>This will be your public link.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="groupType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">Group Type</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Angling Club, Neighbourhood Watch" {...field} className="h-12 rounded-xl bg-background" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Tell us a bit about your organisation..." 
                          {...field} 
                          className="rounded-xl bg-background min-h-[100px] resize-y" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">Website (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com" {...field} className="h-12 rounded-xl bg-background" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">Public Contact Email (Optional)</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="contact@example.com" {...field} className="h-12 rounded-xl bg-background" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="pt-4 border-t border-border/50">
                  <Button 
                    type="submit" 
                    className="w-full md:w-auto h-12 px-8 text-base font-semibold bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl shadow-lg shadow-accent/20 transition-all"
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                    Create Group & Start Trial
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  );
}
