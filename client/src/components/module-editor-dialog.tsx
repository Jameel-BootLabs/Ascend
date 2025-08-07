import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Edit, Plus, Trash2, Save, X, ChevronUp, ChevronDown } from "lucide-react";

const moduleSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  order: z.number().min(1, "Order must be at least 1"),
  estimatedDuration: z.number().min(1, "Duration must be at least 1 minute"),
});

const pageSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  pageOrder: z.number().min(1, "Page order must be at least 1"),
  pageType: z.enum(["text", "image", "video", "ppt_slide"]).default("text"),
});

type ModuleFormData = z.infer<typeof moduleSchema>;
type PageFormData = z.infer<typeof pageSchema>;

interface ModuleEditorDialogProps {
  moduleId?: number;
  children?: React.ReactNode;
  onSuccess?: () => void;
}

export default function ModuleEditorDialog({ moduleId, children, onSuccess }: ModuleEditorDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<number | null>(null);
  const [newPage, setNewPage] = useState(false);

  const isEdit = !!moduleId;

  // Fetch module data if editing
  const { data: module } = useQuery({
    queryKey: ["/api/modules", moduleId],
    enabled: isEdit && open,
    retry: false,
  });

  // Fetch module pages if editing
  const { data: pages = [] } = useQuery({
    queryKey: ["/api/modules", moduleId, "pages"],
    enabled: isEdit && open,
    retry: false,
  });

  const moduleForm = useForm<ModuleFormData>({
    resolver: zodResolver(moduleSchema),
    defaultValues: {
      title: "",
      description: "",
      order: 1,
      estimatedDuration: 30,
    },
  });

  const pageForm = useForm<PageFormData>({
    resolver: zodResolver(pageSchema),
    defaultValues: {
      title: "",
      content: "",
      pageOrder: 1,
      pageType: "text",
    },
  });

  // Update form when module data loads
  useEffect(() => {
    if (module) {
      moduleForm.reset({
        title: module.title,
        description: module.description,
        order: module.order,
        estimatedDuration: module.estimatedDuration,
      });
    }
  }, [module, moduleForm]);

  // Update module mutation
  const updateModuleMutation = useMutation({
    mutationFn: async (data: ModuleFormData) => {
      const url = isEdit ? `/api/modules/${moduleId}` : "/api/modules";
      const method = isEdit ? "PUT" : "POST";
      return await apiRequest(method, url, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/modules"] });
      if (isEdit) {
        queryClient.invalidateQueries({ queryKey: ["/api/modules", moduleId] });
      }
      toast({
        title: "Success",
        description: isEdit ? "Module updated successfully" : "Module created successfully",
      });
      setOpen(false);
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: `Failed to ${isEdit ? "update" : "create"} module`,
        variant: "destructive",
      });
    },
  });

  // Create/update page mutation
  const savePageMutation = useMutation({
    mutationFn: async (data: PageFormData & { id?: number }) => {
      if (data.id) {
        return await apiRequest("PUT", `/api/pages/${data.id}`, data);
      } else {
        return await apiRequest("POST", `/api/modules/${moduleId}/pages`, data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/modules", moduleId, "pages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/modules"] });
      setEditingPage(null);
      setNewPage(false);
      pageForm.reset();
      toast({
        title: "Success",
        description: "Page saved successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to save page",
        variant: "destructive",
      });
    },
  });

  // Delete page mutation
  const deletePageMutation = useMutation({
    mutationFn: async (pageId: number) => {
      return await apiRequest("DELETE", `/api/pages/${pageId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/modules", moduleId, "pages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/modules"] });
      toast({
        title: "Success",
        description: "Page deleted successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete page",
        variant: "destructive",
      });
    },
  });

  const handleModuleSubmit = (data: ModuleFormData) => {
    updateModuleMutation.mutate(data);
  };

  const handlePageSubmit = (data: PageFormData) => {
    const pageData = {
      ...data,
      id: editingPage || undefined,
    };
    savePageMutation.mutate(pageData);
  };

  const startEditingPage = (page: any) => {
    setEditingPage(page.id);
    pageForm.reset({
      title: page.title,
      content: page.content,
      pageOrder: page.pageOrder,
      pageType: page.pageType || "text",
    });
  };

  const startNewPage = () => {
    setNewPage(true);
    pageForm.reset({
      title: "",
      content: "",
      pageOrder: (pages.length || 0) + 1,
      pageType: "text",
    });
  };

  const cancelPageEdit = () => {
    setEditingPage(null);
    setNewPage(false);
    pageForm.reset();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            {isEdit ? "Edit Module" : "Create Module"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Module" : "Create Module"}</DialogTitle>
          <DialogDescription>
            {isEdit 
              ? "Edit module details and manage pages for this training module."
              : "Create a new training module with title, description, and pages."
            }
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="module" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="module">Module Details</TabsTrigger>
            <TabsTrigger value="pages" disabled={!isEdit}>Pages</TabsTrigger>
          </TabsList>

          <TabsContent value="module" className="space-y-4">
            <Form {...moduleForm}>
              <form onSubmit={moduleForm.handleSubmit(handleModuleSubmit)} className="space-y-4">
                <FormField
                  control={moduleForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter module title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={moduleForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter module description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={moduleForm.control}
                    name="order"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Order</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={moduleForm.control}
                    name="estimatedDuration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (minutes)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button type="submit" disabled={updateModuleMutation.isPending}>
                  {updateModuleMutation.isPending ? "Saving..." : (isEdit ? "Update Module" : "Create Module")}
                </Button>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="pages" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Module Pages</h3>
              <Button onClick={startNewPage} disabled={newPage || editingPage !== null}>
                <Plus className="h-4 w-4 mr-2" />
                Add Page
              </Button>
            </div>

            {/* New Page Form */}
            {newPage && (
              <Card>
                <CardHeader>
                  <CardTitle>New Page</CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...pageForm}>
                    <form onSubmit={pageForm.handleSubmit(handlePageSubmit)} className="space-y-4">
                      <FormField
                        control={pageForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Page Title</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter page title" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={pageForm.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Page Content</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Enter page content (supports HTML)" 
                                {...field} 
                                rows={6}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={pageForm.control}
                        name="pageOrder"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Page Order</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex gap-2">
                        <Button type="submit" disabled={savePageMutation.isPending}>
                          {savePageMutation.isPending ? "Saving..." : "Save Page"}
                        </Button>
                        <Button type="button" variant="outline" onClick={cancelPageEdit}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}

            {/* Existing Pages */}
            <div className="space-y-4">
              {pages.map((page: any) => (
                <Card key={page.id}>
                  <CardContent className="p-4">
                    {editingPage === page.id ? (
                      <Form {...pageForm}>
                        <form onSubmit={pageForm.handleSubmit(handlePageSubmit)} className="space-y-4">
                          <FormField
                            control={pageForm.control}
                            name="title"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Page Title</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter page title" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={pageForm.control}
                            name="content"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Page Content</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Enter page content (supports HTML)" 
                                    {...field} 
                                    rows={6}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={pageForm.control}
                            name="pageOrder"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Page Order</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="flex gap-2">
                            <Button type="submit" disabled={savePageMutation.isPending}>
                              {savePageMutation.isPending ? "Saving..." : "Save Changes"}
                            </Button>
                            <Button type="button" variant="outline" onClick={cancelPageEdit}>
                              Cancel
                            </Button>
                          </div>
                        </form>
                      </Form>
                    ) : (
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">{page.title}</h4>
                            <Badge variant="secondary">Page {page.pageOrder}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {page.content.substring(0, 100)}...
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditingPage(page)}
                            disabled={editingPage !== null || newPage}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deletePageMutation.mutate(page.id)}
                            disabled={deletePageMutation.isPending}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}