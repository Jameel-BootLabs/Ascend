import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { insertTrainingSectionSchema } from "@shared/schema";
import type { TrainingSection } from "@shared/schema";

const sectionFormSchema = insertTrainingSectionSchema.extend({
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  description: z.string().min(1, "Description is required").max(500, "Description must be less than 500 characters"),
  order: z.number().optional(),
});

type SectionFormData = z.infer<typeof sectionFormSchema>;

interface SectionDialogProps {
  section?: TrainingSection;
  children?: React.ReactNode;
  onSuccess?: () => void;
}

export default function SectionDialog({ section, children, onSuccess }: SectionDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!section;

  const form = useForm<SectionFormData>({
    resolver: zodResolver(sectionFormSchema),
    defaultValues: {
      title: section?.title || "",
      description: section?.description || "",
      order: section?.order || 1,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: SectionFormData) => {
      // Provide a default order if not set
      const sectionData = {
        ...data,
        order: data.order || 1,
      };
      
      if (isEditing) {
        return await apiRequest("PUT", `/api/sections/${section.id}`, sectionData);
      } else {
        return await apiRequest("POST", '/api/sections', sectionData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sections'] });
      toast({
        title: isEditing ? "Section updated" : "Section created",
        description: isEditing ? "The section has been updated successfully." : "The new section has been created successfully.",
      });
      setOpen(false);
      form.reset();
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
        description: error.message || `Failed to ${isEditing ? 'update' : 'create'} section`,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: SectionFormData) => {
    console.log('Form submitted with data:', data);
    console.log('Form errors:', form.formState.errors);
    console.log('Form is valid:', form.formState.isValid);
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Section' : 'Create New Section'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Section Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Password Security" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief description of what this section covers..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={mutation.isPending}
                onClick={() => console.log('Create Section button clicked')}
              >
                {mutation.isPending ? 'Saving...' : isEditing ? 'Update Section' : 'Create Section'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}