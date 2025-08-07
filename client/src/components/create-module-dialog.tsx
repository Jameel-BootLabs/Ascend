import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Plus, Upload, FileText, Presentation } from "lucide-react";

const createModuleSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  order: z.number().min(1, "Order must be at least 1"),
  estimatedDuration: z.number().min(1, "Duration must be at least 1 minute"),
});

type CreateModuleFormData = z.infer<typeof createModuleSchema>;

interface CreateModuleDialogProps {
  children?: React.ReactNode;
  onSuccess?: () => void;
}

export default function CreateModuleDialog({ children, onSuccess }: CreateModuleDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadMethod, setUploadMethod] = useState<'manual' | 'ppt'>('manual');

  const form = useForm<CreateModuleFormData>({
    resolver: zodResolver(createModuleSchema),
    defaultValues: {
      title: "",
      description: "",
      order: 1,
      estimatedDuration: 30,
    },
  });

  const createModuleMutation = useMutation({
    mutationFn: async (data: CreateModuleFormData & { file?: File }) => {
      // First create the module
      const moduleResponse = await apiRequest("POST", "/api/modules", {
        title: data.title,
        description: data.description,
        order: data.order,
        estimatedDuration: data.estimatedDuration,
      });
      
      const module = await moduleResponse.json();
      
      // If there's a file, upload it and create pages
      if (data.file) {
        const formData = new FormData();
        formData.append('file', data.file);
        formData.append('moduleId', module.id.toString());
        
        const uploadResponse = await apiRequest("POST", "/api/upload", formData, {
          isFormData: true,
        });
        
        const uploadResult = await uploadResponse.json();
        
        // Create pages from the uploaded PPT
        await apiRequest("POST", "/api/modules/process-ppt", {
          moduleId: module.id,
          uploadResult,
        });
      }
      
      return module;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/modules"] });
      toast({
        title: "Success",
        description: "Module created successfully",
      });
      setOpen(false);
      form.reset();
      setSelectedFile(null);
      setUploadMethod('manual');
      onSuccess?.();
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
        description: "Failed to create module",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: CreateModuleFormData) => {
    createModuleMutation.mutate({
      ...data,
      file: selectedFile || undefined,
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = [
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      ];
      
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please select a PowerPoint file (.ppt or .pptx)",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFile(file);
      
      // Auto-fill title from filename if empty
      if (!form.getValues('title')) {
        const fileName = file.name.replace(/\.[^/.]+$/, "");
        form.setValue('title', fileName);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="bg-primary text-white hover:bg-primary-dark">
            <Plus className="mr-2 h-4 w-4" />
            Create New Module
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Training Module</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Upload Method Selection */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Content Creation Method</Label>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  type="button"
                  variant={uploadMethod === 'manual' ? 'default' : 'outline'}
                  onClick={() => setUploadMethod('manual')}
                  className="flex items-center justify-center h-20"
                >
                  <div className="text-center">
                    <FileText className="mx-auto mb-2 h-6 w-6" />
                    <span className="text-sm">Manual Creation</span>
                  </div>
                </Button>
                <Button
                  type="button"
                  variant={uploadMethod === 'ppt' ? 'default' : 'outline'}
                  onClick={() => setUploadMethod('ppt')}
                  className="flex items-center justify-center h-20"
                >
                  <div className="text-center">
                    <Presentation className="mx-auto mb-2 h-6 w-6" />
                    <span className="text-sm">Upload PowerPoint</span>
                  </div>
                </Button>
              </div>
            </div>

            {/* PowerPoint Upload */}
            {uploadMethod === 'ppt' && (
              <div className="space-y-4">
                <Label htmlFor="ppt-file" className="text-sm font-medium">
                  PowerPoint File (.ppt or .pptx)
                </Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="ppt-file"
                    type="file"
                    accept=".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                    onChange={handleFileChange}
                    className="flex-1"
                  />
                  <Upload className="h-4 w-4 text-gray-400" />
                </div>
                {selectedFile && (
                  <p className="text-sm text-green-600">
                    Selected: {selectedFile.name}
                  </p>
                )}
              </div>
            )}

            {/* Module Details */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Module Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Phishing Awareness" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="estimatedDuration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (minutes)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1"
                        placeholder="30"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Brief description of the training module"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Order</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="1"
                      placeholder="1"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createModuleMutation.isPending || (uploadMethod === 'ppt' && !selectedFile)}
                className="bg-primary text-white hover:bg-primary-dark"
              >
                {createModuleMutation.isPending ? 'Creating...' : 'Create Module'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}