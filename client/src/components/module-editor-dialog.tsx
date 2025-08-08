import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, isUnauthorizedError } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { TrainingModule, TrainingSection, ModulePage } from "../types";

const moduleSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  order: z.number().min(1, "Order must be at least 1"),
  estimatedDuration: z.number().min(1, "Duration must be at least 1 minute").optional(),
  sectionId: z.number().optional(),
});

const pageSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
  pageOrder: z.number().min(1, "Page order must be at least 1"),
  pageType: z.enum(["text", "image", "video", "ppt_slide"]),
});

type ModuleFormData = z.infer<typeof moduleSchema>;
type PageFormData = z.infer<typeof pageSchema>;

interface ModuleEditorDialogProps {
  moduleId?: number;
  children?: React.ReactNode;
  onSuccess?: () => void;
}

export default function ModuleEditorDialog({ moduleId, children, onSuccess }: ModuleEditorDialogProps) {
  const [open, setOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<ModulePage | null>(null);
  const [newPage, setNewPage] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEdit = !!moduleId;

  // Fetch module data
  const { data: module } = useQuery<TrainingModule>({
    queryKey: ["/api/modules", moduleId],
    enabled: !!moduleId,
  });

  // Fetch sections
  const { data: sections = [] } = useQuery<TrainingSection[]>({
    queryKey: ["/api/sections"],
  });

  // Fetch pages
  const { data: pages = [] } = useQuery<ModulePage[]>({
    queryKey: ["/api/modules", moduleId, "pages"],
    enabled: !!moduleId,
  });

  // Module form
  const moduleForm = useForm<ModuleFormData>({
    resolver: zodResolver(moduleSchema),
    defaultValues: {
      title: "",
      description: "",
      order: 1,
      estimatedDuration: undefined,
      sectionId: undefined,
    },
  });

  // Page form
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
        description: module.description || "",
        order: module.order,
        estimatedDuration: module.estimatedDuration || undefined,
        sectionId: module.sectionId || undefined,
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
      moduleId: moduleId!,
      pageOrder: (pages.length || 0) + 1,
    };
    savePageMutation.mutate(pageData);
  };

  const startEditingPage = (page: ModulePage) => {
    setEditingPage(page);
    setNewPage(false);
    pageForm.reset({
      title: page.title || "",
      content: page.content || "",
      pageOrder: page.pageOrder,
      pageType: page.pageType || "text",
    });
  };

  const startNewPage = () => {
    setNewPage(true);
    setEditingPage(null);
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

  const handleDeletePage = (pageId: number) => {
    if (confirm("Are you sure you want to delete this page?")) {
      deletePageMutation.mutate(pageId);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || <Button>{isEdit ? "Edit Module" : "Create Module"}</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Module" : "Create Module"}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Module Form */}
          <div className="space-y-4">
            <Form {...moduleForm}>
              <form onSubmit={moduleForm.handleSubmit(handleModuleSubmit)} className="space-y-4">
                <FormField
                  control={moduleForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                        <Textarea {...field} />
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
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
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
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={moduleForm.control}
                  name="sectionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Section</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
                        value={field.value?.toString() || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a section" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {sections.map((section) => (
                            <SelectItem key={section.id} value={section.id.toString()}>
                              {section.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={updateModuleMutation.isPending}>
                  {updateModuleMutation.isPending ? "Saving..." : isEdit ? "Update Module" : "Create Module"}
                </Button>
              </form>
            </Form>
          </div>

          {/* Pages Management */}
          {isEdit && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Pages</h3>
                <Button onClick={startNewPage} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Page
                </Button>
              </div>

              {/* Page Form */}
              {(editingPage || newPage) && (
                <div className="border rounded-lg p-4 space-y-4">
                  <Form {...pageForm}>
                    <form onSubmit={pageForm.handleSubmit(handlePageSubmit)} className="space-y-4">
                      <FormField
                        control={pageForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Page Title</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={pageForm.control}
                        name="pageType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Page Type</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="text">Text</SelectItem>
                                <SelectItem value="image">Image</SelectItem>
                                <SelectItem value="video">Video</SelectItem>
                                <SelectItem value="ppt_slide">PPT Slide</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={pageForm.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Content</FormLabel>
                            <FormControl>
                              <Textarea {...field} rows={4} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex space-x-2">
                        <Button type="submit" disabled={savePageMutation.isPending}>
                          {savePageMutation.isPending ? "Saving..." : "Save Page"}
                        </Button>
                        <Button type="button" variant="outline" onClick={cancelPageEdit}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>
              )}

              {/* Pages List */}
              <div className="space-y-2">
                {pages.map((page: ModulePage) => (
                  <div key={page.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{page.title || `Page ${page.pageOrder}`}</p>
                      <p className="text-sm text-gray-500 capitalize">{page.pageType}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEditingPage(page)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeletePage(page.id)}
                        disabled={deletePageMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}